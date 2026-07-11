export const prerender = false;

import { consumeMagicLink, sessionCookie } from "../../../lib/adminAuth";

export async function GET({ request }) {
  try {
    const url = new URL(request.url);
    const token = url.searchParams.get("token") || "";
    const session = await consumeMagicLink(token);
    return redirectWithCookie(
      new URL("/admin?message=Signed%20in", request.url),
      sessionCookie(session.sessionToken),
    );
  } catch (error) {
    const url = new URL("/admin", request.url);
    url.searchParams.set("error", error?.message || "Unable to verify login link.");
    return Response.redirect(url, 303);
  }
}

function redirectWithCookie(url, cookie) {
  return new Response(null, {
    status: 303,
    headers: {
      Location: url.toString(),
      "Set-Cookie": cookie,
    },
  });
}
