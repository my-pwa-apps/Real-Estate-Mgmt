// Global app initialization
// Handles authentication, logout, and demo mode across all pages

// Global error handlers - catch unhandled errors and show user-friendly messages
window.onerror = function (message, source, lineno, colno, error) {
  console.error("Unhandled error:", { message, source, lineno, colno, error });
  if (typeof showToast === "function") {
    showToast("Er is een onverwachte fout opgetreden", "error");
  }
  return false; // Allow default browser error logging
};

window.onunhandledrejection = function (event) {
  console.error("Unhandled promise rejection:", event.reason);
  if (typeof showToast === "function") {
    showToast(
      "Er is een fout opgetreden bij een achtergrondbewerking",
      "error",
    );
  }
};

document.addEventListener("DOMContentLoaded", () => {
  // Setup logout button on all pages
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      if (isDemoMode()) {
        // Exit demo mode
        const confirmed = await showConfirm(
          "Demo modus verlaten? U keert terug naar het login scherm.",
          "Demo modus verlaten",
        );
        if (confirmed) {
          disableDemoMode();
          window.location.href = "index.html";
        }
      } else {
        // Sign out from Entra ID
        await signOutEntraId();
      }
    });
  }

  // Add demo mode indicator to all pages
  if (isDemoMode() && !document.getElementById("demoIndicator")) {
    const sidebar = document.querySelector(".sidebar-footer");
    if (sidebar) {
      const demoIndicator = document.createElement("div");
      demoIndicator.id = "demoIndicator";
      demoIndicator.className = "demo-indicator";
      demoIndicator.innerHTML =
        '<svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M2 10s3-3 3-8"></path><path d="M22 10s-3-3-3-8"></path><path d="M10 2c0 4.4-3.6 8-8 8"></path><path d="M14 2c0 4.4 3.6 8 8 8"></path><path d="M2 10s2 2 2 5"></path><path d="M22 10s-2 2-2 5"></path><path d="M8 15h8"></path><path d="M2 22v-1a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1"></path><path d="M14 22v-1a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1"></path></svg> DEMO MODUS';
      demoIndicator.style.cssText =
        "background: #ffc107; color: #000; padding: 8px; border-radius: 4px; margin-bottom: 10px; text-align: center; font-size: 12px; font-weight: bold; cursor: pointer;";
      demoIndicator.title = "Klik om demo modus te verlaten";

      demoIndicator.addEventListener("click", async () => {
        const confirmed = await showConfirm(
          "Demo modus verlaten?",
          "Demo modus verlaten",
        );
        if (confirmed) {
          disableDemoMode();
          window.location.href = "index.html";
        }
      });

      sidebar.insertBefore(demoIndicator, sidebar.firstChild);
    }
  }

  // Add admin link to sidebar if user is admin
  if (isAdmin && isAdmin()) {
    const sidebar = document.querySelector(".sidebar-nav");
    if (sidebar && !document.querySelector('a[href="admin.html"]')) {
      const adminLink = document.createElement("a");
      adminLink.href = "admin.html";
      adminLink.className = "nav-item";
      adminLink.innerHTML =
        '<span class="icon"><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915"></path><circle cx="12" cy="12" r="3"></circle></svg></span> Admin';

      // Add separator before admin link
      const separator = document.createElement("hr");
      separator.style.cssText =
        "border-color: rgba(255,255,255,0.1); margin: 10px 0;";

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
      window.location.href = "index.html";
      return null;
    }

    return user;
  } catch (error) {
    console.error("Authentication check failed:", error);
    if (!isDemoMode()) {
      window.location.href = "index.html";
    }
    return null;
  }
}

// Floating Action Button (FAB) - auto-create on each page
function initPageFab() {
  const page = window.location.pathname.split("/").pop().replace(".html", "");
  const fabConfig = {
    panden: {
      label: "Nieuw Pand",
      targetBtn: "addPandBtn",
      icon: '<svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M5 12h14"/><path d="M12 5v14"/></svg>',
    },
    contracten: {
      label: "Nieuw Contract",
      targetBtn: "addContractBtn",
      icon: '<svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M5 12h14"/><path d="M12 5v14"/></svg>',
    },
    huurders: {
      label: "Nieuwe Relatie",
      targetBtn: "addHuurderBtn",
      icon: '<svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M5 12h14"/><path d="M12 5v14"/></svg>',
    },
    onderhoud: {
      label: "Nieuwe Melding",
      targetBtn: "addMeldingBtn",
      icon: '<svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M5 12h14"/><path d="M12 5v14"/></svg>',
    },
    financieel: {
      label: "Nieuwe Transactie",
      targetBtn: "addInkomstBtn",
      icon: '<svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M5 12h14"/><path d="M12 5v14"/></svg>',
    },
  };

  const config = fabConfig[page];
  if (!config) return;

  // Don't show FAB for viewer role
  if (typeof isViewerRole === "function" && isViewerRole()) return;

  const fab = document.createElement("button");
  fab.className = "page-fab";
  fab.setAttribute("aria-label", config.label);
  fab.innerHTML = config.icon;
  fab.addEventListener("click", () => {
    const target = document.getElementById(config.targetBtn);
    if (target) target.click();
  });
  document.body.appendChild(fab);
}

// Initialize FAB after DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initPageFab);
} else {
  initPageFab();
}

// Export
window.ensureAuthenticated = ensureAuthenticated;
