import assert from "node:assert/strict";
import test from "node:test";

import {
  CANDIDATE_GRAPHIC_TEMPLATE,
  ContentGeneratorError,
  LEGISLATOR_GRAPHIC_TEMPLATE,
  buildContentGraphicPayload,
  candidateGraphicFormValues,
  contentGraphicSourceId,
  createContentGeneratorClient,
  isPublicHttpUrl,
  legislatorGraphicFormValues,
  mapRendererFieldErrors,
  resolveContentGraphicAssetUrl,
  validateContentGraphicRequest,
} from "../src/lib/contentGenerator.js";
import {
  contentGraphicAccess,
  handleContentGraphicPost,
} from "../src/lib/contentGraphicAction.js";
import {
  contentGraphicRetryPayload,
  renderContentGraphic,
  shouldReuseContentGraphicPayload,
} from "../src/lib/contentGraphicEvents.js";
import { contentGraphicUiState } from "../src/lib/contentGraphicUiState.js";

const EVENT_ID = "7b8aeada-aeb8-4ee8-9c91-3dbb45b1af96";

function validRequest(overrides = {}) {
  return {
    eventId: EVENT_ID,
    entityType: "candidate",
    entityId: "candidate-123",
    template: CANDIDATE_GRAPHIC_TEMPLATE,
    eyebrow: "CANDIDATE PROFILE UPDATED",
    updateLabel: "",
    headline: "Candidate Name",
    office: "State Representative · Merrimack District 9",
    districtCommunity: "Concord, New Hampshire",
    body: "New campaign website and community questionnaire added.",
    image: "https://public.example.org/candidate-photo.jpg",
    cta: "View the candidate profile",
    ...overrides,
  };
}

function createContentGraphicDbStub() {
  let row = null;

  return {
    prepare(sql) {
      let values = [];
      return {
        bind(...nextValues) {
          values = nextValues;
          return this;
        },
        async run() {
          if (sql.includes("INSERT OR IGNORE INTO content_graphic_events")) {
            if (row) return { meta: { changes: 0 } };
            row = {
              local_event_id: values[0],
              entity_type: values[1],
              entity_id: values[2],
              candidate_id: values[3],
              legislator_id: values[4],
              template_slug: values[5],
              source_id: values[6],
              status: "pending",
              request_json: values[7],
              created_by: values[8],
              renderer_duplicate: 0,
              created_at: "2026-08-31 12:00:00",
              updated_at: "2026-08-31 12:00:00",
            };
            return { meta: { changes: 1 } };
          }
          if (sql.includes("SET request_json = ?")) {
            row.request_json = values[0];
            row.status = "pending";
            return { meta: { changes: 1 } };
          }
          if (sql.includes("SET renderer_render_id = ?")) {
            row.renderer_render_id = values[0];
            row.variation_id = values[1];
            row.variation_name = values[2];
            row.image_url = values[3];
            row.status = "complete";
            row.renderer_duplicate = values[4];
            row.completed_at = values[5] || "2026-08-31 12:00:01";
            return { meta: { changes: 1 } };
          }
          return { meta: { changes: 0 } };
        },
        async first() {
          return row ? { ...row } : null;
        },
      };
    },
  };
}

test("maps a candidate profile into the candidate renderer payload", () => {
  const form = candidateGraphicFormValues({
    name: "Candidate Name",
    office: "State Representative",
    county: "Merrimack",
    district: "9",
    community: "Concord, New Hampshire",
    body: "New campaign website and community questionnaire added.",
    image: "https://public.example.org/candidate-photo.jpg",
  });
  const validation = validateContentGraphicRequest({ ...validRequest(), ...form });
  assert.equal(validation.ok, true);
  assert.deepEqual(buildContentGraphicPayload(validation.data), {
    template: "candidate-profile-update",
    inputs: {
      eyebrow: "CANDIDATE PROFILE UPDATED",
      headline: "Candidate Name",
      office: "State Representative · Merrimack District 9",
      community: "Concord, New Hampshire",
      body: "New campaign website and community questionnaire added.",
      image: "https://public.example.org/candidate-photo.jpg",
      cta: "View the candidate profile",
    },
    image: {
      url: "https://public.example.org/candidate-photo.jpg",
      alt: "Portrait of Candidate Name",
    },
    source: {
      app: "nh-deserves-better",
      id: `candidate-profile-update:${EVENT_ID}`,
    },
  });
});

test("maps a legislator profile into the legislator renderer payload", () => {
  const form = legislatorGraphicFormValues({
    name: "Legislator Name",
    office: "State Representative",
    districtLine: "Hillsborough District 12 · Manchester",
    body: "New roll-call votes and public testimony context are now available.",
    image: "https://public.example.org/legislator-photo.jpg",
  });
  const validation = validateContentGraphicRequest({
    ...validRequest({ entityType: "legislator", entityId: "1234" }),
    ...form,
  });
  assert.equal(validation.ok, true);
  assert.deepEqual(buildContentGraphicPayload(validation.data), {
    template: "legislator-profile-update",
    inputs: {
      eyebrow: "LEGISLATOR PROFILE",
      headline: "Legislator Name",
      office: "State Representative",
      district: "Hillsborough District 12 · Manchester",
      update_label: "VOTING RECORD UPDATED",
      body: "New roll-call votes and public testimony context are now available.",
      image: "https://public.example.org/legislator-photo.jpg",
      cta: "Review the public record",
    },
    image: {
      url: "https://public.example.org/legislator-photo.jpg",
      alt: "Portrait of Legislator Name",
    },
    source: {
      app: "nh-deserves-better",
      id: `legislator-profile-update:${EVENT_ID}`,
    },
  });
});

test("enforces template-specific required fields and character limits", () => {
  const validation = validateContentGraphicRequest(validRequest({
    headline: "",
    office: "O".repeat(101),
    body: "B".repeat(221),
    cta: "C".repeat(73),
  }));
  assert.equal(validation.ok, false);
  assert.equal(validation.fieldErrors.headline, "This field is required.");
  assert.match(validation.fieldErrors.office, /100/);
  assert.match(validation.fieldErrors.body, /220/);
  assert.match(validation.fieldErrors.cta, /72/);
});

test("accepts public HTTP(S) portraits and rejects local or private URLs", () => {
  assert.equal(isPublicHttpUrl("https://photos.nhdeservesbetter.com/person.jpg"), true);
  assert.equal(isPublicHttpUrl("http://public.example.org/person.jpg"), true);
  assert.equal(isPublicHttpUrl("/private/person.jpg"), false);
  assert.equal(isPublicHttpUrl("http://localhost/person.jpg"), false);
  assert.equal(isPublicHttpUrl("http://192.168.1.8/person.jpg"), false);
  const validation = validateContentGraphicRequest(validRequest({ image: "http://127.0.0.1/a.png" }));
  assert.match(validation.fieldErrors.image, /publicly reachable/);
});

test("resolves relative renderer asset paths against the configured base URL", () => {
  assert.equal(
    resolveContentGraphicAssetUrl(
      "/api/v1/assets/render_123.png",
      "https://content-generator.example.com/base",
    ),
    "https://content-generator.example.com/api/v1/assets/render_123.png",
  );
});

test("preserves structured renderer validation errors and maps fields", async () => {
  const client = createContentGeneratorClient({
    fetchImpl: async () => new Response(JSON.stringify({
      error: {
        code: "INVALID_PAYLOAD",
        message: "The render payload is invalid.",
        details: { body: "This field is required.", "inputs.community": "Too long." },
        request_id: "req_123",
      },
    }), { status: 422, headers: { "Content-Type": "application/json" } }),
  });
  await assert.rejects(client.render({}), (error) => {
    assert.ok(error instanceof ContentGeneratorError);
    assert.equal(error.code, "INVALID_PAYLOAD");
    assert.equal(error.requestId, "req_123");
    assert.deepEqual(mapRendererFieldErrors(error.details), {
      body: "This field is required.",
      districtCommunity: "Too long.",
    });
    return true;
  });
});

test("reports timeout and network failures as safe-to-retry errors", async () => {
  const timeoutClient = createContentGeneratorClient({
    timeoutMs: 5,
    fetchImpl: async (_url, { signal }) => new Promise((_resolve, reject) => {
      signal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
    }),
  });
  await assert.rejects(timeoutClient.render({}), (error) => {
    assert.equal(error.code, "RENDER_TIMEOUT");
    assert.equal(error.retryable, true);
    return true;
  });

  const networkClient = createContentGeneratorClient({
    fetchImpl: async () => { throw new TypeError("network down"); },
  });
  await assert.rejects(networkClient.render({}), (error) => {
    assert.equal(error.code, "RENDER_NETWORK_ERROR");
    assert.equal(error.retryable, true);
    return true;
  });
});

test("normalizes successful duplicate responses and their asset URLs", async () => {
  const client = createContentGeneratorClient({
    baseUrl: "https://content-generator.example.com",
    fetchImpl: async () => new Response(JSON.stringify({
      id: "render_123",
      status: "complete",
      template: CANDIDATE_GRAPHIC_TEMPLATE,
      variation: "civic-blue",
      image_url: "/api/v1/assets/render_123.png",
      duplicate: true,
    }), { status: 200, headers: { "Content-Type": "application/json" } }),
  });
  const result = await client.render({});
  assert.equal(result.duplicate, true);
  assert.equal(result.image_url, "https://content-generator.example.com/api/v1/assets/render_123.png");
});

test("reuses the same source ID and stored payload for an uncertain retry", () => {
  const original = buildContentGraphicPayload(validateContentGraphicRequest(validRequest()).data);
  const edited = buildContentGraphicPayload(validateContentGraphicRequest(validRequest({ body: "Edited body" })).data);
  assert.equal(
    contentGraphicSourceId(CANDIDATE_GRAPHIC_TEMPLATE, EVENT_ID),
    contentGraphicSourceId(CANDIDATE_GRAPHIC_TEMPLATE, EVENT_ID),
  );
  assert.deepEqual(contentGraphicRetryPayload("uncertain", JSON.stringify(original), edited), original);
  assert.equal(shouldReuseContentGraphicPayload("pending", false), true);
  assert.deepEqual(contentGraphicRetryPayload("pending", JSON.stringify(original), edited), original);
  assert.equal(shouldReuseContentGraphicPayload("pending", true), false);
});

test("renders a newly inserted content event without reusing stale state", async () => {
  const data = validateContentGraphicRequest(validRequest()).data;
  const payload = buildContentGraphicPayload(data);
  let sentPayload;

  const result = await renderContentGraphic({
    db: createContentGraphicDbStub(),
    data,
    payload,
    baseUrl: "https://content-generator.example.com",
    fetchImpl: async (_url, options) => {
      sentPayload = JSON.parse(options.body);
      return new Response(JSON.stringify({
        id: "render_123",
        status: "complete",
        variation: "civic-blue",
        variationName: "Civic Blue",
        image_url: "/api/v1/assets/render_123.png",
        duplicate: false,
      }), { status: 200, headers: { "Content-Type": "application/json" } });
    },
  });

  assert.deepEqual(sentPayload, payload);
  assert.equal(result.status, "complete");
  assert.equal(result.rendererId, "render_123");
});

test("a variation UUID produces a new source ID", () => {
  const nextEventId = "a50e5549-f1f8-4a2e-a25f-f7373585d772";
  assert.notEqual(
    contentGraphicSourceId(CANDIDATE_GRAPHIC_TEMPLATE, EVENT_ID),
    contentGraphicSourceId(CANDIDATE_GRAPHIC_TEMPLATE, nextEventId),
  );
});

test("the server action rejects signed-out and unauthorized editors", async () => {
  const request = new Request("https://nhdeservesbetter.com/api/admin/content-graphics", {
    method: "POST",
    headers: { Origin: "https://nhdeservesbetter.com", "Content-Type": "application/json" },
    body: "{}",
  });
  const signedOut = await handleContentGraphicPost({
    request,
    authorize: async () => ({ ok: false }),
    canGenerate: () => false,
  });
  assert.equal(signedOut.status, 401);

  const access = contentGraphicAccess(
    { ok: true, session: { role: "content_moderator" } },
    () => false,
  );
  assert.equal(access.ok, false);
  assert.equal(access.status, 403);
});

test("editor UI state distinguishes success from field-specific failure", () => {
  const success = contentGraphicUiState({
    status: "complete",
    eventId: EVENT_ID,
    imageUrl: "https://content-generator.example.com/render.png",
  });
  assert.equal(success.phase, "success");
  assert.equal(success.result.imageUrl, "https://content-generator.example.com/render.png");

  const failure = contentGraphicUiState({
    status: "error",
    eventId: EVENT_ID,
    message: "The render payload is invalid.",
    requestId: "req_123",
    fieldErrors: { body: "This field is required." },
  });
  assert.equal(failure.phase, "error");
  assert.equal(failure.fieldErrors.body, "This field is required.");
  assert.match(failure.message, /req_123/);
});

test("legislator constraints use the legislator-specific limits", () => {
  const validation = validateContentGraphicRequest(validRequest({
    entityType: "legislator",
    entityId: "1234",
    template: LEGISLATOR_GRAPHIC_TEMPLATE,
    updateLabel: "U".repeat(43),
    office: "O".repeat(71),
    districtCommunity: "D".repeat(111),
    body: "B".repeat(241),
  }));
  assert.match(validation.fieldErrors.updateLabel, /42/);
  assert.match(validation.fieldErrors.office, /70/);
  assert.match(validation.fieldErrors.districtCommunity, /110/);
  assert.match(validation.fieldErrors.body, /240/);
});
