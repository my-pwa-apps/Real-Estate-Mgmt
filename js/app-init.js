// Global app initialization
// Handles authentication, logout, and demo mode across all pages

document.addEventListener('DOMContentLoaded', () => {
    // Setup logout button on all pages
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            if (isDemoMode()) {
                // Exit demo mode
                const confirmed = await showConfirm('Demo modus verlaten? U keert terug naar het login scherm.', 'Demo modus verlaten');
                if (confirmed) {
                    disableDemoMode();
                    window.location.href = 'index.html';
                }
            } else {
                // Sign out from Entra ID
                await signOutEntraId();
            }
        });
    }
    
    // Add demo mode indicator to all pages
    if (isDemoMode() && !document.getElementById('demoIndicator')) {
        const sidebar = document.querySelector('.sidebar-footer');
        if (sidebar) {
            const demoIndicator = document.createElement('div');
            demoIndicator.id = 'demoIndicator';
            demoIndicator.className = 'demo-indicator';
            demoIndicator.innerHTML = '🎭 DEMO MODUS';
            demoIndicator.style.cssText = 'background: #ffc107; color: #000; padding: 8px; border-radius: 4px; margin-bottom: 10px; text-align: center; font-size: 12px; font-weight: bold; cursor: pointer;';
            demoIndicator.title = 'Klik om demo modus te verlaten';
            
            demoIndicator.addEventListener('click', async () => {
                const confirmed = await showConfirm('Demo modus verlaten?', 'Demo modus verlaten');
                if (confirmed) {
                    disableDemoMode();
                    window.location.href = 'index.html';
                }
            });
            
            sidebar.insertBefore(demoIndicator, sidebar.firstChild);
        }
    }
    
    // Add admin link to sidebar if user is admin
    if (isAdmin && isAdmin()) {
        const sidebar = document.querySelector('.sidebar-nav');
        if (sidebar && !document.querySelector('a[href="admin.html"]')) {
            const adminLink = document.createElement('a');
            adminLink.href = 'admin.html';
            adminLink.className = 'nav-item';
            adminLink.innerHTML = '<span class="icon">⚙️</span> Admin';
            
            // Add separator before admin link
            const separator = document.createElement('hr');
            separator.style.cssText = 'border-color: rgba(255,255,255,0.1); margin: 10px 0;';
            
            sidebar.appendChild(separator);
            sidebar.appendChild(adminLink);
        }
    }
});

// Global authentication check for protected pages
async function ensureAuthenticated() {
    try {
        const user = await checkEntraAuth();
        
        if (!user && !isDemoMode()) {
            window.location.href = 'index.html';
            return null;
        }
        
        return user;
    } catch (error) {
        console.error('Authentication check failed:', error);
        if (!isDemoMode()) {
            window.location.href = 'index.html';
        }
        return null;
    }
}

// Export
window.ensureAuthenticated = ensureAuthenticated;
