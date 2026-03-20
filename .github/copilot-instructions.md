# Stadsgezicht Vastgoedbeheer - AI Agent Instructions

## Architecture Overview

**Hybrid Data Strategy**: Firebase Realtime Database + Microsoft 365 SharePoint
- **Firebase**: Real-time operational data (panden, huurders, contracten, onderhoud, transacties)
- **SharePoint**: Document storage, email archival, Copilot indexing
- **No backend server**: Pure client-side SPA with Firebase SDK and Microsoft Graph API

**Authentication Modes**:
1. **Entra ID SSO**: Microsoft 365 enterprise login (production)
2. **Demo Mode**: localStorage-based in-memory database (no auth required)

## Critical Patterns

### Dual-Mode Database Operations

ALL database operations MUST check for demo mode first:

```javascript
// ✅ CORRECT - Always check demo mode
async function dbGet(path, id) {
    if (typeof isDemoMode === 'function' && isDemoMode()) {
        const demoHelpers = getDemoDbHelpers();
        return demoHelpers.dbGet(path, id);
    }
    // Firebase operations...
}

// ❌ WRONG - Direct Firebase access
const data = await database.ref('panden').once('value');
```

**Key Files**: `js/db-helpers.js` (wrapper functions), `js/demo-data.js` (demo DB implementation)

### Authentication Flow

Pages use `ensureAuthenticated()` from `js/app-init.js` on DOMContentLoaded:
```javascript
document.addEventListener('DOMContentLoaded', async () => {
    await ensureAuthenticated(); // Redirects to login if not authenticated
    await loadData();
});
```

Demo mode activated via `#demo` hash or clicking "Demo Modus" button on login.

### CSS Architecture - Light Mode Only

**IMPORTANT**: Dark mode media query is DISABLED in `css/enhancements.css`:
```css
/* Dark Mode Support - DISABLED (Light mode only) */
/* @media (prefers-color-scheme: dark) { ... } */
```

**Color Scheme**:
- CSS variables in `:root` (styles.css): `--primary-color: #1e3a5f`, `--accent-color: #c69c6d`
- Background: `#fafbfc` (off-white), cards: `#ffffff`
- NO black backgrounds anywhere (user requirement)
- Select options MUST have explicit white backgrounds

## File Structure

**HTML Pages**: Each page follows same structure:
1. Sidebar navigation (`<aside class="sidebar">`)
2. Main content (`<main class="main-content">`)
3. Firebase + MSAL.js scripts at bottom
4. Page-specific JS last

**JavaScript Loading Order** (critical):
```html
<!-- Core libraries -->
<script src="firebase-*.js"></script>
<script src="msal-browser.min.js"></script>

<!-- App core (order matters!) -->
<script src="js/config.js"></script>           <!-- Firebase config -->
<script src="js/ui-utilities.js"></script>     <!-- Toast, loading -->
<script src="js/demo-data.js"></script>        <!-- Demo DB -->
<script src="js/entra-auth.js"></script>       <!-- Auth functions -->
<script src="js/db-helpers.js"></script>       <!-- DB wrappers -->
<script src="js/app-init.js"></script>         <!-- Global init -->
<script src="js/detail-panel.js"></script>     <!-- Detail panels -->

<!-- M365 integration (if needed) -->
<script src="js/microsoft-auth.js"></script>
<script src="js/sharepoint-helpers.js"></script>
<script src="js/email-helpers.js"></script>

<!-- Page-specific (last) -->
<script src="js/panden.js"></script>
```

## Common Tasks

### Adding New Entity Type

1. **Demo Data**: Add to `DEMO_DATA` object in `js/demo-data.js`
2. **HTML Page**: Create page with filters, table/cards, modal
3. **JavaScript**: Create `js/[entity].js` with CRUD operations using `db*` functions
4. **Detail Panel**: Add case to `generateDetailView()` in `js/detail-panel.js`
5. **Sidebar**: Add nav link to all pages (dashboard.html, panden.html, etc.)

### Microsoft 365 Integration

**Email Sending** (`js/email-helpers.js`):
```javascript
await sendEmail({
    to: ['user@example.com'],
    subject: 'Subject',
    body: 'Body text',
    contentType: 'Text', // or 'HTML'
    attachments: [{ name: 'file.pdf', contentBytes: base64, contentType: 'application/pdf' }]
});
```

**SharePoint Upload** (`js/sharepoint-helpers.js`):
```javascript
await saveFileToSharePoint(fileName, content, folderPath, contentType);
// Creates folders automatically if they don't exist
```

**Always check**: `if (!isMicrosoftSignedIn())` before M365 operations

### Werkbon System (Work Orders)

Located in `js/werkbon-helpers.js`. Generate from onderhoud items:
```javascript
const werkbon = await generateWerkbon(meldingId);
await sendWerkbon(werkbonId, {
    sendToHuurder: true,
    sendToOnderhoudsBedrijf: true,
    onderhoudsBedrijfEmail: 'company@example.com'
});
```

Auto-generates HTML werkbon with signature sections, saves to Firebase `werkbonnen` collection.

## Conventions

- **Function naming**: Camel case (`loadPanden`, `editHuurder`)
- **Global exports**: Add to window object: `window.functionName = functionName`
- **Status badges**: Use class `status-badge ${statusValue}` (e.g., `status-badge actief`)
- **Priority badges**: Use class `priority-badge ${priorityValue}` (e.g., `priority-badge hoog`)
- **Toast notifications**: `showToast(message, type)` where type = 'success'|'error'|'info'
- **Loading states**: `showLoading(message)` / `hideLoading()`

## Debugging

**Demo Mode Issues**:
- Check console for "Error getting [path]/[id]: permission_denied" → Missing demo mode check
- Reset demo data: `getDemoDatabase().reset(); location.reload();`
- Clear demo mode: `localStorage.removeItem('demoMode')`

**CSS Issues**:
- Browser may cache aggressively → Hard refresh: `Ctrl+Shift+R`
- Check for dark mode override in devtools → Should be disabled
- Select dropdowns appearing black → Missing `option { background: #ffffff; }` rule

## Documentation

- `README.md`: User-facing setup guide
- `DEMO-MODE.md`: Complete demo mode documentation
- `M365-INTEGRATION-ARCHITECTURE.md`: SharePoint/Graph API strategy
- `AZURE-AD-SETUP.md`, `FIREBASE-SETUP.md`: Admin setup guides

## Testing Locally

```powershell
# Install Live Server extension in VS Code, then:
# Right-click index.html → Open with Live Server
# OR use Python:
python -m http.server 8000
```

Navigate to `http://localhost:8000/#demo` for instant demo mode.

## Key Gotchas

1. **Demo mode check everywhere**: Every `dbGet`, `dbGetAll`, `dbAdd`, `dbUpdate`, `dbDelete` must route through demo helpers
2. **Script load order matters**: `demo-data.js` before `db-helpers.js`, `app-init.js` after auth files
3. **No dark colors**: User explicitly forbids black backgrounds; use `#fafbfc` or `#ffffff`
4. **Select options**: Browser defaults to black dropdown menus; must override with explicit white background
5. **Detail panels**: Use `showDetailPanel(entityType, data)` not custom implementations
6. **Firebase paths**: Use singular names: `onderhoud`, `panden`, `huurders` (not plural forms with s)
7. **XSS Prevention**: Always use `sanitizeHTML()` when injecting user data into innerHTML
8. **VIEWER Role**: Use `isViewerRole()` to hide edit/delete buttons for read-only users
9. **Cascading deletes**: Check for linked contracts before deleting panden or huurders
10. **Audit trail**: Use `logAuditEvent()` for important operations (available via `js/audit-trail.js`)
11. **Global Search**: Available via Ctrl+K on all pages (via `js/global-search.js`)
12. **Copilot AI**: Floating assistant button on all pages (via `js/copilot-assistant.js`), configurable via Admin → AI tab
13. **CSV Export**: Each page has export capability via `js/data-export.js`

## New Feature Files

| File | Purpose |
|------|---------|
| `js/audit-trail.js` | Tracks all data modifications with user, timestamp, and action |
| `js/global-search.js` | Cross-entity search overlay (Ctrl+K) |
| `js/data-export.js` | CSV export for all entity types |
| `js/copilot-assistant.js` | AI assistant panel with photo/document upload |
| `js/rent-increase.js` | Annual rent increase processing |
