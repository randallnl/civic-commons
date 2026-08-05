export const prerender = false;

import { submitVolunteerReviewerApplication } from "../../lib/volunteerReviewers";

export async function POST({ request }) {
  try {
    const form = await request.formData();
    await submitVolunteerReviewerApplication({
      name: form.get("name"),
      email: form.get("email"),
      interests: form.get("interests"),
      experience: form.get("experience"),
      availability: form.get("availability"),
      notes: form.get("notes"),
    });

    return Response.redirect(new URL("/volunteer-reviewers?sent=1", request.url), 303);
  } catch (error) {
    const url = new URL("/volunteer-reviewers", request.url);
    url.searchParams.set("error", error?.message || "Unable to submit reviewer application.");
    return Response.redirect(url, 303);
  }
}
