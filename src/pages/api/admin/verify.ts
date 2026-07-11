export const prerender = false;

import { consumeMagicLink, sessionCookie } from "../../../lib/adminAuth";

export async function GET({ request }) {
  try {
    const url = new URL(request.url);
    const token = url.searchParams.get("token") || "";
    const session = await consumeMagicLink(token);
    const response = Response.redirect(new URL("/admin?message=Signed%20in", request.url), 303);

    response.headers.append("Set-Cookie", sessionCookie(session.sessionToken));
    return response;
  } catch (error) {
    const url = new URL("/admin", request.url);
    url.searchParams.set("error", error?.message || "Unable to verify login link.");
    return Response.redirect(url, 303);
  }
}
