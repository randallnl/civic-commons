import { env } from "cloudflare:workers";
import { bindingValue } from "./adminAuth";

const DEFAULT_FROM = "admin@nhdeservesbetter.com";

export async function sendMagicLinkEmail({ to, link, expiresAt }) {
  const sender = env.email_send;
  if (!sender) throw new Error("Email sending binding is not configured.");

  const from =
    (await bindingValue(env.ADMIN_EMAIL_FROM)) ||
    import.meta.env.ADMIN_EMAIL_FROM ||
    DEFAULT_FROM;
  const subject = "Your NH Deserves Better admin login link";
  const text = [
    "Use this link to sign in to the NH Deserves Better admin area:",
    "",
    link,
    "",
    `This link expires at ${expiresAt}.`,
    "",
    "If you did not request this, you can ignore this email.",
  ].join("\n");
  const html = `
    <p>Use this link to sign in to the NH Deserves Better admin area:</p>
    <p><a href="${escapeHtml(link)}">Sign in to admin</a></p>
    <p>This link expires at ${escapeHtml(expiresAt)}.</p>
    <p>If you did not request this, you can ignore this email.</p>
  `;

  await sender.send({
    to,
    from: { email: from, name: "NH Deserves Better" },
    subject,
    html,
    text,
  });
}

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
