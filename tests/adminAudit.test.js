import assert from "node:assert/strict";
import test from "node:test";
import {
  adminAuditMetadata,
  adminAuditOutcome,
  shouldAuditAdminRequest,
} from "../src/lib/adminAudit.js";

test("audits authenticated admin mutations but not login requests or reads", () => {
  assert.equal(shouldAuditAdminRequest(new Request("https://example.com/api/admin/profile", { method: "POST" })), true);
  assert.equal(shouldAuditAdminRequest(new Request("https://example.com/api/admin/request-login", { method: "POST" })), false);
  assert.equal(shouldAuditAdminRequest(new Request("https://example.com/api/admin/profile", { method: "GET" })), false);
  assert.equal(shouldAuditAdminRequest(new Request("https://example.com/api/profile-updates", { method: "POST" })), false);
});

test("extracts only safe action and target identifiers", async () => {
  const body = new URLSearchParams({
    entityType: "person", entityKey: "tanya-rich", profileAction: "save",
    notes: "private notes must never be logged", sql: "DELETE FROM people",
    token: "secret-login-token",
  });
  const request = new Request("https://example.com/api/admin/profile", {
    method: "POST", body,
  });
  const metadata = await adminAuditMetadata(request);
  assert.deepEqual(metadata, {
    action: "admin.profile.save", targetType: "person", targetId: "tanya-rich",
  });
  assert.equal(request.bodyUsed, false);
  assert.doesNotMatch(JSON.stringify(metadata), /private notes|DELETE FROM|secret-login-token/);
});

test("does not read multipart uploads or store raw SQL", async () => {
  const form = new FormData();
  form.set("entityKey", "candidate-1");
  form.set("file", new Blob(["image content"]), "image.png");
  const upload = new Request("https://example.com/api/admin/upload", { method: "POST", body: form });
  assert.deepEqual(await adminAuditMetadata(upload), {
    action: "admin.upload", targetType: "", targetId: "",
  });

  const sql = new Request("https://example.com/api/admin/sql", {
    method: "POST", body: new URLSearchParams({ sql: "DELETE FROM d1_people" }),
  });
  assert.deepEqual(await adminAuditMetadata(sql), {
    action: "admin.sql", targetType: "sql", targetId: "",
  });
});

test("classifies redirects with errors and permission denials accurately", () => {
  assert.equal(adminAuditOutcome(Response.redirect("https://example.com/admin?message=saved", 303)), "success");
  assert.equal(adminAuditOutcome(Response.redirect("https://example.com/admin?error=failed", 303)), "error");
  assert.equal(adminAuditOutcome(new Response("Forbidden", { status: 403 })), "denied");
  assert.equal(adminAuditOutcome(new Response("Bad request", { status: 400 })), "error");
});
