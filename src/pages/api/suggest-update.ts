export const prerender = false;

import { sendSubmissionReceivedEmail } from "../../lib/adminEmail";
import { SuggestUpdateSchema } from "../../lib/schemas";
import { createSuggestedUpdate } from "../../lib/suggestedUpdates";

export async function POST({ request }) {
  let submittedPageUrl = "";

  try {
    const form = await request.formData();
    const parsedForm = SuggestUpdateSchema.safeParse({
      pageUrl: form.get("pageUrl"),
      submitterEmail: form.get("submitterEmail"),
      suggestion: form.get("suggestion"),
      otherInfo: form.get("otherInfo"),
    });
    submittedPageUrl = String(form.get("pageUrl") || "").trim();

    if (!parsedForm.success) {
      return redirectToForm(
        submittedPageUrl,
        parsedForm.error.issues[0]?.message || "Email and suggested update are required.",
        request.url,
      );
    }

    const { pageUrl, submitterEmail, suggestion, otherInfo } = parsedForm.data;

    await createSuggestedUpdate({
      pageUrl,
      submitterEmail,
      suggestion,
      otherInfo,
    });

    if (submitterEmail) {
      try {
        await sendSubmissionReceivedEmail({
          to: submitterEmail,
          type: "feedback",
          pageUrl,
        });
      } catch (error) {
        console.error(error?.message || "Unable to send feedback received email.");
      }
    }

    return Response.redirect(
      new URL(`/suggest-update?submitted=1&page=${encodeURIComponent(pageUrl)}`, request.url),
      303,
    );
  } catch (error) {
    const message = error?.message || "Unable to send suggestion.";
    return redirectToForm(submittedPageUrl, message, request.url);
  }
}

export function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      Allow: "POST, OPTIONS",
    },
  });
}

function redirectToForm(pageUrl = "", message = "", requestUrl = "http://localhost/suggest-update") {
  const params = new URLSearchParams();
  if (pageUrl) params.set("page", pageUrl);
  if (message) params.set("error", message);

  return Response.redirect(new URL(`/suggest-update?${params}`, requestUrl), 303);
}
