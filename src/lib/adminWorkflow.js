import { adminDb } from "./adminAuth";
import { cleanText } from "./text";

export const WORKFLOW_STATUSES = [
  "unassigned",
  "claimed",
  "needs_followup",
  "ready",
];

const TABLES = {
  "community-update": "community_updates",
  "suggested-update": "suggested_updates",
  "article-submission": "article_submissions",
  endorsement: "organization_endorsements",
};

export async function ensureWorkflowColumns(db = adminDb(), table = "") {
  if (!db || !table) return;
  if (!(await tableExists(db, table))) return;
  await addColumnIfMissing(db, table, "workflow_status", "TEXT NOT NULL DEFAULT 'unassigned'");
  await addColumnIfMissing(db, table, "assigned_to", "TEXT");
  await addColumnIfMissing(db, table, "moderator_note", "TEXT");
  await addColumnIfMissing(db, table, "workflow_updated_at", "TEXT");
  await db
    .prepare(`CREATE INDEX IF NOT EXISTS idx_${table}_workflow ON ${table}(status, workflow_status, assigned_to)`)
    .run();
}

export async function updateWorkflowItem({
  entityType,
  id,
  action,
  note = "",
  reviewer = "",
  db = adminDb(),
} = {}) {
  if (!db) throw new Error("D1 database binding is not configured.");
  const table = TABLES[entityType];
  if (!table) throw new Error("Choose a valid moderation queue item.");
  const numericId = Number(id);
  if (!numericId) throw new Error("Moderation item id is required.");

  await ensureWorkflowColumns(db, table);

  const updates = workflowUpdateForAction(action, reviewer);
  if (!updates) throw new Error("Choose claim, release, ready, or needs follow-up.");

  const result = await db
    .prepare(
      `UPDATE ${table}
       SET workflow_status = ?,
           assigned_to = ?,
           moderator_note = COALESCE(NULLIF(?, ''), moderator_note),
           workflow_updated_at = CURRENT_TIMESTAMP
       WHERE id = ?
         AND status = 'pending'`,
    )
    .bind(updates.status, updates.assignedTo, cleanText(note), numericId)
    .run();

  const changed = result.meta?.changes ?? result.changes ?? 0;
  if (!changed) throw new Error("No pending moderation item was updated.");

  return { status: updates.status, assignedTo: updates.assignedTo, changed };
}

export async function workflowSummary(db = adminDb()) {
  if (!db) return emptySummary();

  const rows = await Promise.all(
    Object.entries(TABLES).map(async ([entityType, table]) => {
      await ensureWorkflowColumns(db, table);
      if (!(await tableExists(db, table))) return [];
      const result = await db
        .prepare(
          `SELECT
             ? AS entity_type,
             COALESCE(NULLIF(workflow_status, ''), 'unassigned') AS workflow_status,
             COUNT(*) AS count
           FROM ${table}
           WHERE status = 'pending'
           GROUP BY COALESCE(NULLIF(workflow_status, ''), 'unassigned')`,
        )
        .bind(entityType)
        .all();
      return result.results || [];
    }),
  );

  const summary = emptySummary();
  for (const row of rows.flat()) {
    const status = normalizeWorkflowStatus(row.workflow_status);
    summary.byStatus[status] = (summary.byStatus[status] || 0) + Number(row.count || 0);
    summary.byQueue[row.entity_type] = (summary.byQueue[row.entity_type] || 0) + Number(row.count || 0);
    summary.total += Number(row.count || 0);
  }

  return summary;
}

export function normalizeWorkflowStatus(value = "") {
  const status = String(value || "").trim().toLowerCase();
  return WORKFLOW_STATUSES.includes(status) ? status : "unassigned";
}

export function workflowLabel(value = "") {
  const status = normalizeWorkflowStatus(value);
  if (status === "needs_followup") return "Needs follow-up";
  return status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function normalizeWorkflowFields(row = {}) {
  return {
    workflowStatus: normalizeWorkflowStatus(row.workflow_status || row.workflowStatus),
    assignedTo: cleanText(row.assigned_to || row.assignedTo || ""),
    moderatorNote: cleanText(row.moderator_note || row.moderatorNote || ""),
    workflowUpdatedAt: row.workflow_updated_at || row.workflowUpdatedAt || "",
  };
}

function workflowUpdateForAction(action = "", reviewer = "") {
  const normalized = String(action || "").trim().toLowerCase();
  const email = cleanText(reviewer);
  if (normalized === "claim") return { status: "claimed", assignedTo: email };
  if (normalized === "release") return { status: "unassigned", assignedTo: "" };
  if (normalized === "ready") return { status: "ready", assignedTo: email };
  if (normalized === "needs-followup" || normalized === "needs_followup") {
    return { status: "needs_followup", assignedTo: email };
  }
  return null;
}

function emptySummary() {
  return {
    total: 0,
    byStatus: {
      unassigned: 0,
      claimed: 0,
      needs_followup: 0,
      ready: 0,
    },
    byQueue: {
      "community-update": 0,
      "suggested-update": 0,
      "article-submission": 0,
      endorsement: 0,
    },
  };
}

async function addColumnIfMissing(db, table, column, definition) {
  const result = await db.prepare(`PRAGMA table_info(${table})`).all();
  const exists = (result.results || []).some((row) => row.name === column);
  if (exists) return;
  await db.prepare(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`).run();
}

async function tableExists(db, table) {
  const row = await db
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ? LIMIT 1")
    .bind(table)
    .first();
  return Boolean(row?.name);
}
