import { env } from "cloudflare:workers";

const BOT_USER_AGENT = /bot\b|crawler|spider|slurp|facebookexternalhit|facebot|twitterbot|linkedinbot|discordbot|whatsapp|telegrambot|preview/i;

export function profileAnalyticsDb() {
  return env.d1_db;
}

export function isLikelyCrawler(userAgent = "") {
  return BOT_USER_AGENT.test(String(userAgent || ""));
}

export async function recordProfileView({ slug, visitorId, db = profileAnalyticsDb() }) {
  if (!db) throw new Error("D1 database binding is not configured.");

  const profile = await db
    .prepare("SELECT id FROM d1_people WHERE slug = ? LIMIT 1")
    .bind(slug)
    .first();
  if (!profile?.id) return { recorded: false, reason: "profile-not-found" };

  const personId = Number(profile.id);
  const viewDate = new Date().toISOString().slice(0, 10);
  const visitorHash = await sha256Hex(`${personId}:${viewDate}:${visitorId}`);
  const visitorResult = await db
    .prepare(
      `INSERT OR IGNORE INTO d1_profile_view_visitors (
         person_id, view_date, visitor_hash, created_at
       ) VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
    )
    .bind(personId, viewDate, visitorHash)
    .run();
  const isUniqueVisitor = Number(visitorResult.meta?.changes ?? visitorResult.changes ?? 0) > 0;

  await db
    .prepare(
      `INSERT INTO d1_profile_view_daily (
         person_id,
         view_date,
         views,
         unique_visitors,
         first_viewed_at,
         last_viewed_at
       ) VALUES (?, ?, 1, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       ON CONFLICT(person_id, view_date) DO UPDATE SET
         views = views + 1,
         unique_visitors = unique_visitors + excluded.unique_visitors,
         last_viewed_at = CURRENT_TIMESTAMP`,
    )
    .bind(personId, viewDate, isUniqueVisitor ? 1 : 0)
    .run();

  return { recorded: true, isUniqueVisitor };
}

export async function getProfileTraffic({ limit = 20, db = profileAnalyticsDb() } = {}) {
  if (!db) return emptyProfileTraffic();

  const safeLimit = Math.max(1, Math.min(Number(limit) || 20, 100));
  const [summary, profiles] = await Promise.all([
    db
      .prepare(
        `SELECT
           COALESCE(SUM(CASE WHEN view_date = date('now') THEN views ELSE 0 END), 0) AS views_today,
           COALESCE(SUM(CASE WHEN view_date >= date('now', '-6 days') THEN views ELSE 0 END), 0) AS views_7d,
           COALESCE(SUM(CASE WHEN view_date >= date('now', '-29 days') THEN views ELSE 0 END), 0) AS views_30d,
           COALESCE(SUM(CASE WHEN view_date >= date('now', '-29 days') THEN unique_visitors ELSE 0 END), 0) AS unique_30d
         FROM d1_profile_view_daily
         WHERE view_date >= date('now', '-29 days')`,
      )
      .first(),
    db
      .prepare(
        `SELECT
           p.id AS person_id,
           p.display_name,
           p.slug,
           COALESCE(SUM(CASE WHEN d.view_date >= date('now', '-6 days') THEN d.views ELSE 0 END), 0) AS views_7d,
           COALESCE(SUM(d.views), 0) AS views_30d,
           COALESCE(SUM(d.unique_visitors), 0) AS unique_30d,
           MAX(d.last_viewed_at) AS last_viewed_at
         FROM d1_profile_view_daily d
         JOIN d1_people p ON p.id = d.person_id
         WHERE d.view_date >= date('now', '-29 days')
         GROUP BY p.id, p.display_name, p.slug
         ORDER BY views_30d DESC, unique_30d DESC, p.display_name
         LIMIT ?`,
      )
      .bind(safeLimit)
      .all(),
  ]);

  return {
    summary: {
      viewsToday: Number(summary?.views_today || 0),
      views7d: Number(summary?.views_7d || 0),
      views30d: Number(summary?.views_30d || 0),
      unique30d: Number(summary?.unique_30d || 0),
    },
    profiles: (profiles.results || []).map((row) => ({
      personId: Number(row.person_id || 0),
      name: String(row.display_name || "Profile"),
      slug: String(row.slug || ""),
      views7d: Number(row.views_7d || 0),
      views30d: Number(row.views_30d || 0),
      unique30d: Number(row.unique_30d || 0),
      lastViewedAt: String(row.last_viewed_at || ""),
    })),
  };
}

export function emptyProfileTraffic() {
  return {
    summary: { viewsToday: 0, views7d: 0, views30d: 0, unique30d: 0 },
    profiles: [],
  };
}

async function sha256Hex(value) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(String(value || "")),
  );
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}
