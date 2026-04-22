// Admin Page Logic

let currentSettings = {};

document.addEventListener("DOMContentLoaded", async () => {
	// Check authentication and admin role
	try {
		const user = await checkEntraAuth();

		if (!user && !isDemoMode()) {
			window.location.href = "index.html";
			return;
		}

		// Check if user is admin
		if (!isAdmin()) {
			document.getElementById("adminContent").style.display = "none";
			document.getElementById("accessDenied").style.display = "block";
			return;
		}

		// Set user info
		if (user) {
			document.getElementById("userName").textContent = user.name || user.email;
			const roleBadge = document.getElementById("userRole");
			roleBadge.textContent = user.role.toUpperCase();
			roleBadge.className = `role-badge role-${user.role}`;
		}

		// Show demo indicator if in demo mode
		if (isDemoMode()) {
			document.getElementById("demoIndicator").style.display = "block";
		}

		// Load data
		await loadAdminData();

		// Setup event listeners
		setupEventListeners();
	} catch (error) {
		console.error("Error initializing admin page:", error);
		showToast("Fout bij laden van admin pagina", "error");
	}
});

// Load admin data
async function loadAdminData() {
	// Load settings from Firebase (fallback to localStorage for migration)
	try {
		const fbSettings = await dbGet("settings", "appSettings");
		if (fbSettings) {
			currentSettings = fbSettings;
		} else {
			const savedSettings = localStorage.getItem("appSettings");
			if (savedSettings) {
				currentSettings = JSON.parse(savedSettings);
			}
		}
		populateSettings();
	} catch (e) {
		console.warn(
			"Failed to load settings from Firebase, using localStorage",
			e,
		);
		const savedSettings = localStorage.getItem("appSettings");
		if (savedSettings) {
			currentSettings = JSON.parse(savedSettings);
			populateSettings();
		}
	}

	// Load Azure config
	await loadAzureConfig();

	// Load users list
	loadUsersList();

	// Load admin emails
	await loadAdminEmails();

	// Update demo status
	updateDemoStatus();
}

// Populate settings form
function populateSettings() {
	if (currentSettings.company) {
		document.getElementById("companyName").value =
			currentSettings.company.name || "";
		document.getElementById("companyAddress").value =
			currentSettings.company.address || "";
		document.getElementById("companyPhone").value =
			currentSettings.company.phone || "";
		document.getElementById("companyEmail").value =
			currentSettings.company.email || "";
		document.getElementById("companyIban").value =
			currentSettings.company.iban || "";
	}

	if (currentSettings.email) {
		document.getElementById("emailFromName").value =
			currentSettings.email.fromName || "";
		document.getElementById("emailFromAddress").value =
			currentSettings.email.fromAddress || "";
		document.getElementById("emailAutoArchive").checked =
			currentSettings.email.autoArchive !== false;
	}

	if (currentSettings.financial) {
		document.getElementById("defaultBorgMonths").value =
			currentSettings.financial.borgMonths || 2;
		document.getElementById("defaultPaymentDay").value =
			currentSettings.financial.paymentDay || 1;
		document.getElementById("rentIncreasePercent").value =
			currentSettings.financial.rentIncreasePercent || 2.5;
	}

	if (currentSettings.notifications) {
		document.getElementById("notifyContractExpiring").checked =
			currentSettings.notifications.contractExpiring !== false;
		document.getElementById("notifyMaintenanceUrgent").checked =
			currentSettings.notifications.maintenanceUrgent !== false;
		document.getElementById("notifyPaymentOverdue").checked =
			currentSettings.notifications.paymentOverdue !== false;
	}
}

// Load Azure config
async function loadAzureConfig() {
	try {
		const config = await dbGet("settings", "azureConfig");
		if (config) {
			document.getElementById("azureClientId").value = config.clientId || "";
			document.getElementById("azureTenantId").value = config.tenantId || "";
			const proxyField = document.getElementById("azureOpenAIProxyUrl");
			if (proxyField) proxyField.value = config.openAIProxyUrl || "";
			document.getElementById("sharePointSiteName").value =
				config.sharePointSite || "";
			return;
		}
	} catch (e) {
		console.warn("Failed to load Azure config from Firebase", e);
	}
	// Fallback to localStorage for migration
	const azureConfig = localStorage.getItem("azureConfig");
	if (azureConfig) {
		const config = JSON.parse(azureConfig);
		document.getElementById("azureClientId").value = config.clientId || "";
		document.getElementById("azureTenantId").value = config.tenantId || "";
		const proxyField = document.getElementById("azureOpenAIProxyUrl");
		if (proxyField) proxyField.value = config.openAIProxyUrl || "";
		document.getElementById("sharePointSiteName").value =
			config.sharePointSite || "";
	}
}

// Load users list
function loadUsersList() {
	const usersList = document.getElementById("usersList");

	if (isDemoMode()) {
		usersList.innerHTML = `
            <div class="info-box">
                <p><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><path d="M16 3.128a4 4 0 0 1 0 7.744"></path><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><circle cx="9" cy="7" r="4"></circle></svg> In demo modus worden geen echte gebruikers getoond.</p>
                <p>Na configuratie met Azure AD verschijnen hier de gebruikers die zich hebben aangemeld.</p>
            </div>
        `;
		return;
	}

	// In production, this would fetch from Azure AD via Graph API
	usersList.innerHTML = `
        <div class="info-box">
            <p>Gebruikerslijst wordt gesynchroniseerd met Azure AD.</p>
            <p>Configureer Azure AD in de "Azure AD" tab om gebruikers te zien.</p>
        </div>
    `;
}

// Load admin emails
async function loadAdminEmails() {
	// Fall back to whatever the active branding declares; no tenant-specific
	// addresses are baked into the codebase.
	const brandingDefaults =
		typeof getBranding === "function" ? getBranding().adminEmails || [] : [];
	try {
		const fbEmails = await dbGet("settings", "adminEmails");
		if (fbEmails?.emails) {
			document.getElementById("adminEmailsList").value =
				fbEmails.emails.join("\n");
			return;
		}
	} catch (e) {
		console.warn("Failed to load admin emails from Firebase", e);
	}
	const savedEmails = localStorage.getItem("adminEmails");
	const emails = savedEmails ? JSON.parse(savedEmails) : brandingDefaults;
	document.getElementById("adminEmailsList").value = emails.join("\n");
}

// Update demo status
function updateDemoStatus() {
	const statusText = document.getElementById("demoStatusText");
	const controls = document.getElementById("demoControls");

	if (isDemoMode()) {
		statusText.innerHTML =
			'<span class="status-badge actief"><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M2 10s3-3 3-8"></path><path d="M22 10s-3-3-3-8"></path><path d="M10 2c0 4.4-3.6 8-8 8"></path><path d="M14 2c0 4.4 3.6 8 8 8"></path><path d="M2 10s2 2 2 5"></path><path d="M22 10s-2 2-2 5"></path><path d="M8 15h8"></path><path d="M2 22v-1a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1"></path><path d="M14 22v-1a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1"></path></svg> Demo Modus Actief</span>';
		controls.innerHTML = `
            <button id="exitDemoMode" class="btn-secondary">Verlaat Demo Modus</button>
            <p><small>Let op: Bij verlaten moet u opnieuw inloggen met Microsoft 365</small></p>
        `;

		document
			.getElementById("exitDemoMode")
			.addEventListener("click", async () => {
				const confirmed = await showConfirm(
					"Weet u zeker dat u demo modus wilt verlaten? U moet daarna opnieuw inloggen.",
					"Demo modus verlaten",
				);
				if (confirmed) {
					disableDemoMode();
					window.location.href = "index.html";
				}
			});
	} else {
		statusText.innerHTML =
			'<span class="status-badge verlopen">Demo Modus Niet Actief</span>';
		controls.innerHTML = `
            <p>Demo modus is uitgeschakeld. Gebruikers moeten inloggen via de login pagina.</p>
        `;
	}
}

// Setup event listeners
function setupEventListeners() {
	// Logout button
	document.getElementById("logoutBtn").addEventListener("click", async () => {
		if (isDemoMode()) {
			disableDemoMode();
			window.location.href = "index.html";
		} else {
			await signOutEntraId();
		}
	});

	// Tab switching
	for (const btn of document.querySelectorAll(".tab-btn")) {
		btn.addEventListener("click", () => {
			const tabName = btn.dataset.tab;

			// Update active tab button and ARIA
			for (const b of document.querySelectorAll(".tab-btn")) {
				b.classList.remove("active");
				b.setAttribute("aria-selected", "false");
			}
			btn.classList.add("active");
			btn.setAttribute("aria-selected", "true");

			// Update active tab content
			for (const content of document.querySelectorAll(".tab-content")) {
				content.classList.remove("active");
			}
			document.getElementById(`${tabName}Tab`).classList.add("active");
		});
	}

	// Save settings
	document
		.getElementById("saveSettings")
		.addEventListener("click", saveSettings);

	// Save admin emails
	document
		.getElementById("saveAdminEmails")
		.addEventListener("click", saveAdminEmails);

	// Save Azure config
	document
		.getElementById("saveAzureConfig")
		.addEventListener("click", saveAzureConfig);

	// Test Azure config
	document
		.getElementById("testAzureConfig")
		.addEventListener("click", testAzureConfig);

	// AI config handlers
	const saveAIBtn = document.getElementById("saveAIConfig");
	if (saveAIBtn) {
		saveAIBtn.addEventListener("click", saveAIConfig);
		// Load existing config from Firebase
		loadAIConfig();
	}
	const testAIBtn = document.getElementById("testAIConfig");
	if (testAIBtn) {
		testAIBtn.addEventListener("click", testAIConfig);
	}

	// Audit log filters
	const auditEntityFilter = document.getElementById("auditEntityFilter");
	const auditActionFilter = document.getElementById("auditActionFilter");
	if (auditEntityFilter)
		auditEntityFilter.addEventListener("change", loadAuditLogEntries);
	if (auditActionFilter)
		auditActionFilter.addEventListener("change", loadAuditLogEntries);

	// Demo data actions
	document
		.getElementById("resetDemoData")
		.addEventListener("click", resetDemoData);
	document
		.getElementById("exportDemoData")
		.addEventListener("click", exportDemoData);
	document
		.getElementById("importDemoData")
		.addEventListener("click", importDemoData);

	// Branding tab
	initBrandingTab();
}

// Save settings
async function saveSettings() {
	currentSettings = {
		company: {
			name: document.getElementById("companyName").value,
			address: document.getElementById("companyAddress").value,
			phone: document.getElementById("companyPhone").value,
			email: document.getElementById("companyEmail").value,
			iban: document.getElementById("companyIban").value,
		},
		email: {
			fromName: document.getElementById("emailFromName").value,
			fromAddress: document.getElementById("emailFromAddress").value,
			autoArchive: document.getElementById("emailAutoArchive").checked,
		},
		financial: {
			borgMonths: Number.parseInt(
				document.getElementById("defaultBorgMonths").value,
			),
			paymentDay: Number.parseInt(
				document.getElementById("defaultPaymentDay").value,
			),
			rentIncreasePercent: Number.parseFloat(
				document.getElementById("rentIncreasePercent").value,
			),
		},
		notifications: {
			contractExpiring: document.getElementById("notifyContractExpiring")
				.checked,
			maintenanceUrgent: document.getElementById("notifyMaintenanceUrgent")
				.checked,
			paymentOverdue: document.getElementById("notifyPaymentOverdue").checked,
		},
	};

	try {
		await dbUpdate("settings", "appSettings", currentSettings);
		// Keep localStorage as fallback cache
		localStorage.setItem("appSettings", JSON.stringify(currentSettings));
		showToast("Instellingen opgeslagen", "success");
	} catch (e) {
		console.error("Failed to save settings to Firebase", e);
		localStorage.setItem("appSettings", JSON.stringify(currentSettings));
		showToast(
			"Instellingen lokaal opgeslagen (Firebase niet bereikbaar)",
			"warning",
		);
	}
}

// Save admin emails
async function saveAdminEmails() {
	const emailsText = document.getElementById("adminEmailsList").value;
	const emails = emailsText
		.split("\n")
		.map((e) => e.trim())
		.filter((e) => e.length > 0);

	try {
		await dbUpdate("settings", "adminEmails", { emails });
		localStorage.setItem("adminEmails", JSON.stringify(emails));
		showToast("Administrator emails opgeslagen", "success");
	} catch (e) {
		console.error("Failed to save admin emails to Firebase", e);
		localStorage.setItem("adminEmails", JSON.stringify(emails));
		showToast("Emails lokaal opgeslagen (Firebase niet bereikbaar)", "warning");
	}
}

// Save Azure config
async function saveAzureConfig() {
	const config = {
		clientId: document.getElementById("azureClientId").value.trim(),
		tenantId: document.getElementById("azureTenantId").value.trim(),
		sharePointSite: document.getElementById("sharePointSiteName").value.trim(),
		openAIProxyUrl:
			document.getElementById("azureOpenAIProxyUrl")?.value.trim() || "",
	};

	try {
		await dbUpdate("settings", "azureConfig", config);
		localStorage.setItem("azureConfig", JSON.stringify(config));
		showToast(
			"Azure configuratie opgeslagen! Herlaad de pagina om de nieuwe configuratie te gebruiken.",
			"success",
			6000,
		);
	} catch (e) {
		console.error("Failed to save Azure config to Firebase", e);
		showToast("Fout bij opslaan Azure configuratie", "error");
	}
}

// Test Azure config
async function testAzureConfig() {
	const statusDiv = document.getElementById("azureStatus");
	statusDiv.innerHTML =
		'<p><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg> Verbinding testen...</p>';

	try {
		// Try to get a token
		const token = await getEntraAccessToken(["User.Read"]);

		if (token) {
			statusDiv.innerHTML = `
                <div class="success-box">
                    <h3><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M21.801 10A10 10 0 1 1 17 3.335"></path><path d="m9 11 3 3L22 4"></path></svg> Verbinding Succesvol!</h3>
                    <p>Azure AD configuratie werkt correct.</p>
                    <p><small>Token verkregen: ${token.substring(0, 20)}...</small></p>
                </div>
            `;
		}
	} catch (error) {
		statusDiv.innerHTML = `
            <div class="error-box">
                <h3><svg xmlns="http://www.w3.org/2000/svg" class="lucide-icon" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"><circle cx="12" cy="12" r="10"></circle><path d="m15 9-6 6"></path><path d="m9 9 6 6"></path></svg> Verbinding Mislukt</h3>
                <p>${error.message}</p>
                <p><small>Controleer de Client ID en Tenant ID in AZURE-AD-SETUP.md</small></p>
            </div>
        `;
	}
}

// Reset demo data
async function resetDemoData() {
	if (!isDemoMode()) {
		showToast("Demo modus is niet actief", "warning");
		return;
	}

	const confirmed = await showConfirm(
		"Weet u zeker dat u alle demo data wilt resetten naar de standaard waarden?",
		"Demo data resetten",
	);
	if (confirmed) {
		const db = getDemoDatabase();
		db.reset();
		showToast("Demo data is gereset", "success");
		window.location.reload();
	}
}

// Export demo data
function exportDemoData() {
	if (!isDemoMode()) {
		showToast("Demo modus is niet actief", "warning");
		return;
	}

	const db = getDemoDatabase();
	const data = JSON.stringify(db.data, null, 2);

	const blob = new Blob([data], { type: "application/json" });
	const url = URL.createObjectURL(blob);

	const a = document.createElement("a");
	a.href = url;
	a.download = `demo-data-${new Date().toISOString().split("T")[0]}.json`;
	a.click();

	URL.revokeObjectURL(url);
}

// Import demo data
function importDemoData() {
	if (!isDemoMode()) {
		showToast("Demo modus is niet actief", "warning");
		return;
	}

	const input = document.createElement("input");
	input.type = "file";
	input.accept = "application/json";

	input.onchange = (e) => {
		const file = e.target.files[0];
		const reader = new FileReader();

		reader.onload = (event) => {
			try {
				const data = JSON.parse(event.target.result);
				const db = getDemoDatabase();
				db.data = data;

				showToast("Demo data geïmporteerd", "success");
				window.location.reload();
			} catch (error) {
				showToast(`Fout bij importeren: ${error.message}`, "error");
			}
		};

		reader.readAsText(file);
	};

	input.click();
}

// Load AI configuration
async function loadAIConfig() {
	const proxyField = document.getElementById("azureOpenAIProxyUrl");
	try {
		const aiConfig = await dbGet("settings", "azureOpenAIConfig");
		if (aiConfig) {
			if (aiConfig.endpoint)
				document.getElementById("azureOpenAIEndpoint").value =
					aiConfig.endpoint;
			if (proxyField && aiConfig.proxyUrl) proxyField.value = aiConfig.proxyUrl;
			if (aiConfig.apiKey)
				document.getElementById("azureOpenAIKey").value = "**********";
			return;
		}
	} catch (e) {
		console.warn("Failed to load AI config from Firebase", e);
	}
	// Fallback to localStorage
	const aiConfig = storage.get("azureOpenAIConfig", {});
	if (aiConfig.endpoint)
		document.getElementById("azureOpenAIEndpoint").value = aiConfig.endpoint;
	if (proxyField && aiConfig.proxyUrl) proxyField.value = aiConfig.proxyUrl;
	if (aiConfig.apiKey)
		document.getElementById("azureOpenAIKey").value = "**********";
}

// AI Configuration
async function saveAIConfig() {
	const endpoint = document.getElementById("azureOpenAIEndpoint").value.trim();
	const apiKey = document.getElementById("azureOpenAIKey").value.trim();
	const proxyUrl =
		document.getElementById("azureOpenAIProxyUrl")?.value.trim() || "";

	if (!endpoint && !proxyUrl) {
		showToast("Voer een Azure OpenAI endpoint of proxy URL in", "error");
		return;
	}

	// Don't overwrite key if user didn't change it (shows as dots)
	let existingKey = null;
	try {
		const existing = await dbGet("settings", "azureOpenAIConfig");
		existingKey = existing?.apiKey;
	} catch (e) {
		const existingConfig = storage.get("azureOpenAIConfig", {});
		existingKey = existingConfig.apiKey;
	}

	const config = {
		endpoint: endpoint,
		proxyUrl: proxyUrl,
		apiKey: apiKey.includes("**") ? existingKey : apiKey,
	};

	if (proxyUrl && !config.apiKey) {
		config.apiKey = undefined;
	}

	try {
		await dbUpdate("settings", "azureOpenAIConfig", config);
		storage.set("azureOpenAIConfig", config);
		showToast("AI configuratie opgeslagen", "success");
	} catch (e) {
		console.error("Failed to save AI config to Firebase", e);
		storage.set("azureOpenAIConfig", config);
		showToast("AI configuratie lokaal opgeslagen", "warning");
	}
}

async function testAIConfig() {
	let config = null;
	try {
		config = await dbGet("settings", "azureOpenAIConfig");
	} catch (e) {
		config = storage.get("azureOpenAIConfig", null);
	}
	if (!config || (!config.proxyUrl && (!config.endpoint || !config.apiKey))) {
		showToast("Sla eerst de AI configuratie op", "error");
		return;
	}

	try {
		showLoading("Verbinding testen...");
		const response = config.proxyUrl
			? await fetch(config.proxyUrl, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						message: "Zeg hallo in het Nederlands",
						context: "Testaanroep vanuit Admin",
					}),
				})
			: await fetch(config.endpoint, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						"api-key": config.apiKey,
					},
					body: JSON.stringify({
						messages: [
							{ role: "user", content: "Zeg hallo in het Nederlands" },
						],
						max_tokens: 50,
					}),
				});

		hideLoading();

		if (response.ok) {
			showToast("Verbinding met Azure OpenAI succesvol!", "success");
		} else {
			const errorData = await response.json().catch(() => ({}));
			showToast(
				`Verbinding mislukt: ${response.status} - ${errorData.error?.message || "Onbekende fout"}`,
				"error",
			);
		}
	} catch (error) {
		hideLoading();
		showToast(`Verbinding mislukt: ${error.message}`, "error");
	}
}

// Audit Log Display
async function loadAuditLogEntries() {
	const container = document.getElementById("auditLogContainer");
	if (!container) return;

	container.innerHTML = '<p class="empty-state">Laden...</p>';

	try {
		const filters = {
			entityType: document.getElementById("auditEntityFilter")?.value || "",
			action: document.getElementById("auditActionFilter")?.value || "",
			limit: 100,
		};

		const entries = await getAuditLog(filters);

		if (entries.length === 0) {
			container.innerHTML =
				'<p class="empty-state">Geen audit logboek items gevonden</p>';
			return;
		}

		container.innerHTML = entries
			.map((entry) => {
				return `<div style="padding: 10px 0; border-bottom: 1px solid var(--border-color); font-size: 13px;">
                ${formatAuditEntry(entry)}
            </div>`;
			})
			.join("");
	} catch (error) {
		console.error("Error loading audit log:", error);
		container.innerHTML =
			'<p class="empty-state">Fout bij het laden van het audit logboek</p>';
	}
}

window.loadAuditLogEntries = loadAuditLogEntries;


// ============================================
// BRANDING / HUISSTIJL TAB
// ============================================

function initBrandingTab() {
const form = document.getElementById("brandingForm");
if (!form) return;

populateBrandingForm();

const fileInput = document.getElementById("brandingLogoFile");
if (fileInput) {
fileInput.addEventListener("change", handleLogoFileChange);
}

const resetBtn = document.getElementById("resetBrandingBtn");
if (resetBtn) {
resetBtn.addEventListener("click", handleResetBranding);
}

form.addEventListener("submit", handleBrandingSubmit);

// Refresh from server when tab is opened
const tabBtn = document.querySelector('.tab-btn[data-tab="branding"]');
if (tabBtn) {
tabBtn.addEventListener("click", async () => {
if (typeof loadBranding === "function") {
await loadBranding();
populateBrandingForm();
}
});
}
}

function populateBrandingForm() {
if (typeof getBranding !== "function") return;
const b = getBranding();
const set = (id, val) => {
const el = document.getElementById(id);
if (el) el.value = val ?? "";
};
set("brandingAppName", b.appName);
set("brandingCompanyName", b.companyName);
set("brandingTagline", b.tagline);
set("brandingLogoUrl", b.logoUrl);
set("brandingPrimaryColor", b.primaryColor);
set("brandingAccentColor", b.accentColor);
set("brandingSupportEmail", b.supportEmail);
set("brandingCompanyPhone", b.companyPhone);
set("brandingCompanyAddress", b.companyAddress);
set("brandingCompanyWebsite", b.companyWebsite);
set("brandingCompanyIban", b.companyIban);

const adminEmailsTxt = document.getElementById("brandingAdminEmails");
if (adminEmailsTxt) {
adminEmailsTxt.value = Array.isArray(b.adminEmails)
? b.adminEmails.join("\n")
: "";
}

const preview = document.getElementById("brandingLogoPreview");
if (preview && b.logoUrl) preview.src = b.logoUrl;
}

async function handleLogoFileChange(e) {
const file = e.target.files?.[0];
if (!file) return;

// Validate type and size
const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];
if (!allowed.includes(file.type)) {
showToast("Ongeldig bestandstype. Gebruik JPG, PNG, WebP, GIF of SVG.", "error");
e.target.value = "";
return;
}
const MAX_BYTES = 2 * 1024 * 1024;
if (file.size > MAX_BYTES) {
showToast("Bestand te groot (max 2 MB).", "error");
e.target.value = "";
return;
}

// Show local preview immediately
const preview = document.getElementById("brandingLogoPreview");
const reader = new FileReader();
reader.onload = (ev) => {
if (preview) preview.src = ev.target.result;
const urlField = document.getElementById("brandingLogoUrl");
if (urlField) urlField.value = ev.target.result;
};
reader.readAsDataURL(file);

// Try uploading to Cloudflare if available
if (typeof uploadLogo === "function") {
try {
showLoading("Logo uploaden...");
const url = await uploadLogo(file);
hideLoading();
if (url) {
const urlField = document.getElementById("brandingLogoUrl");
if (urlField) urlField.value = url;
if (preview) preview.src = url;
showToast("Logo geüpload", "success");
}
} catch (err) {
hideLoading();
console.warn("Upload to Cloudflare failed, using inline data URL", err);
showToast("Upload naar server mislukt; gebruik 'Opslaan' om data-URL te bewaren.", "info");
}
}
}

async function handleBrandingSubmit(e) {
e.preventDefault();
const get = (id) => document.getElementById(id)?.value?.trim() ?? "";

const adminEmailsRaw = document.getElementById("brandingAdminEmails")?.value ?? "";
const adminEmails = adminEmailsRaw
.split(/\r?\n/)
.map((s) => s.trim())
.filter((s) => s && /\S+@\S+\.\S+/.test(s));

const updates = {
appName: get("brandingAppName"),
companyName: get("brandingCompanyName"),
tagline: get("brandingTagline"),
logoUrl: get("brandingLogoUrl"),
primaryColor: get("brandingPrimaryColor"),
accentColor: get("brandingAccentColor"),
supportEmail: get("brandingSupportEmail"),
companyPhone: get("brandingCompanyPhone"),
companyAddress: get("brandingCompanyAddress"),
companyWebsite: get("brandingCompanyWebsite"),
companyIban: get("brandingCompanyIban"),
adminEmails,
};

if (!updates.appName || !updates.companyName) {
showToast("Applicatienaam en bedrijfsnaam zijn verplicht", "error");
return;
}

try {
showLoading("Huisstijl opslaan...");
if (typeof saveBranding === "function") {
await saveBranding(updates);
}
if (typeof applyBranding === "function") applyBranding();
hideLoading();
showToast("Huisstijl opgeslagen", "success");
} catch (err) {
hideLoading();
console.error("Save branding failed", err);
showToast("Opslaan mislukt: " + (err?.message || "onbekende fout"), "error");
}
}

async function handleResetBranding() {
if (!confirm("Weet u zeker dat u de huisstijl wilt resetten naar de standaardwaarden?")) {
return;
}
try {
showLoading("Resetten...");
if (typeof window.resetBranding === "function") {
await window.resetBranding();
} else {
localStorage.removeItem("tenantBranding");
if (typeof loadBranding === "function") await loadBranding();
}
populateBrandingForm();
if (typeof applyBranding === "function") applyBranding();
hideLoading();
showToast("Huisstijl gereset", "success");
} catch (err) {
hideLoading();
showToast("Reset mislukt", "error");
}
}

window.initBrandingTab = initBrandingTab;
