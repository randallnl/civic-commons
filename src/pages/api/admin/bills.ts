export const prerender = false;

import { adminDb, requireAdmin } from "../../../lib/adminAuth";
import { saveBillOverride } from "../../../lib/billOverrides";

export async function POST({ request }) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  let redirectTo = "/admin#bill-admin";

  try {
    const form = await request.formData();
    redirectTo = safeRedirectPath(form.get("redirectTo")) || redirectTo;

    const result = await saveBillOverride({
      sessionyear: form.get("sessionyear"),
      bill: form.get("bill"),
      title: form.get("title"),
      summary: form.get("summary"),
      description: form.get("description"),
      updatedBy: auth.session?.email || "",
      db: adminDb(),
    });

    return redirectWithMessage(
      request,
      redirectTo,
      `${result.bill} updated for ${result.sessionyear}.`,
    );
  } catch (error) {
    return redirectWithError(request, redirectTo, error?.message || "Unable to update bill.");
  }
}

function safeRedirectPath(value) {
  const path = String(value || "").trim();
  if (!path || !path.startsWith("/") || path.startsWith("//")) return "";
  return path;
}

function redirectWithMessage(request, path, message) {
  const url = new URL(path, request.url);
  url.searchParams.set("message", message);
  return Response.redirect(url, 303);
}

function redirectWithError(request, path, message) {
  const url = new URL(path, request.url);
  url.searchParams.set("error", message);
  return Response.redirect(url, 303);
}
