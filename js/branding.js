// Branding & tenant configuration
// All UI text/logos/colors that vary per tenant flow through here.
// Priority: KV-stored settings (via Worker) > window.TENANT_BRANDING > localStorage > DEFAULT_BRANDING

const DEFAULT_BRANDING = Object.freeze({
	appName: "ObjctMgmt",
	companyName: "ObjctMgmt",
	tagline: "Professioneel Vastgoedbeheer Platform",
	logoUrl: "images/default-logo.svg",
	faviconUrl: "images/default-logo.svg",
	primaryColor: "#1e3a5f",
	accentColor: "#c69c6d",
	supportEmail: "",
	companyPhone: "",
	companyAddress: "",
	companyIban: "",
	companyWebsite: "",
	adminEmails: [], // Replaces hardcoded admin email lists across the app
	sharePointSiteName: "",
	azureAdTenantId: "",
});

const BRANDING_STORAGE_KEY = "tenantBranding";
let cachedBranding = null;
let brandingFetchPromise = null;

function readLocalBranding() {
	try {
		const raw = localStorage.getItem(BRANDING_STORAGE_KEY);
		return raw ? JSON.parse(raw) : null;
	} catch (_) {
		return null;
	}
}

function writeLocalBranding(branding) {
	try {
		localStorage.setItem(BRANDING_STORAGE_KEY, JSON.stringify(branding));
	} catch (_) {
		// quota - ignore
	}
}

/**
 * Get the currently effective branding (sync, from cache).
 * Use loadBranding() once on page init to refresh from the Worker.
 */
function getBranding() {
	if (cachedBranding) return cachedBranding;
	cachedBranding = {
		...DEFAULT_BRANDING,
		...(window.TENANT_BRANDING || {}),
		...(readLocalBranding() || {}),
	};
	return cachedBranding;
}

/**
 * Fetch tenant branding from the Worker and cache it.
 * Falls back silently to local cache + defaults when the Worker is unreachable.
 */
async function loadBranding() {
	if (brandingFetchPromise) return brandingFetchPromise;
	const apiBase = window.OBJCTMGMT_API_BASE || null;
	const tenantId = window.OBJCTMGMT_TENANT_ID || "default";
	if (!apiBase) {
		applyBranding();
		return getBranding();
	}
	brandingFetchPromise = (async () => {
		try {
			const res = await fetch(
				`${apiBase}/tenant/branding?tenant=${encodeURIComponent(tenantId)}`,
			);
			if (res.ok) {
				const remote = await res.json();
				if (remote && typeof remote === "object") {
					cachedBranding = { ...DEFAULT_BRANDING, ...remote };
					writeLocalBranding(remote);
				}
			}
		} catch (_) {
			// Network error - keep whatever we have cached
		}
		applyBranding();
		return getBranding();
	})();
	return brandingFetchPromise;
}

/**
 * Save branding to the Worker (admin only) and update the local cache.
 */
async function saveBranding(updates) {
	const merged = { ...getBranding(), ...updates };
	cachedBranding = merged;
	writeLocalBranding(merged);

	const apiBase = window.OBJCTMGMT_API_BASE || null;
	const tenantId = window.OBJCTMGMT_TENANT_ID || "default";
	if (!apiBase) {
		applyBranding();
		return merged;
	}
	const headers = { "Content-Type": "application/json" };
	if (typeof getEntraAccessToken === "function") {
		try {
			const token = await getEntraAccessToken(["api://default/access"]);
			if (token) headers.Authorization = `Bearer ${token}`;
		} catch (_) {
			// Fall through; Worker will reject if auth required
		}
	}
	if (typeof isDemoMode === "function" && isDemoMode()) {
		headers["X-Demo-Mode"] = "true";
	}
	const res = await fetch(
		`${apiBase}/tenant/branding?tenant=${encodeURIComponent(tenantId)}`,
		{ method: "PUT", headers, body: JSON.stringify(merged) },
	);
	if (!res.ok) {
		throw new Error(`Branding save failed: ${res.status}`);
	}
	applyBranding();
	return merged;
}

/**
 * Reset branding to defaults: clear local cache and overwrite remote with defaults.
 */
async function resetBranding() {
	cachedBranding = null;
	try {
		localStorage.removeItem(BRANDING_STORAGE_KEY);
	} catch (_) {}
	return saveBranding({ ...DEFAULT_BRANDING });
}

/**
 * Upload a logo file to R2 (via the Worker) and update the branding record.
 * Accepts image/* (jpg/png/webp/gif/svg).
 */
async function uploadLogo(file) {
	const apiBase = window.OBJCTMGMT_API_BASE || null;
	if (!apiBase) {
		// Fallback: store as data URL locally so the user at least sees the change
		const dataUrl = await fileToDataUrl(file);
		return saveBranding({ logoUrl: dataUrl, faviconUrl: dataUrl });
	}
	const tenantId = window.OBJCTMGMT_TENANT_ID || "default";
	const headers = { "Content-Type": file.type || "application/octet-stream" };
	if (typeof getEntraAccessToken === "function") {
		try {
			const token = await getEntraAccessToken(["api://default/access"]);
			if (token) headers.Authorization = `Bearer ${token}`;
		} catch (_) {}
	}
	if (typeof isDemoMode === "function" && isDemoMode()) {
		headers["X-Demo-Mode"] = "true";
	}
	const url = `${apiBase}/files/upload?entityType=branding&entityId=${encodeURIComponent(tenantId)}&name=${encodeURIComponent(file.name)}`;
	const res = await fetch(url, { method: "PUT", headers, body: file });
	if (!res.ok) throw new Error(`Logo upload failed: ${res.status}`);
	const { key } = await res.json();
	const publicUrl = `${apiBase}/files/download?key=${encodeURIComponent(key)}`;
	return saveBranding({ logoUrl: publicUrl, faviconUrl: publicUrl });
}

function fileToDataUrl(file) {
	return new Promise((resolve, reject) => {
		const r = new FileReader();
		r.onload = () => resolve(r.result);
		r.onerror = reject;
		r.readAsDataURL(file);
	});
}

/**
 * Apply current branding to the DOM. Idempotent.
 * Mark elements with:
 *   data-brand-logo        on <img>     -> src + alt
 *   data-brand-name        on any node  -> textContent = appName
 *   data-brand-tagline     on any node  -> textContent = tagline
 *   data-brand-suffix-title on <title>  -> "<original> - <appName>"
 */
function applyBranding() {
	const b = getBranding();

	// <title>
	const titleEl = document.querySelector("title");
	if (titleEl) {
		const baseTitle = titleEl.dataset.brandBase || titleEl.textContent;
		titleEl.dataset.brandBase = baseTitle;
		// Strip trailing " - <anything>" so we always swap in the current app name
		const stem = baseTitle.split(" - ")[0];
		titleEl.textContent = `${stem} - ${b.appName}`;
	}

	// Favicon
	let favicon = document.querySelector("link[rel='icon']");
	if (!favicon) {
		favicon = document.createElement("link");
		favicon.rel = "icon";
		document.head.appendChild(favicon);
	}
	favicon.href = b.faviconUrl;
	const appleIcon = document.querySelector("link[rel='apple-touch-icon']");
	if (appleIcon) appleIcon.href = b.faviconUrl;

	// Logos
	for (const el of document.querySelectorAll("[data-brand-logo]")) {
		el.src = b.logoUrl;
		el.alt = b.appName;
	}

	// Name / tagline
	for (const el of document.querySelectorAll("[data-brand-name]")) {
		el.textContent = b.appName;
	}
	for (const el of document.querySelectorAll("[data-brand-tagline]")) {
		el.textContent = b.tagline;
	}

	// Colors -> CSS variables
	if (b.primaryColor) {
		document.documentElement.style.setProperty(
			"--primary-color",
			b.primaryColor,
		);
	}
	if (b.accentColor) {
		document.documentElement.style.setProperty(
			"--accent-color",
			b.accentColor,
		);
	}
}

// Expose
window.getBranding = getBranding;
window.loadBranding = loadBranding;
window.saveBranding = saveBranding;
window.resetBranding = resetBranding;
window.uploadLogo = uploadLogo;
window.applyBranding = applyBranding;
window.DEFAULT_BRANDING = DEFAULT_BRANDING;

// Apply immediately so any markup already present gets the defaults, then
// kick off a background fetch from the Worker.
if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", () => {
		applyBranding();
		loadBranding();
	});
} else {
	applyBranding();
	loadBranding();
}
