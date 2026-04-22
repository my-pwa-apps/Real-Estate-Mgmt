-- objctmgmt-api D1 schema
-- One row per entity. JSON blob for flexible/schemaless data (matches the
-- previous Firebase Realtime Database model). Tenant isolation via tenant_id
-- which is taken from the validated Entra ID `tid` claim.

CREATE TABLE IF NOT EXISTS entities (
  tenant_id  TEXT    NOT NULL,
  collection TEXT    NOT NULL,
  id         TEXT    NOT NULL,
  data       TEXT    NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (tenant_id, collection, id)
);

CREATE INDEX IF NOT EXISTS idx_entities_tenant_collection
  ON entities(tenant_id, collection, updated_at DESC);
