import { requireAdmin } from "../../../lib/adminAuth";
import { addManualArticleLinks } from "../../../lib/articleSubmissions";

export const prerender = false;

export async function POST({ request }) {
  let redirectTo = "/articles";

  try {
    const auth = await requireAdmin(request);
    if (!auth.ok) return auth.response;

    const form = await request.formData();
    const articleId = String(form.get("articleId") || "").trim();
    redirectTo = safeRedirectPath(form.get("redirectTo")) || `/articles/${encodeURIComponent(articleId)}`;

    await addManualArticleLinks(articleId, {
      bills: String(form.get("bills") || ""),
      legislators: String(form.get("legislators") || ""),
      candidates: joinedFormValues(form, ["candidates", "candidateLinks"]),
    });

    return redirectWithMessage(request, redirectTo, "Article links updated.");
  } catch (error) {
    return redirectWithError(request, redirectTo, error?.message || "Unable to update article links.");
  }
}

function joinedFormValues(form, names) {
  return names
    .flatMap((name) => form.getAll(name))
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .join(", ");
}

function safeRedirectPath(value) {
  const path = String(value || "").trim();
  if (!path.startsWith("/") || path.startsWith("//")) return "";
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
