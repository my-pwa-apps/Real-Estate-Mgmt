// objctmgmt-api - Cloudflare Worker
// One backend for the SPA: AI (Workers AI), file storage (R2), tenant settings (KV).
// Auth: Entra ID JWT validated against Microsoft JWKS (with simple in-memory cache).

const JSON_HEADERS = { "content-type": "application/json; charset=utf-8" };

// --- tiny JWKS cache ---------------------------------------------------------
let jwksCache = { tenantId: null, fetchedAt: 0, keys: null };
const JWKS_TTL_MS = 1000 * 60 * 60; // 1h

async function getJwks(tenantId) {
	const now = Date.now();
	if (
		jwksCache.tenantId === tenantId &&
		jwksCache.keys &&
		now - jwksCache.fetchedAt < JWKS_TTL_MS
	) {
		return jwksCache.keys;
	}
	const url = `https://login.microsoftonline.com/${tenantId}/discovery/v2.0/keys`;
	const res = await fetch(url);
	if (!res.ok) throw new Error("Failed to fetch JWKS");
	const data = await res.json();
	jwksCache = { tenantId, fetchedAt: now, keys: data.keys };
	return data.keys;
}

function b64UrlDecode(input) {
	const pad = "=".repeat((4 - (input.length % 4)) % 4);
	const base64 = (input + pad).replace(/-/g, "+").replace(/_/g, "/");
	const bin = atob(base64);
	const bytes = new Uint8Array(bin.length);
	for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
	return bytes;
}

async function importRsaKey(jwk) {
	return crypto.subtle.importKey(
		"jwk",
		{ kty: jwk.kty, n: jwk.n, e: jwk.e, alg: "RS256", ext: true },
		{ name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
		false,
		["verify"],
	);
}

async function verifyEntraToken(token, env) {
	if (!token) throw new Error("No token");
	const [headerB64, payloadB64, sigB64] = token.split(".");
	if (!headerB64 || !payloadB64 || !sigB64) throw new Error("Malformed JWT");

	const header = JSON.parse(new TextDecoder().decode(b64UrlDecode(headerB64)));
	const payload = JSON.parse(
		new TextDecoder().decode(b64UrlDecode(payloadB64)),
	);

	const tenantId = env.ENTRA_TENANT_ID;
	const audience = env.ENTRA_AUDIENCE;
	if (!tenantId) throw new Error("ENTRA_TENANT_ID not configured");

	if (audience && payload.aud !== audience) throw new Error("Bad audience");
	if (payload.exp && payload.exp * 1000 < Date.now())
		throw new Error("Token expired");
	if (payload.tid && payload.tid !== tenantId)
		throw new Error("Wrong tenant");

	const keys = await getJwks(tenantId);
	const jwk = keys.find((k) => k.kid === header.kid);
	if (!jwk) throw new Error("Signing key not found");
	const key = await importRsaKey(jwk);

	const data = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
	const sig = b64UrlDecode(sigB64);
	const ok = await crypto.subtle.verify(
		"RSASSA-PKCS1-v1_5",
		key,
		sig,
		data,
	);
	if (!ok) throw new Error("Bad signature");
	return payload;
}

async function authenticate(request, env) {
	if (
		env.ALLOW_DEMO_MODE === "true" &&
		request.headers.get("X-Demo-Mode") === "true"
	) {
		return { sub: "demo", email: "demo@local", roles: ["DEMO"], demo: true };
	}
	const auth = request.headers.get("Authorization") || "";
	const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
	const payload = await verifyEntraToken(token, env);
	return {
		sub: payload.sub || payload.oid,
		email: payload.preferred_username || payload.email || "",
		name: payload.name || "",
		roles: payload.roles || [],
		tid: payload.tid,
	};
}

// --- CORS --------------------------------------------------------------------
function corsHeaders(request, env) {
	const origin = request.headers.get("Origin") || "";
	const allowed = (env.ALLOWED_ORIGINS || "")
		.split(",")
		.map((s) => s.trim())
		.filter(Boolean);
	const allow = allowed.includes(origin) ? origin : allowed[0] || "*";
	return {
		"Access-Control-Allow-Origin": allow,
		"Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
		"Access-Control-Allow-Headers":
			"Authorization,Content-Type,X-Demo-Mode,X-Tenant-Id",
		"Access-Control-Max-Age": "86400",
		Vary: "Origin",
	};
}

function json(body, status, request, env) {
	return new Response(JSON.stringify(body), {
		status,
		headers: { ...JSON_HEADERS, ...corsHeaders(request, env) },
	});
}

// --- Routes ------------------------------------------------------------------
async function handleAiChat(request, env) {
	const { messages, model = "@cf/meta/llama-3.1-8b-instruct", max_tokens = 800 } =
		await request.json();
	if (!Array.isArray(messages)) {
		return json({ error: "messages must be an array" }, 400, request, env);
	}
	const result = await env.AI.run(model, { messages, max_tokens });
	const content = result.response || result.choices?.[0]?.message?.content || "";
	return json({ content, model }, 200, request, env);
}

async function handleAiVision(request, env) {
	const { prompt, imageBase64, model = "@cf/llava-hf/llava-1.5-7b-hf" } =
		await request.json();
	if (!imageBase64) {
		return json({ error: "imageBase64 required" }, 400, request, env);
	}
	const bytes = b64UrlDecode(imageBase64.replace(/^data:[^;]+;base64,/, ""));
	const result = await env.AI.run(model, {
		image: Array.from(bytes),
		prompt: prompt || "Describe this image in Dutch.",
		max_tokens: 512,
	});
	return json(
		{ content: result.description || result.response || "" },
		200,
		request,
		env,
	);
}

function safeKey(parts) {
	return parts
		.filter(Boolean)
		.map((p) => String(p).replace(/[^a-zA-Z0-9._-]/g, "_"))
		.join("/");
}

async function handleFilesUpload(request, env, user) {
	if (!env.DOCUMENTS) {
		return json({ error: "R2 storage is not enabled on this Worker." }, 503, request, env);
	}
	const url = new URL(request.url);
	const entityType = url.searchParams.get("entityType");
	const entityId = url.searchParams.get("entityId");
	const fileName = url.searchParams.get("name") || "file";
	if (!entityType || !entityId) {
		return json({ error: "entityType + entityId required" }, 400, request, env);
	}
	const contentType =
		request.headers.get("Content-Type") || "application/octet-stream";
	const key = safeKey([entityType, entityId, `${Date.now()}_${fileName}`]);
	const obj = await env.DOCUMENTS.put(key, request.body, {
		httpMetadata: { contentType },
		customMetadata: {
			uploadedBy: user.email || user.sub,
			entityType,
			entityId,
		},
	});
	return json(
		{
			key,
			size: obj.size,
			etag: obj.etag,
			url: `/files/download?key=${encodeURIComponent(key)}`,
		},
		200,
		request,
		env,
	);
}

async function handleFilesDownload(request, env) {
	if (!env.DOCUMENTS) {
		return json({ error: "R2 storage is not enabled on this Worker." }, 503, request, env);
	}
	const url = new URL(request.url);
	const key = url.searchParams.get("key");
	if (!key) return json({ error: "key required" }, 400, request, env);
	const obj = await env.DOCUMENTS.get(key);
	if (!obj) return json({ error: "not found" }, 404, request, env);
	const headers = new Headers(corsHeaders(request, env));
	obj.writeHttpMetadata(headers);
	headers.set("ETag", obj.httpEtag);
	headers.set("Cache-Control", "private, max-age=300");
	return new Response(obj.body, { headers });
}

async function handleFilesList(request, env) {
	if (!env.DOCUMENTS) {
		return json({ error: "R2 storage is not enabled on this Worker." }, 503, request, env);
	}
	const url = new URL(request.url);
	const prefix = url.searchParams.get("prefix") || "";
	const list = await env.DOCUMENTS.list({ prefix, limit: 200 });
	return json(
		{
			objects: list.objects.map((o) => ({
				key: o.key,
				size: o.size,
				uploaded: o.uploaded,
				contentType: o.httpMetadata?.contentType,
				customMetadata: o.customMetadata,
			})),
			truncated: list.truncated,
		},
		200,
		request,
		env,
	);
}

async function handleFilesDelete(request, env) {
	if (!env.DOCUMENTS) {
		return json({ error: "R2 storage is not enabled on this Worker." }, 503, request, env);
	}
	const url = new URL(request.url);
	const key = url.searchParams.get("key");
	if (!key) return json({ error: "key required" }, 400, request, env);
	await env.DOCUMENTS.delete(key);
	return json({ deleted: key }, 200, request, env);
}

async function handleTenantGet(request, env) {
	const url = new URL(request.url);
	const tenantId = url.searchParams.get("tenant") || "default";
	const raw = await env.TENANT_SETTINGS.get(`branding:${tenantId}`);
	return json(raw ? JSON.parse(raw) : null, 200, request, env);
}

async function handleTenantPut(request, env, user) {
	if (!user.roles.includes("ADMIN") && !user.demo) {
		return json({ error: "ADMIN role required" }, 403, request, env);
	}
	const url = new URL(request.url);
	const tenantId = url.searchParams.get("tenant") || "default";
	const body = await request.json();
	await env.TENANT_SETTINGS.put(`branding:${tenantId}`, JSON.stringify(body));
	return json({ ok: true }, 200, request, env);
}

// --- Generic entity DB (D1) -------------------------------------------------
// Replaces Firebase Realtime Database. One row per entity, JSON blob for the
// schemaless payload. Tenant isolation comes from the validated JWT `tid`
// claim (or "demo" for demo-mode tokens).

const COLLECTION_RE = /^[a-zA-Z][a-zA-Z0-9_-]{0,63}$/;
const ID_RE = /^[a-zA-Z0-9_-]{1,128}$/;

function ensureDb(request, env) {
	if (!env.DB) {
		return json(
			{ error: "D1 database is not enabled on this Worker." },
			503,
			request,
			env,
		);
	}
	return null;
}

function tenantOf(user) {
	return user.tid || (user.demo ? "demo" : "default");
}

function generateId() {
	// 22-char URL-safe random ID. Globally unique enough for our use cases.
	const bytes = new Uint8Array(16);
	crypto.getRandomValues(bytes);
	let s = "";
	for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
	return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function rowToObject(row) {
	if (!row) return null;
	const data = JSON.parse(row.data);
	return { id: row.id, ...data };
}

async function handleDbList(request, env, user) {
	const guard = ensureDb(request, env);
	if (guard) return guard;
	const url = new URL(request.url);
	const collection = url.searchParams.get("c");
	const id = url.searchParams.get("id");
	if (!collection || !COLLECTION_RE.test(collection)) {
		return json({ error: "invalid collection" }, 400, request, env);
	}
	const tenant = tenantOf(user);

	if (id) {
		if (!ID_RE.test(id)) {
			return json({ error: "invalid id" }, 400, request, env);
		}
		const row = await env.DB.prepare(
			"SELECT id, data FROM entities WHERE tenant_id=? AND collection=? AND id=?",
		)
			.bind(tenant, collection, id)
			.first();
		return json(rowToObject(row), 200, request, env);
	}

	const result = await env.DB.prepare(
		"SELECT id, data FROM entities WHERE tenant_id=? AND collection=? ORDER BY updated_at DESC",
	)
		.bind(tenant, collection)
		.all();
	return json(
		(result.results || []).map(rowToObject),
		200,
		request,
		env,
	);
}

async function handleDbCreate(request, env, user) {
	const guard = ensureDb(request, env);
	if (guard) return guard;
	if (user.roles.includes("VIEWER")) {
		return json({ error: "VIEWER role cannot write" }, 403, request, env);
	}
	const url = new URL(request.url);
	const collection = url.searchParams.get("c");
	if (!collection || !COLLECTION_RE.test(collection)) {
		return json({ error: "invalid collection" }, 400, request, env);
	}
	const body = await request.json();
	if (!body || typeof body !== "object" || Array.isArray(body)) {
		return json({ error: "body must be an object" }, 400, request, env);
	}
	const tenant = tenantOf(user);
	const now = Date.now();
	const id = generateId();
	const payload = { ...body, createdAt: now, updatedAt: now };
	delete payload.id;
	await env.DB.prepare(
		"INSERT INTO entities (tenant_id, collection, id, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
	)
		.bind(tenant, collection, id, JSON.stringify(payload), now, now)
		.run();
	return json({ id }, 200, request, env);
}

async function handleDbUpdate(request, env, user) {
	const guard = ensureDb(request, env);
	if (guard) return guard;
	if (user.roles.includes("VIEWER")) {
		return json({ error: "VIEWER role cannot write" }, 403, request, env);
	}
	const url = new URL(request.url);
	const collection = url.searchParams.get("c");
	const id = url.searchParams.get("id");
	if (!collection || !COLLECTION_RE.test(collection)) {
		return json({ error: "invalid collection" }, 400, request, env);
	}
	if (!id || !ID_RE.test(id)) {
		return json({ error: "invalid id" }, 400, request, env);
	}
	const body = await request.json();
	if (!body || typeof body !== "object" || Array.isArray(body)) {
		return json({ error: "body must be an object" }, 400, request, env);
	}
	const tenant = tenantOf(user);
	const now = Date.now();

	// Upsert with merge semantics: existing top-level keys are kept unless
	// overridden by `body`. Matches Firebase `update()` behaviour and the
	// previous front-end contract.
	const existing = await env.DB.prepare(
		"SELECT data, created_at FROM entities WHERE tenant_id=? AND collection=? AND id=?",
	)
		.bind(tenant, collection, id)
		.first();

	const merged = existing
		? { ...JSON.parse(existing.data), ...body, updatedAt: now }
		: { ...body, createdAt: now, updatedAt: now };
	delete merged.id;
	const createdAt = existing ? existing.created_at : now;

	await env.DB.prepare(
		"INSERT INTO entities (tenant_id, collection, id, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?) " +
			"ON CONFLICT(tenant_id, collection, id) DO UPDATE SET data=excluded.data, updated_at=excluded.updated_at",
	)
		.bind(tenant, collection, id, JSON.stringify(merged), createdAt, now)
		.run();
	return json({ id, ok: true }, 200, request, env);
}

async function handleDbDelete(request, env, user) {
	const guard = ensureDb(request, env);
	if (guard) return guard;
	if (user.roles.includes("VIEWER")) {
		return json({ error: "VIEWER role cannot write" }, 403, request, env);
	}
	const url = new URL(request.url);
	const collection = url.searchParams.get("c");
	const id = url.searchParams.get("id");
	if (!collection || !COLLECTION_RE.test(collection)) {
		return json({ error: "invalid collection" }, 400, request, env);
	}
	if (!id || !ID_RE.test(id)) {
		return json({ error: "invalid id" }, 400, request, env);
	}
	const tenant = tenantOf(user);
	await env.DB.prepare(
		"DELETE FROM entities WHERE tenant_id=? AND collection=? AND id=?",
	)
		.bind(tenant, collection, id)
		.run();
	return json({ id, deleted: true }, 200, request, env);
}

// --- Router ------------------------------------------------------------------
const ROUTES = [
	{ method: "POST", path: "/ai/chat", auth: true, handler: handleAiChat },
	{ method: "POST", path: "/ai/vision", auth: true, handler: handleAiVision },
	{ method: "PUT", path: "/files/upload", auth: true, handler: handleFilesUpload },
	{
		method: "GET",
		path: "/files/download",
		auth: true,
		handler: handleFilesDownload,
	},
	{ method: "GET", path: "/files/list", auth: true, handler: handleFilesList },
	{
		method: "DELETE",
		path: "/files/delete",
		auth: true,
		handler: handleFilesDelete,
	},
	// Tenant branding read is intentionally public so the login page can fetch
	// the logo before the user signs in.
	{ method: "GET", path: "/tenant/branding", auth: false, handler: handleTenantGet },
	{ method: "PUT", path: "/tenant/branding", auth: true, handler: handleTenantPut },
	// Generic entity DB (replaces Firebase Realtime Database).
	{ method: "GET", path: "/db", auth: true, handler: handleDbList },
	{ method: "POST", path: "/db", auth: true, handler: handleDbCreate },
	{ method: "PUT", path: "/db", auth: true, handler: handleDbUpdate },
	{ method: "DELETE", path: "/db", auth: true, handler: handleDbDelete },
];

export default {
	async fetch(request, env) {
		if (request.method === "OPTIONS") {
			return new Response(null, { headers: corsHeaders(request, env) });
		}
		const url = new URL(request.url);
		const route = ROUTES.find(
			(r) => r.method === request.method && r.path === url.pathname,
		);
		if (!route) {
			return json({ error: "Not found" }, 404, request, env);
		}

		let user = null;
		if (route.auth) {
			try {
				user = await authenticate(request, env);
			} catch (err) {
				return json(
					{ error: "Unauthorized", detail: err.message },
					401,
					request,
					env,
				);
			}
		}

		try {
			return await route.handler(request, env, user);
		} catch (err) {
			return json({ error: "Internal error", detail: err.message }, 500, request, env);
		}
	},
};
