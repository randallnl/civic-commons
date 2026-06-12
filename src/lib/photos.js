export function profilePhotoUrl(value = "") {
  const raw = String(value || "").trim();
  if (!raw) return "";

  try {
    const url = new URL(raw);
    const path = url.pathname.replace(/^\/+|\/+$/g, "");
    return path ? raw : "";
  } catch {
    return raw.replace(/^\/+|\/+$/g, "") ? raw : "";
  }
}
