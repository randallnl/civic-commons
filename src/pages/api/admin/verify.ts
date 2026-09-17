export const prerender = false;

import { adminDb, adminRoleForEmail, consumeMagicLink, sessionCookie } from "../../../lib/adminAuth";
import { ensureAdminAuditLog, recordAdminAudit } from "../../../lib/adminAudit";

export async function GET({ request }) {
  try {
    const url = new URL(request.url);
    const token = url.searchParams.get("token") || "";
    const session = await consumeMagicLink(token);
    try {
      const db = adminDb();
      await ensureAdminAuditLog(db);
      await recordAdminAudit(db, {
        session: { email: session.email, role: await adminRoleForEmail(session.email) },
        request,
        metadata: { action: "admin.sign-in", targetType: "", targetId: "" },
        outcome: "success",
        httpStatus: 303,
      });
    } catch (auditError) {
      // A successful sign-in should not be invalidated after its session is created.
      console.error("Unable to record admin sign-in audit event:", auditError);
    }
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
