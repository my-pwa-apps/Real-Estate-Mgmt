// Service Worker for Stadsgezicht Vastgoedbeheer PWA
// Provides offline caching and PWA install support

const CACHE_NAME = "stadsgezicht-v2";
const STATIC_ASSETS = [
	"/",
	"/dashboard.html",
	"/panden.html",
	"/huurders.html",
	"/contracten.html",
	"/onderhoud.html",
	"/werkbonnen.html",
	"/financieel.html",
	"/admin.html",
	"/css/styles.css",
	"/css/enhancements.css",
	"/images/stadsgezicht-logo.jpg",
	"/js/config.js",
	"/js/ui-utilities.js",
	"/js/demo-data.js",
	"/js/entra-auth.js",
	"/js/db-helpers.js",
	"/js/app-init.js",
	"/js/detail-panel.js",
	"/js/audit-trail.js",
	"/js/data-export.js",
	"/js/global-search.js",
	"/js/copilot-assistant.js",
	"/js/microsoft-auth.js",
	"/js/sharepoint-helpers.js",
	"/js/email-helpers.js",
	"/js/invoice-helpers.js",
	"/js/werkbon-helpers.js",
	"/js/rent-increase.js",
	"/js/login.js",
	"/js/dashboard.js",
	"/js/panden.js",
	"/js/huurders.js",
	"/js/contracten.js",
	"/js/onderhoud.js",
	"/js/werkbonnen.js",
	"/js/financieel.js",
	"/js/admin.js",
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
