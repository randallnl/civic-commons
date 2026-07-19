import { env } from "cloudflare:workers";
import { cleanText } from "./text";
import { normalizeBillCodeForUrl } from "./billsApi";

export function billOverrideDb() {
  return env.d1_db;
}

export async function ensureBillOverrideTable(db = billOverrideDb()) {
  if (!db) throw new Error("D1 database binding is not configured.");

  await db.prepare(`
    CREATE TABLE IF NOT EXISTS d1_bill_overrides (
      sessionyear INTEGER NOT NULL,
      condensedbillno TEXT NOT NULL,
      title TEXT,
      summary TEXT,
      description TEXT,
      updated_by TEXT,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (sessionyear, condensedbillno)
    )
  `).run();
}

export async function saveBillOverride({
  sessionyear = 2026,
  bill = "",
  title = "",
  summary = "",
  description = "",
  updatedBy = "",
  db = billOverrideDb(),
} = {}) {
  if (!db) throw new Error("D1 database binding is not configured.");

  const year = Number(sessionyear) || 2026;
  const code = normalizeBillCodeForUrl(bill);
  if (!code) throw new Error("Bill code is required.");

  await ensureBillOverrideTable(db);

  await db.prepare(`
    INSERT INTO d1_bill_overrides (
      sessionyear,
      condensedbillno,
      title,
      summary,
      description,
      updated_by,
      updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(sessionyear, condensedbillno) DO UPDATE SET
      title = excluded.title,
      summary = excluded.summary,
      description = excluded.description,
      updated_by = excluded.updated_by,
      updated_at = CURRENT_TIMESTAMP
  `)
    .bind(
      year,
      code,
      cleanText(title),
      cleanText(summary),
      cleanText(description),
      cleanText(updatedBy),
    )
    .run();

  const sourceUpdate = await db.prepare(`
    UPDATE d1_bills
    SET description = CASE
      WHEN NULLIF(?, '') IS NULL THEN description
      ELSE ?
    END
    WHERE sessionyear = ?
      AND (
        UPPER(condensedbillno) = ?
        OR UPPER(expandedbillno) = ?
      )
  `)
    .bind(cleanText(description), cleanText(description), year, code, code)
    .run();

  return {
    sessionyear: year,
    bill: code,
    changed: sourceUpdate.meta?.changes || 0,
  };
}
