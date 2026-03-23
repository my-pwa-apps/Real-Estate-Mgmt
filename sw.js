// Service Worker for Stadsgezicht Vastgoedbeheer PWA
// Provides offline caching and PWA install support

const CACHE_NAME = "stadsgezicht-v4";

// Compute base path to support subdirectory deployments (e.g., GitHub Pages /Real-Estate-Mgmt/)
const BASE_PATH = self.location.pathname.replace(/sw\.js$/, "");

const STATIC_ASSETS = [
	BASE_PATH,
	`${BASE_PATH}dashboard.html`,
	`${BASE_PATH}panden.html`,
	`${BASE_PATH}huurders.html`,
	`${BASE_PATH}contracten.html`,
	`${BASE_PATH}onderhoud.html`,
	`${BASE_PATH}werkbonnen.html`,
	`${BASE_PATH}financieel.html`,
	`${BASE_PATH}admin.html`,
	`${BASE_PATH}css/styles.css`,
	`${BASE_PATH}css/enhancements.css`,
	`${BASE_PATH}images/stadsgezicht-logo.jpg`,
	`${BASE_PATH}js/config.js`,
	`${BASE_PATH}js/ui-utilities.js`,
	`${BASE_PATH}js/demo-data.js`,
	`${BASE_PATH}js/entra-auth.js`,
	`${BASE_PATH}js/db-helpers.js`,
	`${BASE_PATH}js/app-init.js`,
	`${BASE_PATH}js/detail-panel.js`,
	`${BASE_PATH}js/audit-trail.js`,
	`${BASE_PATH}js/data-export.js`,
	`${BASE_PATH}js/global-search.js`,
	`${BASE_PATH}js/copilot-assistant.js`,
	`${BASE_PATH}js/microsoft-auth.js`,
	`${BASE_PATH}js/sharepoint-helpers.js`,
	`${BASE_PATH}js/email-helpers.js`,
	`${BASE_PATH}js/invoice-helpers.js`,
	`${BASE_PATH}js/werkbon-helpers.js`,
	`${BASE_PATH}js/rent-increase.js`,
	`${BASE_PATH}js/login.js`,
	`${BASE_PATH}js/dashboard.js`,
	`${BASE_PATH}js/panden.js`,
	`${BASE_PATH}js/huurders.js`,
	`${BASE_PATH}js/contracten.js`,
	`${BASE_PATH}js/onderhoud.js`,
	`${BASE_PATH}js/werkbonnen.js`,
	`${BASE_PATH}js/financieel.js`,
	`${BASE_PATH}js/admin.js`,
];

// Install: cache static assets
self.addEventListener("install", (event) => {
	event.waitUntil(
		caches.open(CACHE_NAME).then((cache) => {
			return cache.addAll(STATIC_ASSETS).catch((err) => {
				console.warn("Some assets failed to cache:", err);
			});
		}),
	);
	self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener("activate", (event) => {
	event.waitUntil(
		caches.keys().then((keys) => {
			return Promise.all(
				keys
					.filter((key) => key !== CACHE_NAME)
					.map((key) => caches.delete(key)),
			);
		}),
	);
	self.clients.claim();
});

// Fetch: network-first with cache fallback for pages, cache-first for assets
self.addEventListener("fetch", (event) => {
	const url = new URL(event.request.url);

	// Skip non-GET and external requests
	if (
		event.request.method !== "GET" ||
		!url.origin.includes(self.location.origin)
	) {
		return;
	}

	// HTML pages: network-first
	if (event.request.headers.get("accept")?.includes("text/html")) {
		event.respondWith(
			fetch(event.request)
				.then((response) => {
					const clone = response.clone();
					caches
						.open(CACHE_NAME)
						.then((cache) => cache.put(event.request, clone));
					return response;
				})
				.catch(() => caches.match(event.request)),
		);
		return;
	}

	// Static assets: cache-first
	event.respondWith(
		caches.match(event.request).then((cached) => {
			return (
				cached ||
				fetch(event.request).then((response) => {
					const clone = response.clone();
					caches
						.open(CACHE_NAME)
						.then((cache) => cache.put(event.request, clone));
					return response;
				})
			);
		}),
	);
});
