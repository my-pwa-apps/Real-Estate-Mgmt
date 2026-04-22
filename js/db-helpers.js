// Database Helper Functions
// Talks to the objctmgmt-api Cloudflare Worker (D1-backed entity store).
// In demo mode all calls are routed to the in-memory localStorage demo DB
// instead, so the rest of the app code remains storage-agnostic.

function getApiBase() {
	return (
		window.OBJCTMGMT_API_BASE ||
		"https://objctmgmt-api.garfieldapp.workers.dev"
	).replace(/\/+$/, "");
}

async function apiFetch(path, opts = {}) {
	const base = getApiBase();
	const headers = new Headers(opts.headers || {});
	const token = window.currentUser?.accessToken;
	if (token) headers.set("Authorization", `Bearer ${token}`);
	if (opts.body && !headers.has("Content-Type")) {
		headers.set("Content-Type", "application/json");
	}
	const res = await fetch(`${base}${path}`, { ...opts, headers });
	let body = null;
	try {
		body = await res.json();
	} catch (_) {
		// non-JSON response
	}
	if (!res.ok) {
		const msg = body?.error || `HTTP ${res.status}`;
		const detail = body?.detail ? `: ${body.detail}` : "";
		throw new Error(`${msg}${detail}`);
	}
	return body;
}

function dbInDemoMode() {
	return typeof isDemoMode === "function" && isDemoMode();
}

// Get all items from a collection
async function dbGetAll(path) {
	if (dbInDemoMode()) return getDemoDbHelpers().dbGetAll(path);
	try {
		const data = await apiFetch(`/db?c=${encodeURIComponent(path)}`);
		return Array.isArray(data) ? data : [];
	} catch (error) {
		console.error(`Error getting all from ${path}:`, error);
		throw error;
	}
}

// Get single item by id
async function dbGet(path, id) {
	if (dbInDemoMode()) return getDemoDbHelpers().dbGet(path, id);
	try {
		const data = await apiFetch(
			`/db?c=${encodeURIComponent(path)}&id=${encodeURIComponent(id)}`,
		);
		return data || null;
	} catch (error) {
		console.error(`Error getting ${path}/${id}:`, error);
		throw error;
	}
}

// Add new item (auto-generated id)
async function dbAdd(path, data) {
	if (dbInDemoMode()) return getDemoDbHelpers().dbAdd(path, data);
	try {
		const res = await apiFetch(`/db?c=${encodeURIComponent(path)}`, {
			method: "POST",
			body: JSON.stringify(data || {}),
		});
		return res?.id;
	} catch (error) {
		console.error(`Error adding to ${path}:`, error);
		throw error;
	}
}

// Update existing item (merges top-level keys, upserts if missing)
async function dbUpdate(path, id, data) {
	if (dbInDemoMode()) return getDemoDbHelpers().dbUpdate(path, id, data);
	try {
		await apiFetch(
			`/db?c=${encodeURIComponent(path)}&id=${encodeURIComponent(id)}`,
			{
				method: "PUT",
				body: JSON.stringify(data || {}),
			},
		);
		return true;
	} catch (error) {
		console.error(`Error updating ${path}/${id}:`, error);
		throw error;
	}
}

// Delete item
async function dbDelete(path, id) {
	if (dbInDemoMode()) return getDemoDbHelpers().dbDelete(path, id);
	try {
		await apiFetch(
			`/db?c=${encodeURIComponent(path)}&id=${encodeURIComponent(id)}`,
			{ method: "DELETE" },
		);
		return true;
	} catch (error) {
		console.error(`Error deleting ${path}/${id}:`, error);
		throw error;
	}
}

// Query items with simple filter (client-side over the full collection).
// Kept for backward compatibility with the previous Firebase-style API.
async function dbQuery(path, orderByChild, equalTo) {
	if (dbInDemoMode()) {
		return getDemoDbHelpers().dbQuery(path, {
			orderBy: orderByChild,
			where: equalTo !== undefined ? [orderByChild, "==", equalTo] : null,
		});
	}
	const all = await dbGetAll(path);
	let filtered = all;
	if (orderByChild && equalTo !== undefined) {
		filtered = all.filter((item) => item[orderByChild] === equalTo);
	}
	if (orderByChild) {
		filtered = [...filtered].sort((a, b) => {
			const av = a[orderByChild];
			const bv = b[orderByChild];
			if (av === bv) return 0;
			return av < bv ? -1 : 1;
		});
	}
	return filtered;
}

// Export
window.dbGetAll = dbGetAll;
window.dbGet = dbGet;
window.dbAdd = dbAdd;
window.dbUpdate = dbUpdate;
window.dbDelete = dbDelete;
window.dbQuery = dbQuery;
