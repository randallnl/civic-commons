export function submissionDetailsText(details = []) {
  return normalizeSubmissionDetails(details)
    .map(({ label, value }) => `${label}: ${value}`)
    .join("\n\n");
}

export function submissionDetailsHtml(details = []) {
  const normalized = normalizeSubmissionDetails(details);
  if (!normalized.length) return "";

  return `<dl style="margin: 0 0 16px;">${normalized
    .map(({ label, value, href }) => {
      const renderedValue = href
        ? `<a href="${escapeHtml(href)}">${escapeHtml(value)}</a>`
        : escapeHtml(value).replace(/\n/g, "<br />");
      return `<div style="margin: 0 0 12px;"><dt style="font-weight: 700;">${escapeHtml(label)}</dt><dd style="margin: 3px 0 0;">${renderedValue}</dd></div>`;
    })
    .join("")}</dl>`;
}

export function normalizeSubmissionDetails(details = []) {
  if (!Array.isArray(details)) return [];

  return details
    .map((detail) => ({
      label: cleanValue(detail?.label),
      value: cleanValue(detail?.value),
      href: safePublicUrl(detail?.href),
    }))
    .filter(({ label, value }) => label && value);
}

function cleanValue(value = "") {
  return String(value || "").trim();
}

function safePublicUrl(value = "") {
  const raw = cleanValue(value);
  if (!raw) return "";

  try {
    const url = new URL(raw);
    return ["http:", "https:"].includes(url.protocol) ? url.toString() : "";
  } catch {
    return "";
  }
}

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
