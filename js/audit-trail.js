// Audit Trail - Tracks all data modifications with user, timestamp, and action details

/**
 * Log an audit event to the auditLog collection
 * @param {string} action - create|update|delete|login|logout|export|email
 * @param {string} entityType - panden|huurders|contracten|onderhoud|transacties|werkbonnen
 * @param {string} entityId - ID of the entity being modified
 * @param {object} details - Additional details (old values, new values, description)
 */
async function logAuditEvent(action, entityType, entityId, details = {}) {
    try {
        const user = getCurrentAuditUser();
        const auditEntry = {
            action,
            entityType,
            entityId: entityId || null,
            userId: user.id,
            userName: user.name,
            userEmail: user.email,
            timestamp: Date.now(),
            dateFormatted: new Date().toISOString(),
            details: details.description || '',
            changes: details.changes || null,
            ipAddress: null // Not available in client-side SPA
        };

        await dbAdd('auditLog', auditEntry);
    } catch (error) {
        // Don't let audit logging failures break the app
        console.warn('Audit log failed:', error);
    }
}

/**
 * Get current user info for audit logging
 */
function getCurrentAuditUser() {
    if (typeof isDemoMode === 'function' && isDemoMode()) {
        return { id: 'demo', name: 'Demo Gebruiker', email: 'demo@stadsgezicht.nl' };
    }
    if (window.currentUser) {
        return {
            id: window.currentUser.localAccountId || window.currentUser.homeAccountId || 'unknown',
            name: window.currentUser.name || 'Onbekend',
            email: window.currentUser.username || window.currentUser.email || 'onbekend'
        };
    }
    return { id: 'unknown', name: 'Onbekend', email: 'onbekend' };
}

/**
 * Create a wrapper for db operations that auto-logs audit events
 * Call this to wrap dbAdd/dbUpdate/dbDelete with automatic audit logging
 */
function auditedDbAdd(path, data, description) {
    return dbAdd(path, data).then(id => {
        logAuditEvent('create', path, id, { description: description || `Nieuw item aangemaakt in ${path}` });
        return id;
    });
}

function auditedDbUpdate(path, id, data, description) {
    return dbUpdate(path, id, data).then(result => {
        logAuditEvent('update', path, id, {
            description: description || `Item bijgewerkt in ${path}`,
            changes: data
        });
        return result;
    });
}

function auditedDbDelete(path, id, description) {
    return dbDelete(path, id).then(result => {
        logAuditEvent('delete', path, id, { description: description || `Item verwijderd uit ${path}` });
        return result;
    });
}

/**
 * Get audit log entries with optional filters
 * @param {object} filters - { entityType, action, userId, startDate, endDate, limit }
 */
async function getAuditLog(filters = {}) {
    try {
        let entries = await dbGetAll('auditLog');
        
        if (filters.entityType) {
            entries = entries.filter(e => e.entityType === filters.entityType);
        }
        if (filters.action) {
            entries = entries.filter(e => e.action === filters.action);
        }
        if (filters.userId) {
            entries = entries.filter(e => e.userId === filters.userId);
        }
        if (filters.startDate) {
            entries = entries.filter(e => e.timestamp >= new Date(filters.startDate).getTime());
        }
        if (filters.endDate) {
            entries = entries.filter(e => e.timestamp <= new Date(filters.endDate).getTime());
        }
        
        // Sort newest first
        entries.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        
        if (filters.limit) {
            entries = entries.slice(0, filters.limit);
        }
        
        return entries;
    } catch (error) {
        console.error('Error getting audit log:', error);
        return [];
    }
}

/**
 * Format audit entry for display
 */
function formatAuditEntry(entry) {
    const s = sanitizeHTML;
    const actionIcons = {
        create: '➕', update: '✏️', delete: '🗑️',
        login: '🔐', logout: '🚪', export: '📥', email: '📧'
    };
    const entityLabels = {
        panden: 'Pand', huurders: 'Huurder', contracten: 'Contract',
        onderhoud: 'Onderhoud', transacties: 'Transactie', werkbonnen: 'Werkbon'
    };
    
    const icon = actionIcons[entry.action] || '📋';
    const entity = entityLabels[entry.entityType] || entry.entityType;
    const time = new Date(entry.timestamp).toLocaleString('nl-NL');
    
    return `${icon} <strong>${s(entry.userName)}</strong> - ${s(entry.action)} ${s(entity)} - ${time}${entry.details ? ` - ${s(entry.details)}` : ''}`;
}

// Export
window.logAuditEvent = logAuditEvent;
window.auditedDbAdd = auditedDbAdd;
window.auditedDbUpdate = auditedDbUpdate;
window.auditedDbDelete = auditedDbDelete;
window.getAuditLog = getAuditLog;
window.formatAuditEntry = formatAuditEntry;
