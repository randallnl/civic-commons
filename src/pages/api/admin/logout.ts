export const prerender = false;

import { clearSessionCookie, destroyAdminSession } from "../../../lib/adminAuth";

export async function POST({ request }) {
  await destroyAdminSession(request);

  return new Response(null, {
    status: 303,
    headers: {
      Location: new URL("/admin?message=Signed%20out", request.url).toString(),
      "Set-Cookie": clearSessionCookie(),
    },
  });
}
