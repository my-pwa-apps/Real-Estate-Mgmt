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
      details: details.description || "",
      changes: details.changes || null,
      ipAddress: null, // Not available in client-side SPA
    };

    await dbAdd("auditLog", auditEntry);
  } catch (error) {
    // Don't let audit logging failures break the app
    console.warn("Audit log failed:", error);
  }
}

/**
 * Get current user info for audit logging
 */
function getCurrentAuditUser() {
  if (typeof isDemoMode === "function" && isDemoMode()) {
    return {
      id: "demo",
      name: "Demo Gebruiker",
      email: "demo@stadsgezicht.nl",
    };
  }
  if (window.currentUser) {
    return {
      id:
        window.currentUser.localAccountId ||
        window.currentUser.homeAccountId ||
        "unknown",
      name: window.currentUser.name || "Onbekend",
      email:
        window.currentUser.username || window.currentUser.email || "onbekend",
    };
  }
  return { id: "unknown", name: "Onbekend", email: "onbekend" };
}

/**
 * Create a wrapper for db operations that auto-logs audit events
 * Call this to wrap dbAdd/dbUpdate/dbDelete with automatic audit logging
 */
function auditedDbAdd(path, data, description) {
  return dbAdd(path, data).then((id) => {
    logAuditEvent("create", path, id, {
      description: description || `Nieuw item aangemaakt in ${path}`,
    });
    return id;
  });
}

function auditedDbUpdate(path, id, data, description) {
  return dbUpdate(path, id, data).then((result) => {
    logAuditEvent("update", path, id, {
      description: description || `Item bijgewerkt in ${path}`,
      changes: data,
    });
    return result;
  });
}

function auditedDbDelete(path, id, description) {
  return dbDelete(path, id).then((result) => {
    logAuditEvent("delete", path, id, {
      description: description || `Item verwijderd uit ${path}`,
    });
    return result;
  });
}

/**
 * Get audit log entries with optional filters
 * @param {object} filters - { entityType, action, userId, startDate, endDate, limit }
 */
async function getAuditLog(filters = {}) {
  try {
    let entries = await dbGetAll("auditLog");

    if (filters.entityType) {
      entries = entries.filter((e) => e.entityType === filters.entityType);
    }
    if (filters.action) {
      entries = entries.filter((e) => e.action === filters.action);
    }
    if (filters.userId) {
      entries = entries.filter((e) => e.userId === filters.userId);
    }
    if (filters.startDate) {
      entries = entries.filter(
        (e) => e.timestamp >= new Date(filters.startDate).getTime(),
      );
    }
    if (filters.endDate) {
      entries = entries.filter(
        (e) => e.timestamp <= new Date(filters.endDate).getTime(),
      );
    }

    // Sort newest first
    entries.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    if (filters.limit) {
      entries = entries.slice(0, filters.limit);
    }

    return entries;
  } catch (error) {
    console.error("Error getting audit log:", error);
    return [];
  }
}

/**
 * Format audit entry for display
 */
function formatAuditEntry(entry) {
  const s = sanitizeHTML;
  const actionIcons = {
    create:
      '<svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M5 12h14"></path><path d="M12 5v14"></path></svg>',
    update:
      '<svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"></path><path d="m15 5 4 4"></path></svg>',
    delete:
      '<svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M10 11v6"></path><path d="M14 11v6"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path><path d="M3 6h18"></path><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>',
    login:
      '<svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>',
    logout:
      '<svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="m16 17 5-5-5-5"></path><path d="M21 12H9"></path><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path></svg>',
    export:
      '<svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M12 15V3"></path><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><path d="m7 10 5 5 5-5"></path></svg>',
    email:
      '<svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7"></path><rect x="2" y="4" width="20" height="16" rx="2"></rect></svg>',
  };
  const entityLabels = {
    panden: "Pand",
    huurders: "Huurder",
    contracten: "Contract",
    onderhoud: "Onderhoud",
    transacties: "Transactie",
    werkbonnen: "Werkbon",
  };

  const icon =
    actionIcons[entry.action] ||
    '<svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"></rect><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><path d="M12 11h4"></path><path d="M12 16h4"></path><path d="M8 11h.01"></path><path d="M8 16h.01"></path></svg>';
  const entity = entityLabels[entry.entityType] || entry.entityType;
  const time = new Date(entry.timestamp).toLocaleString("nl-NL");

  return `${icon} <strong>${s(entry.userName)}</strong> - ${s(entry.action)} ${s(entity)} - ${time}${entry.details ? ` - ${s(entry.details)}` : ""}`;
}

// Export
window.logAuditEvent = logAuditEvent;
window.auditedDbAdd = auditedDbAdd;
window.auditedDbUpdate = auditedDbUpdate;
window.auditedDbDelete = auditedDbDelete;
window.getAuditLog = getAuditLog;
window.formatAuditEntry = formatAuditEntry;
