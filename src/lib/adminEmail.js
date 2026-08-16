import { env } from "cloudflare:workers";
import { bindingValue } from "./adminAuth";

const DEFAULT_FROM = "admin@nhdeservesbetter.com";
const MODERATION_CC = "randall@nhdeservesbetter.com";

export async function sendMagicLinkEmail({ to, link, expiresAt }) {
  const sender = emailSender();
  const from = await senderAddress();
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

export async function sendSubmissionReceivedEmail({
  to,
  type = "update",
  pageUrl = "",
} = {}) {
  if (!to) return false;

  const sender = emailSender();
  const from = await senderAddress();
  const label = type === "feedback" ? "feedback" : "community update";
  const subject = `We received your ${label}`;
  const text = [
    `Thanks for sending a ${label} to NH Deserves Better.`,
    "",
    "It has been added to the review queue. A reviewer will check it before any public changes are made.",
    pageUrl ? `Page: ${pageUrl}` : "",
    "",
    "If we have a question or an update about the review, we may follow up by email.",
  ].filter(Boolean).join("\n");
  const html = `
    <p>Thanks for sending a ${escapeHtml(label)} to NH Deserves Better.</p>
    <p>It has been added to the review queue. A reviewer will check it before any public changes are made.</p>
    ${pageUrl ? `<p><strong>Page:</strong> <a href="${escapeHtml(pageUrl)}">${escapeHtml(pageUrl)}</a></p>` : ""}
    <p>If we have a question or an update about the review, we may follow up by email.</p>
  `;

  await sender.send({
    to,
    cc: moderationCcFor(to),
    from: { email: from, name: "NH Deserves Better" },
    subject,
    html,
    text,
  });

  return true;
}

export async function sendSubmissionResponseEmail({
  to,
  type = "update",
  outcome = "",
  note = "",
  pageUrl = "",
} = {}) {
  if (!to || !note) return false;

  const sender = emailSender();
  const from = await senderAddress();
  const label = type === "feedback" ? "feedback" : "community update";
  const outcomeLabel = outcome === "applied"
    ? "Change applied"
    : outcome === "not_applied"
      ? "Change not applied"
      : "Review update";
  const subject = `Update on your NH Deserves Better ${label}`;
  const text = [
    `A reviewer left an update about your ${label}.`,
    "",
    `Status: ${outcomeLabel}`,
    "",
    note,
    "",
    pageUrl ? `Page: ${pageUrl}` : "",
    "",
    "Thank you for helping keep NH Deserves Better accurate and useful.",
  ].filter(Boolean).join("\n");
  const html = `
    <p>A reviewer left an update about your ${escapeHtml(label)}.</p>
    <p><strong>Status:</strong> ${escapeHtml(outcomeLabel)}</p>
    <p>${escapeHtml(note).replace(/\n/g, "<br />")}</p>
    ${pageUrl ? `<p><strong>Page:</strong> <a href="${escapeHtml(pageUrl)}">${escapeHtml(pageUrl)}</a></p>` : ""}
    <p>Thank you for helping keep NH Deserves Better accurate and useful.</p>
  `;

  await sender.send({
    to,
    cc: moderationCcFor(to),
    from: { email: from, name: "NH Deserves Better" },
    subject,
    html,
    text,
  });

  return true;
}

function emailSender() {
  const sender = env.email_send;
  if (!sender) throw new Error("Email sending binding is not configured.");
  return sender;
}

async function senderAddress() {
  return (
    (await bindingValue(env.ADMIN_EMAIL_FROM)) ||
    import.meta.env.ADMIN_EMAIL_FROM ||
    DEFAULT_FROM
  );
}

function moderationCcFor(to = "") {
  const recipients = Array.isArray(to) ? to : [to];
  const hasRandall = recipients.some(
    (recipient) => String(recipient || "").trim().toLowerCase() === MODERATION_CC,
  );
  return hasRandall ? [] : [MODERATION_CC];
}

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
