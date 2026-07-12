import { createArticleSubmission } from "../../../lib/articleSubmissions";

export const prerender = false;

export async function POST({ request }) {
  try {
    const form = await request.formData();
    const url = String(form.get("url") || "").trim();
    const title = String(form.get("title") || "").trim();
    const summary = String(form.get("summary") || "").trim();
    const publisher = String(form.get("publisher") || "").trim();
    const submitterName = String(form.get("submitterName") || "").trim();
    const submitterEmail = String(form.get("submitterEmail") || "").trim();
    const note = String(form.get("note") || "").trim();

    await createArticleSubmission({
      url,
      title,
      summary,
      publisher,
      submitterName,
      submitterEmail,
      note,
    });

    return Response.redirect(new URL("/articles?submitted=1", request.url), 303);
  } catch (error) {
    const params = new URLSearchParams({
      error: error?.message || "Unable to submit article.",
    });
    return Response.redirect(new URL(`/articles?${params}`, request.url), 303);
  }
}
