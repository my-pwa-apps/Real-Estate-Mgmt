# objctmgmt-api (Cloudflare Worker)

Single backend for the ObjctMgmt SPA: AI (Workers AI), file storage (R2), tenant settings (KV).

## One-time setup

```pwsh
# 1. Re-login wrangler with R2 scope (current token is missing r2:write)
npx wrangler login

# 2. Create the R2 bucket
npx wrangler r2 bucket create objctmgmt-documents
npx wrangler r2 bucket create objctmgmt-documents-dev

# 3. Create the KV namespace and paste the IDs into wrangler.toml
npx wrangler kv namespace create TENANT_SETTINGS
npx wrangler kv namespace create TENANT_SETTINGS --preview

# 4. Set Entra ID secrets (per environment)
npx wrangler secret put ENTRA_TENANT_ID
npx wrangler secret put ENTRA_AUDIENCE
```

## Develop locally

```pwsh
npm install
npm run dev   # http://localhost:8787
```

For local SPA testing, set `ALLOW_DEMO_MODE = "true"` in `wrangler.toml`
and have the SPA send `X-Demo-Mode: true` instead of an Entra ID token.

## Deploy

```pwsh
npm run deploy
```

## Endpoints

| Method | Path                | Auth   | Purpose                              |
| ------ | ------------------- | ------ | ------------------------------------ |
| POST   | `/ai/chat`          | yes    | Workers AI chat (Llama 3 by default) |
| POST   | `/ai/vision`        | yes    | Workers AI vision (Llava)            |
| PUT    | `/files/upload`     | yes    | Upload to R2 (raw body = file bytes) |
| GET    | `/files/download`   | yes    | Download from R2 by `key`            |
| GET    | `/files/list`       | yes    | List R2 objects under `prefix`       |
| DELETE | `/files/delete`     | yes    | Delete R2 object by `key`            |
| GET    | `/tenant/branding`  | public | Read tenant branding (login screen)  |
| PUT    | `/tenant/branding`  | ADMIN  | Update tenant branding               |
