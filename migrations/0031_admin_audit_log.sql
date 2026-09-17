-- Server-side record of authenticated admin actions. Never store request bodies or tokens.

CREATE TABLE IF NOT EXISTS admin_audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  occurred_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actor_email TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  outcome TEXT NOT NULL CHECK (outcome IN ('success', 'error', 'denied')),
  http_status INTEGER NOT NULL,
  request_path TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_log_recent ON admin_audit_log(id DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_actor_recent ON admin_audit_log(actor_email, id DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_path_recent ON admin_audit_log(request_path, id DESC);

PRAGMA optimize;
