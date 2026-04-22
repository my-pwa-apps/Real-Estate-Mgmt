// Application configuration.
// All entity data is stored in Cloudflare D1 via the objctmgmt-api Worker.
// Auth uses MSAL (Entra ID) — see js/entra-auth.js. Demo mode keeps data
// in localStorage via js/demo-data.js.

// Cloudflare Worker (objctmgmt-api) base URL.
// Override per deployment by setting `window.OBJCTMGMT_API_BASE` before this
// script runs, e.g. via a small per-tenant config.local.js.
window.OBJCTMGMT_API_BASE =
	window.OBJCTMGMT_API_BASE ||
	"https://objctmgmt-api.garfieldapp.workers.dev";
window.OBJCTMGMT_TENANT_ID = window.OBJCTMGMT_TENANT_ID || "default";
