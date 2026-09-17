import { defineMiddleware } from "astro:middleware";
import { adminDb, currentAdminSession } from "./lib/adminAuth";
import {
  adminAuditMetadata,
  adminAuditOutcome,
  ensureAdminAuditLog,
  recordAdminAudit,
  shouldAuditAdminRequest,
} from "./lib/adminAudit";

export const onRequest = defineMiddleware(async ({ request }, next) => {
  if (!shouldAuditAdminRequest(request)) return next();

  const session = await currentAdminSession(request);
  if (!session) return next();

  const db = adminDb();
  // Fail closed before a mutation if the audit table cannot be used.
  await ensureAdminAuditLog(db);
  const metadata = await adminAuditMetadata(request);

  let response;
  try {
    response = await next();
  } catch (error) {
    await recordAdminAudit(db, {
      session, request, metadata, outcome: "error", httpStatus: 500,
    });
    throw error;
  }

  try {
    await recordAdminAudit(db, {
      session, request, metadata,
      outcome: adminAuditOutcome(response), httpStatus: response.status,
    });
  } catch (error) {
    // The mutation may already have completed; preserve its response and surface the failure.
    console.error("Unable to record admin audit event:", error);
  }
  return response;
});
