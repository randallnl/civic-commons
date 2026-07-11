export const prerender = false;

import { createMagicLink } from "../../../lib/adminAuth";
import { sendMagicLinkEmail } from "../../../lib/adminEmail";

export async function POST({ request }) {
  try {
    const form = await request.formData();
    const email = String(form.get("email") || "").trim();
    const magicLink = await createMagicLink(email, request);

    await sendMagicLinkEmail({
      to: magicLink.email,
      link: magicLink.link,
      expiresAt: magicLink.expiresAt,
    });

    return Response.redirect(new URL("/admin?sent=1", request.url), 303);
  } catch (error) {
    return redirectWithError(request, error?.message || "Unable to send login link.");
  }
}

function redirectWithError(request, message) {
  const url = new URL("/admin", request.url);
  url.searchParams.set("error", message);
  return Response.redirect(url, 303);
}
