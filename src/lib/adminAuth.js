import { env } from "cloudflare:workers";
import {
  getVolunteerReviewerByEmail,
  normalizeEmail as normalizeReviewerEmail,
} from "./volunteerReviewers";

export const ADMIN_COOKIE = "nhdb_admin_session";
const TOKEN_TTL_SECONDS = 15 * 60;
const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;

export function adminDb() {
  return env.d1_db;
}

export function adminR2Bucket() {
  return env.r2_bucket || env["organization-assets"];
}

export async function requireAdmin(request) {
  const session = await currentAdminSession(request);
  if (!session) {
    return {
      ok: false,
      response: Response.redirect(new URL("/admin", request.url), 303),
    };
  }

  return { ok: true, session };
}

export async function currentAdminSession(request) {
  const db = adminDb();
  const token = cookieValue(request, ADMIN_COOKIE);
  if (!db || !token) return null;

  await ensureAdminTables(db);

  const tokenHash = await sha256Hex(token);
  const session = await db
    .prepare(
      `SELECT id, email, expires_at
       FROM admin_sessions
       WHERE token_hash = ? AND expires_at > datetime('now')
       LIMIT 1`,
    )
    .bind(tokenHash)
    .first();

  return session ? withAdminRole(session) : null;
}

export async function createMagicLink(email, request) {
  const db = adminDb();
  if (!db) throw new Error("Admin database binding is not configured.");

  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) throw new Error("Email is required.");

  const allowedEmails = await allowedAdminEmails();
  const reviewer = await getVolunteerReviewerByEmail(normalizedEmail, db);
  const allowedByReviewer = reviewer?.status === "approved";
  const blockedByReviewer = ["disabled", "rejected"].includes(reviewer?.status);
  if (blockedByReviewer || (!allowedEmails.includes(normalizedEmail) && !allowedByReviewer)) {
    throw new Error("That email is not authorized for admin access.");
  }

  await ensureAdminTables(db);

  const token = randomToken();
  const tokenHash = await sha256Hex(token);
  const expiresAt = isoDateAfter(TOKEN_TTL_SECONDS);

  await db
    .prepare(
      `INSERT INTO admin_magic_links (email, token_hash, expires_at, created_at)
       VALUES (?, ?, ?, datetime('now'))`,
    )
    .bind(normalizedEmail, tokenHash, expiresAt)
    .run();

  const link = new URL("/api/admin/verify", request.url);
  link.searchParams.set("token", token);

  return {
    email: normalizedEmail,
    link: link.toString(),
    expiresAt,
  };
}

export async function consumeMagicLink(token) {
  const db = adminDb();
  if (!db) throw new Error("Admin database binding is not configured.");
  if (!token) throw new Error("Magic link token is required.");

  await ensureAdminTables(db);

  const tokenHash = await sha256Hex(token);
  const magicLink = await db
    .prepare(
      `SELECT id, email
       FROM admin_magic_links
       WHERE token_hash = ?
         AND used_at IS NULL
         AND expires_at > datetime('now')
       LIMIT 1`,
    )
    .bind(tokenHash)
    .first();

  if (!magicLink) throw new Error("Magic link is invalid or expired.");

  await db
    .prepare("UPDATE admin_magic_links SET used_at = datetime('now') WHERE id = ?")
    .bind(magicLink.id)
    .run();

  const sessionToken = randomToken();
  const sessionHash = await sha256Hex(sessionToken);
  const expiresAt = isoDateAfter(SESSION_TTL_SECONDS);

  await db
    .prepare(
      `INSERT INTO admin_sessions (email, token_hash, expires_at, created_at)
       VALUES (?, ?, ?, datetime('now'))`,
    )
    .bind(magicLink.email, sessionHash, expiresAt)
    .run();

  return { sessionToken, email: magicLink.email, expiresAt };
}

export async function destroyAdminSession(request) {
  const db = adminDb();
  const token = cookieValue(request, ADMIN_COOKIE);
  if (!db || !token) return;

  const tokenHash = await sha256Hex(token);
  await db
    .prepare("DELETE FROM admin_sessions WHERE token_hash = ?")
    .bind(tokenHash)
    .run();
}

export function sessionCookie(sessionToken) {
  return `${ADMIN_COOKIE}=${sessionToken}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_TTL_SECONDS}`;
}

export function clearSessionCookie() {
  return `${ADMIN_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

export async function ensureAdminTables(db = adminDb()) {
  if (!db) throw new Error("Admin database binding is not configured.");

  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS admin_magic_links (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL,
        token_hash TEXT NOT NULL UNIQUE,
        expires_at TEXT NOT NULL,
        used_at TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`,
    )
    .run();

  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS admin_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL,
        token_hash TEXT NOT NULL UNIQUE,
        expires_at TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`,
    )
    .run();

  await db.prepare("CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(token_hash)").run();
  await db.prepare("CREATE INDEX IF NOT EXISTS idx_admin_magic_links_token ON admin_magic_links(token_hash)").run();
}

export async function allowedAdminEmails() {
  const configured =
    (await bindingValue(env.ADMIN_EMAILS)) ||
    (await bindingValue(env.ADMIN_EMAIL)) ||
    import.meta.env.ADMIN_EMAILS ||
    import.meta.env.ADMIN_EMAIL ||
    "";

  const roleEmails = await roleConfiguredEmails();

  return [
    ...String(configured)
    .split(/,|;/)
    .map(normalizeEmail)
      .filter(Boolean),
    ...roleEmails,
  ].filter((email, index, emails) => email && emails.indexOf(email) === index);
}

export async function adminRoleForEmail(email = "") {
  const normalized = normalizeEmail(email);
  if (!normalized) return "";
  const reviewer = await getVolunteerReviewerByEmail(normalized);
  if (reviewer?.status === "approved" && reviewer.role) return reviewer.role;

  const roleMap = [
    ["super_admin", env.SUPER_ADMIN_EMAILS],
    ["profile_reviewer", env.PROFILE_REVIEWER_EMAILS],
    ["content_moderator", env.CONTENT_MODERATOR_EMAILS],
    ["org_editor", env.ORG_EDITOR_EMAILS],
    ["volunteer", env.VOLUNTEER_EMAILS],
  ];

  for (const [role, binding] of roleMap) {
    const emails = await emailsFromBinding(binding);
    if (emails.includes(normalized)) return role;
  }

  const admins = await emailsFromBinding(env.ADMIN_EMAILS || env.ADMIN_EMAIL);
  return admins.includes(normalized) ? "super_admin" : "";
}

export function canUseSourceDataTools(session = {}) {
  return ["super_admin"].includes(session?.role);
}

export function canManageReviewers(session = {}) {
  return ["super_admin"].includes(session?.role);
}

export function canEditOrganizations(session = {}) {
  return ["super_admin", "org_editor", "volunteer"].includes(session?.role);
}

export function canEditProfiles(session = {}) {
  return ["super_admin", "profile_reviewer", "volunteer"].includes(session?.role);
}

export function canUploadAssets(session = {}) {
  return ["super_admin", "profile_reviewer", "org_editor", "volunteer"].includes(session?.role);
}

export function canModerateContent(session = {}) {
  return ["super_admin", "content_moderator", "volunteer"].includes(session?.role);
}

export function canReviewProfiles(session = {}) {
  return ["super_admin", "profile_reviewer", "volunteer"].includes(session?.role);
}

export function forbiddenAdminResponse(message = "Your admin role cannot use this tool.") {
  return new Response(message, {
    status: 403,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

async function withAdminRole(session = {}) {
  const role = (await adminRoleForEmail(session.email)) || "volunteer";
  return {
    ...session,
    role,
    canUseSourceDataTools: canUseSourceDataTools({ role }),
    canManageReviewers: canManageReviewers({ role }),
    canEditOrganizations: canEditOrganizations({ role }),
    canEditProfiles: canEditProfiles({ role }),
    canUploadAssets: canUploadAssets({ role }),
    canModerateContent: canModerateContent({ role }),
    canReviewProfiles: canReviewProfiles({ role }),
  };
}

async function roleConfiguredEmails() {
  const groups = await Promise.all([
    emailsFromBinding(env.SUPER_ADMIN_EMAILS),
    emailsFromBinding(env.PROFILE_REVIEWER_EMAILS),
    emailsFromBinding(env.CONTENT_MODERATOR_EMAILS),
    emailsFromBinding(env.ORG_EDITOR_EMAILS),
    emailsFromBinding(env.VOLUNTEER_EMAILS),
  ]);
  return groups.flat();
}

async function emailsFromBinding(binding) {
  return String(await bindingValue(binding))
    .split(/,|;/)
    .map(normalizeEmail)
    .filter(Boolean);
}

export async function bindingValue(binding) {
  if (!binding) return "";
  if (binding?.get) return binding.get();
  if (typeof binding === "string") return binding;
  return "";
}

export function normalizeEmail(value = "") {
  return normalizeReviewerEmail(value);
}

export function cookieValue(request, name) {
  const cookie = request.headers.get("cookie") || "";
  const match = cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : "";
}

export async function sha256Hex(value = "") {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function randomToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function isoDateAfter(seconds) {
  return new Date(Date.now() + seconds * 1000)
    .toISOString()
    .slice(0, 19)
    .replace("T", " ");
}
