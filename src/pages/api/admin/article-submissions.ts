import { requireAdmin } from "../../../lib/adminAuth";
import { moderateArticleSubmission } from "../../../lib/articleSubmissions";

export const prerender = false;

export async function POST({ request }) {
  try {
    const session = await requireAdmin(request);
    const form = await request.formData();
    const id = Number(form.get("id"));
    const action = String(form.get("action") || "").trim();
    const redirectTo = String(form.get("redirectTo") || "/admin");

    if (!id) throw new Error("Article submission ID is required.");

    await moderateArticleSubmission(id, action, session.email);

    const message =
      action === "approve"
        ? "Article approved and added to the article database."
        : "Article submission rejected.";
    return Response.redirect(
      new URL(`${redirectTo}?message=${encodeURIComponent(message)}`, request.url),
      303,
    );
  } catch (error) {
    const redirectTo = new URL("/admin", request.url);
    redirectTo.searchParams.set("error", error?.message || "Unable to moderate article.");
    return Response.redirect(redirectTo, 303);
  }
}
