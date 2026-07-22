import { env } from "cloudflare:workers";
import { sql } from "drizzle-orm";
import { getDrizzleDb, schema } from "../db/client";
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

  const drizzleDb = getDrizzleDb(db);
  const cleanDescription = cleanText(description);

  await drizzleDb
    .insert(schema.billOverrides)
    .values({
      sessionYear: year,
      condensedBillNo: code,
      title: cleanText(title),
      summary: cleanText(summary),
      description: cleanDescription,
      updatedBy: cleanText(updatedBy),
      updatedAt: sql`CURRENT_TIMESTAMP`,
    })
    .onConflictDoUpdate({
      target: [
        schema.billOverrides.sessionYear,
        schema.billOverrides.condensedBillNo,
      ],
      set: {
        title: cleanText(title),
        summary: cleanText(summary),
        description: cleanDescription,
        updatedBy: cleanText(updatedBy),
        updatedAt: sql`CURRENT_TIMESTAMP`,
      },
    })
    .run();

  const sourceUpdate = cleanDescription
    ? await drizzleDb
        .update(schema.bills)
        .set({ description: cleanDescription })
        .where(sql`
          ${schema.bills.sessionYear} = ${year}
          AND (
            UPPER(${schema.bills.condensedBillNo}) = ${code}
            OR UPPER(${schema.bills.expandedBillNo}) = ${code}
          )
        `)
        .run()
    : { meta: { changes: 0 } };

  return {
    sessionyear: year,
    bill: code,
    changed: sourceUpdate.meta?.changes || 0,
  };
}
