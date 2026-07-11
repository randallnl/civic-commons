export const prerender = false;

import { clearSessionCookie, destroyAdminSession } from "../../../lib/adminAuth";

export async function POST({ request }) {
  await destroyAdminSession(request);

  const response = Response.redirect(new URL("/admin?message=Signed%20out", request.url), 303);
  response.headers.append("Set-Cookie", clearSessionCookie());
  return response;
}
