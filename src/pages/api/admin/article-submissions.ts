import { requireAdmin } from "../../../lib/adminAuth";
import { moderateArticleSubmission } from "../../../lib/articleSubmissions";

export const prerender = false;

export async function POST({ request }) {
  const wantsHtml = request.headers.get("HX-Request") === "true";

  try {
    const auth = await requireAdmin(request);
    if (!auth.ok) return auth.response;

    const form = await request.formData();
    const id = Number(form.get("id"));
    const action = String(form.get("action") || "").trim();
    const redirectTo = String(form.get("redirectTo") || "/admin");
    const manualLinks = {
      bills: String(form.get("bills") || ""),
      people: String(form.get("people") || ""),
      legislators: String(form.get("legislators") || ""),
      candidates: String(form.get("candidates") || ""),
    };

    if (!id) throw new Error("Article submission ID is required.");

    await moderateArticleSubmission(id, action, auth.session.email, manualLinks);

    const message =
      action === "approve"
        ? "Article approved and added to the article database."
        : "Article submission rejected.";

    if (wantsHtml) return htmlMessage(message, "success");

    return Response.redirect(
      new URL(`${redirectTo}?message=${encodeURIComponent(message)}`, request.url),
      303,
    );
  } catch (error) {
    if (wantsHtml) {
      return htmlMessage(error?.message || "Unable to moderate article.", "error", 400);
    }

    const redirectTo = new URL("/admin", request.url);
    redirectTo.searchParams.set("error", error?.message || "Unable to moderate article.");
    return Response.redirect(redirectTo, 303);
  }
}

function htmlMessage(message, status = "success", responseStatus = 200) {
  return new Response(
    `<span class="inline-status ${status}">${escapeHtml(message)}</span>`,
    {
      status: responseStatus,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      },
    },
  );
}

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
