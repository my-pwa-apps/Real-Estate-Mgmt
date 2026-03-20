// UI Utilities - Toast notifications, loading states, and UI helpers

/**
 * Show toast notification
 * @param {string} message - Message to display
 * @param {string} type - Type: success, error, warning, info
 * @param {number} duration - Duration in ms (default 3000)
 */
function showToast(message, type = "info", duration = 3000) {
  // Create container if it doesn't exist
  let container = document.getElementById("toastContainer");
  if (!container) {
    container = document.createElement("div");
    container.id = "toastContainer";
    container.className = "toast-container";
    document.body.appendChild(container);
  }

  // Icons per type
  const icons = {
    success:
      '<svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M20 6 9 17l-5-5"/></svg>',
    error:
      '<svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>',
    warning:
      '<svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>',
    info: '<svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>',
  };

  // Titles per type
  const titles = {
    success: "Gelukt",
    error: "Fout",
    warning: "Waarschuwing",
    info: "Info",
  };

  // Create toast
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `
        <div class="toast-icon">${icons[type]}</div>
        <div class="toast-content">
            <div class="toast-title">${titles[type]}</div>
            <div class="toast-message">${sanitizeHTML(message)}</div>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">×</button>
    `;

  container.appendChild(toast);

  // Trigger animation
  requestAnimationFrame(() => {
    toast.classList.add("show");
  });

  // Auto remove
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

/**
 * Show loading overlay
 * @param {string} message - Optional loading message
 */
function showLoading(message = "Laden...") {
  let overlay = document.getElementById("loadingOverlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "loadingOverlay";
    overlay.className = "loading-overlay";
    overlay.innerHTML = `
            <div class="loading-spinner"></div>
            <div class="loading-text">${message}</div>
        `;
    document.body.appendChild(overlay);
  } else {
    overlay.querySelector(".loading-text").textContent = message;
  }

  requestAnimationFrame(() => {
    overlay.classList.add("show");
  });
}

/**
 * Hide loading overlay
 */
function hideLoading() {
  const overlay = document.getElementById("loadingOverlay");
  if (overlay) {
    overlay.classList.remove("show");
    // Remove from DOM after fade animation
    setTimeout(() => {
      overlay.remove();
    }, 350);
  }
}

/**
 * Show confirmation dialog
 * @param {string} message - Confirmation message
 * @param {string} title - Dialog title
 * @returns {Promise<boolean>} - Resolves to true if confirmed
 */
function showConfirm(message, title = "Bevestigen") {
  return new Promise((resolve) => {
    const result = confirm(`${title}\n\n${message}`);
    resolve(result);
  });
}

/**
 * Debounce function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in ms
 * @returns {Function} - Debounced function
 */
function debounce(func, wait = 300) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Format currency
 * @param {number} amount - Amount to format
 * @returns {string} - Formatted currency string
 */
function formatCurrency(amount) {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

/**
 * Format date
 * @param {string|Date} date - Date to format
 * @param {string} format - Format type: short, long, relative
 * @returns {string} - Formatted date string
 */
function formatDate(date, format = "short") {
  const d = new Date(date);

  if (format === "short") {
    return d.toLocaleDateString("nl-NL");
  } else if (format === "long") {
    return d.toLocaleDateString("nl-NL", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } else if (format === "relative") {
    const now = new Date();
    const diff = now - d;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return "Vandaag";
    if (days === 1) return "Gisteren";
    if (days < 7) return `${days} dagen geleden`;
    if (days < 30) return `${Math.floor(days / 7)} weken geleden`;
    if (days < 365) return `${Math.floor(days / 30)} maanden geleden`;
    return `${Math.floor(days / 365)} jaar geleden`;
  }

  return d.toLocaleDateString("nl-NL");
}

/**
 * Copy to clipboard
 * @param {string} text - Text to copy
 */
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast("Gekopieerd naar klembord", "success");
  } catch (err) {
    showToast("Kopiëren mislukt", "error");
  }
}

/**
 * Validate email
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid
 */
function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

/**
 * Validate phone number (NL format)
 * @param {string} phone - Phone number to validate
 * @returns {boolean} - True if valid
 */
function isValidPhone(phone) {
  // Dutch phone formats: 06-12345678, 020-1234567, +31612345678
  const re = /^(\+31|0)[1-9]\d{8}$/;
  const cleaned = phone.replace(/[\s-]/g, "");
  return re.test(cleaned);
}

/**
 * Sanitize HTML to prevent XSS
 * @param {string} html - HTML string to sanitize
 * @returns {string} - Sanitized HTML
 */
function sanitizeHTML(html) {
  if (html === null || html === undefined) return "";
  const div = document.createElement("div");
  div.textContent = String(html);
  return div.innerHTML;
}

/**
 * Sanitize a value for safe use inside HTML attribute strings (e.g. onclick)
 * Only allows alphanumeric, hyphens and underscores (safe for Firebase IDs)
 * @param {string} val - Value to sanitize
 * @returns {string} - Sanitized value
 */
function sanitizeAttr(val) {
  if (val === null || val === undefined) return "";
  return String(val).replace(/[^a-zA-Z0-9_-]/g, "");
}

/**
 * Check if current user has VIEWER (read-only) role
 * @returns {boolean} - True if user is a viewer with no write access
 */
function isViewerRole() {
  // In demo mode, grant full access
  if (typeof isDemoMode === "function" && isDemoMode()) return false;
  // Check if hasRole function exists and user has only VIEWER role
  if (typeof hasRole === "function") {
    return !hasRole("MANAGER");
  }
  return false;
}

/**
 * Generate unique ID
 * @returns {string} - Unique ID
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

/**
 * Capitalize the first letter of a string
 * @param {string} str - String to capitalize
 * @returns {string} - String with first letter capitalized
 */
function capitalizeFirst(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Smooth scroll to element
 * @param {string} elementId - ID of element to scroll to
 * @param {number} offset - Offset from top (default 0)
 */
function scrollToElement(elementId, offset = 0) {
  const element = document.getElementById(elementId);
  if (element) {
    const top =
      element.getBoundingClientRect().top + window.pageYOffset - offset;
    window.scrollTo({ top, behavior: "smooth" });
  }
}

/**
 * Check if element is in viewport
 * @param {HTMLElement} element - Element to check
 * @returns {boolean} - True if in viewport
 */
function isInViewport(element) {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <=
      (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

/**
 * Lazy load images
 */
function setupLazyLoading() {
  const images = document.querySelectorAll("img[data-src]");

  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        img.removeAttribute("data-src");
        observer.unobserve(img);
      }
    });
  });

  images.forEach((img) => imageObserver.observe(img));
}

/**
 * Trap focus within modal/panel
 * @param {HTMLElement} element - Element to trap focus in
 */
function trapFocus(element) {
  const focusableElements = element.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
  );
  const firstFocusable = focusableElements[0];
  const lastFocusable = focusableElements[focusableElements.length - 1];

  element.addEventListener("keydown", (e) => {
    if (e.key === "Tab") {
      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          lastFocusable.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          firstFocusable.focus();
          e.preventDefault();
        }
      }
    }
  });

  firstFocusable?.focus();
}

/**
 * Handle async operations with error handling
 * @param {Function} asyncFn - Async function to execute
 * @param {string} errorMessage - Custom error message
 * @returns {Promise} - Promise result
 */
async function handleAsync(
  asyncFn,
  errorMessage = "Er is een fout opgetreden",
) {
  try {
    showLoading();
    const result = await asyncFn();
    hideLoading();
    return result;
  } catch (error) {
    hideLoading();
    console.error(error);
    showToast(errorMessage, "error");
    throw error;
  }
}

/**
 * Local storage helpers with error handling
 */
const storage = {
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error("Storage set error:", error);
      return false;
    }
  },

  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error("Storage get error:", error);
      return defaultValue;
    }
  },

  remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error("Storage remove error:", error);
      return false;
    }
  },

  clear() {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error("Storage clear error:", error);
      return false;
    }
  },
};

// Initialize lazy loading on DOM ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", setupLazyLoading);
} else {
  setupLazyLoading();
}

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    showToast,
    showLoading,
    hideLoading,
    showConfirm,
    debounce,
    formatCurrency,
    formatDate,
    copyToClipboard,
    isValidEmail,
    isValidPhone,
    sanitizeHTML,
    sanitizeAttr,
    generateId,
    capitalizeFirst,
    scrollToElement,
    isInViewport,
    trapFocus,
    handleAsync,
    storage,
    isViewerRole,
  };
}

// Make isViewerRole globally accessible
window.isViewerRole = isViewerRole;
window.sanitizeAttr = sanitizeAttr;
