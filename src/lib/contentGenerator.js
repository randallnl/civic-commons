import { cleanText } from "./text.js";

export const CONTENT_GENERATOR_PRODUCTION_URL =
  "https://content-generator.randall-d53.workers.dev";
export const CONTENT_GENERATOR_TIMEOUT_MS = 45_000;
export const CONTENT_GRAPHIC_SOURCE_APP = "nh-deserves-better";
export const CANDIDATE_GRAPHIC_TEMPLATE = "candidate-profile-update";
export const LEGISLATOR_GRAPHIC_TEMPLATE = "legislator-profile-update";
export const CONTENT_GRAPHIC_TEMPLATES = [
  CANDIDATE_GRAPHIC_TEMPLATE,
  LEGISLATOR_GRAPHIC_TEMPLATE,
];

const MAX_RESPONSE_BYTES = 1_048_576;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const TEMPLATE_RULES = {
  [CANDIDATE_GRAPHIC_TEMPLATE]: {
    eyebrow: { max: 42 },
    headline: { max: 70, required: true },
    office: { max: 100, required: true },
    districtCommunity: { max: 80 },
    body: { max: 220, required: true },
    image: { max: 2048, required: true, publicUrl: true },
    cta: { max: 72 },
  },
  [LEGISLATOR_GRAPHIC_TEMPLATE]: {
    eyebrow: { max: 42 },
    headline: { max: 70, required: true },
    office: { max: 70, required: true },
    districtCommunity: { max: 110 },
    updateLabel: { max: 42 },
    body: { max: 240, required: true },
    image: { max: 2048, required: true, publicUrl: true },
    cta: { max: 72 },
  },
};

/**
 * An operational or validation error returned by the Content Generator.
 */
export class ContentGeneratorError extends Error {
  constructor(
    message,
    {
      code = "CONTENT_GENERATOR_ERROR",
      details = {},
      requestId = "",
      status = 502,
      retryable = false,
    } = {},
  ) {
    super(message);
    this.name = "ContentGeneratorError";
    this.code = code;
    this.details = details;
    this.requestId = requestId;
    this.status = status;
    this.retryable = retryable;
  }
}

/**
 * Build editable candidate form defaults from the profile fields already
 * loaded by the page. The description is intentionally generic because NHDB's
 * editor, not the renderer, decides what changed.
 */
export function candidateGraphicFormValues(profile = {}) {
  const headline = graphicText(profile.name || profile.headline || "");
  const office = graphicText(
    profile.officeLine ||
      joinGraphicParts([
        profile.office,
        candidateDistrict(profile.county, profile.district),
      ]),
  );

  return {
    template: CANDIDATE_GRAPHIC_TEMPLATE,
    eyebrow: "CANDIDATE PROFILE UPDATED",
    updateLabel: "",
    headline,
    office,
    districtCommunity: graphicText(profile.community || profile.towns || ""),
    body: graphicText(
      profile.body || "Candidate profile information has been updated.",
    ),
    image: publicImageDefault(profile.image || profile.photoUrl || ""),
    cta: graphicText(profile.cta || "View the candidate profile"),
  };
}

/**
 * Build editable legislator form defaults from the profile fields already
 * loaded by the page.
 */
export function legislatorGraphicFormValues(profile = {}) {
  const district = graphicText(
    profile.districtLine ||
      joinGraphicParts([
        profile.district,
        profile.community || profile.towns,
      ]),
  );

  return {
    template: LEGISLATOR_GRAPHIC_TEMPLATE,
    eyebrow: "LEGISLATOR PROFILE",
    updateLabel: graphicText(profile.updateLabel || "VOTING RECORD UPDATED"),
    headline: graphicText(profile.name || profile.headline || ""),
    office: graphicText(profile.office || "State Representative"),
    districtCommunity: district,
    body: graphicText(
      profile.body ||
        "New public-record context is now available on this legislator profile.",
    ),
    image: publicImageDefault(profile.image || profile.photoUrl || ""),
    cta: graphicText(profile.cta || "Review the public record"),
  };
}

/**
 * Validate and normalize browser-provided form fields before they are sent to
 * the renderer. Returns form field names so the UI can display errors inline.
 */
export function validateContentGraphicRequest(value = {}) {
  const fieldErrors = {};
  const template = normalizeText(value.template);
  const entityType = normalizeText(value.entityType).toLowerCase();
  const entityId = normalizeText(value.entityId);
  const eventId = normalizeText(value.eventId).toLowerCase();

  if (!CONTENT_GRAPHIC_TEMPLATES.includes(template)) {
    fieldErrors.template = "Choose a supported profile graphic template.";
  }
  if (!['candidate', 'legislator'].includes(entityType)) {
    fieldErrors.entityType = "Choose a candidate or legislator profile.";
  }
  if (!entityId || entityId.length > 160) {
    fieldErrors.entityId = "A valid profile identifier is required.";
  }
  if (!UUID_PATTERN.test(eventId)) {
    fieldErrors.eventId = "A valid content event identifier is required.";
  }

  const normalized = {
    template,
    entityType,
    entityId,
    eventId,
    eyebrow: normalizeText(value.eyebrow),
    updateLabel: normalizeText(value.updateLabel),
    headline: normalizeText(value.headline),
    office: normalizeText(value.office),
    districtCommunity: normalizeText(value.districtCommunity),
    body: normalizeText(value.body),
    image: normalizeText(value.image),
    cta: normalizeText(value.cta),
  };

  const rules = TEMPLATE_RULES[template];
  if (rules) {
    for (const [field, rule] of Object.entries(rules)) {
      const fieldValue = normalized[field] || "";
      if (rule.required && !fieldValue) {
        fieldErrors[field] = "This field is required.";
        continue;
      }
      if (characterCount(fieldValue) > rule.max) {
        fieldErrors[field] = `Use ${rule.max} characters or fewer.`;
        continue;
      }
      if (rule.publicUrl && fieldValue && !isPublicHttpUrl(fieldValue)) {
        fieldErrors[field] =
          "Enter an absolute, publicly reachable HTTP or HTTPS image URL.";
      }
    }
  }

  return {
    ok: Object.keys(fieldErrors).length === 0,
    data: normalized,
    fieldErrors,
  };
}

export function buildContentGraphicPayload(data = {}) {
  const source = {
    app: CONTENT_GRAPHIC_SOURCE_APP,
    id: contentGraphicSourceId(data.template, data.eventId),
  };
  const image = {
    url: data.image,
    alt: `Portrait of ${data.headline}`,
  };

  if (data.template === CANDIDATE_GRAPHIC_TEMPLATE) {
    return {
      template: CANDIDATE_GRAPHIC_TEMPLATE,
      inputs: {
        eyebrow: data.eyebrow,
        headline: data.headline,
        office: data.office,
        community: data.districtCommunity,
        body: data.body,
        image: data.image,
        cta: data.cta,
      },
      image,
      source,
    };
  }

  if (data.template === LEGISLATOR_GRAPHIC_TEMPLATE) {
    return {
      template: LEGISLATOR_GRAPHIC_TEMPLATE,
      inputs: {
        eyebrow: data.eyebrow,
        headline: data.headline,
        office: data.office,
        district: data.districtCommunity,
        update_label: data.updateLabel,
        body: data.body,
        image: data.image,
        cta: data.cta,
      },
      image,
      source,
    };
  }

  throw new ContentGeneratorError("Choose a supported profile graphic template.", {
    code: "INVALID_TEMPLATE",
    details: { template: "Choose a supported profile graphic template." },
    status: 422,
  });
}

export function contentGraphicSourceId(template, eventId) {
  if (!CONTENT_GRAPHIC_TEMPLATES.includes(template) || !UUID_PATTERN.test(eventId || "")) {
    throw new Error("A supported template and valid event UUID are required.");
  }
  return `${template}:${String(eventId).toLowerCase()}`;
}

export function mapRendererFieldErrors(details = {}) {
  const mapped = {};
  const aliases = {
    template: "template",
    eyebrow: "eyebrow",
    headline: "headline",
    office: "office",
    community: "districtCommunity",
    district: "districtCommunity",
    update_label: "updateLabel",
    body: "body",
    image: "image",
    url: "image",
    cta: "cta",
  };

  for (const [path, message] of Object.entries(details || {})) {
    const segments = String(path).split(/[.[\]]/).filter(Boolean);
    const rendererField = [...segments].reverse().find((segment) => aliases[segment]);
    const formField = aliases[rendererField] || aliases[path];
    if (formField) mapped[formField] = normalizeErrorMessage(message);
  }

  return mapped;
}

export function resolveContentGraphicAssetUrl(imageUrl, baseUrl) {
  if (!imageUrl) throw new Error("The renderer response did not include an image URL.");
  return new URL(String(imageUrl), normalizedBaseUrl(baseUrl)).toString();
}

/**
 * Create a renderer client whose transport and base URL are injected by the
 * server route. Authentication headers can be added here later without
 * changing any UI code.
 */
export function createContentGeneratorClient({
  baseUrl = CONTENT_GENERATOR_PRODUCTION_URL,
  fetchImpl = globalThis.fetch,
  timeoutMs = CONTENT_GENERATOR_TIMEOUT_MS,
} = {}) {
  const normalizedBase = normalizedBaseUrl(baseUrl);
  if (typeof fetchImpl !== "function") throw new Error("A fetch implementation is required.");

  return {
    async render(payload) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort("content-generator-timeout"), timeoutMs);
      let response;

      try {
        response = await fetchImpl(new URL("/api/v1/renders", normalizedBase), {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
      } catch (error) {
        if (controller.signal.aborted || error?.name === "AbortError") {
          throw new ContentGeneratorError(
            "Graphic rendering timed out. Retry to check for the original render.",
            { code: "RENDER_TIMEOUT", status: 504, retryable: true },
          );
        }
        throw new ContentGeneratorError(
          "The graphic renderer could not be reached. Retry the same render safely.",
          { code: "RENDER_NETWORK_ERROR", status: 502, retryable: true },
        );
      } finally {
        clearTimeout(timeout);
      }

      const responseBody = await readBoundedJson(response);
      if (!response.ok) {
        const rendererError = responseBody?.error || {};
        throw new ContentGeneratorError(
          normalizeText(rendererError.message) || "The graphic renderer rejected the request.",
          {
            code: normalizeText(rendererError.code) || "RENDER_FAILED",
            details: rendererError.details || {},
            requestId: normalizeText(rendererError.request_id),
            status: response.status,
            retryable: response.status >= 500,
          },
        );
      }

      if (
        responseBody?.status !== "complete" ||
        !responseBody?.id ||
        !responseBody?.image_url
      ) {
        throw new ContentGeneratorError(
          "The graphic renderer returned an incomplete response. Retry the same render safely.",
          { code: "INVALID_RENDER_RESPONSE", status: 502, retryable: true },
        );
      }

      return {
        ...responseBody,
        image_url: resolveContentGraphicAssetUrl(responseBody.image_url, normalizedBase),
        duplicate: Boolean(responseBody.duplicate),
      };
    },
  };
}

export function isPublicHttpUrl(value = "") {
  let url;
  try {
    url = new URL(String(value));
  } catch {
    return false;
  }

  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return false;
  const hostname = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (!hostname || hostname === "localhost" || hostname.endsWith(".local")) return false;
  if (isPrivateIpv4(hostname) || isPrivateIpv6(hostname)) return false;
  return true;
}

function publicImageDefault(value = "") {
  const normalized = normalizeText(value);
  return isPublicHttpUrl(normalized) ? normalized : "";
}

function candidateDistrict(county = "", district = "") {
  const countyText = graphicText(county);
  const districtText = graphicText(district);
  if (countyText && districtText) return `${countyText} District ${districtText}`;
  return countyText || (districtText ? `District ${districtText}` : "");
}

function joinGraphicParts(parts = []) {
  return parts.map(graphicText).filter(Boolean).join(" · ");
}

function normalizeText(value = "") {
  return graphicText(value);
}

function graphicText(value = "") {
  const marker = "NHDBMIDDOTPLACEHOLDER";
  return cleanText(String(value || "").replaceAll("·", marker)).replaceAll(marker, "·");
}

function characterCount(value = "") {
  return Array.from(value).length;
}

function normalizeErrorMessage(value) {
  if (Array.isArray(value)) return value.map(normalizeErrorMessage).filter(Boolean).join(" ");
  if (value && typeof value === "object") {
    return normalizeText(value.message || JSON.stringify(value));
  }
  return normalizeText(value || "This field is invalid.");
}

function normalizedBaseUrl(value) {
  const url = new URL(String(value || CONTENT_GENERATOR_PRODUCTION_URL));
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error("CONTENT_GENERATOR_BASE_URL must use HTTP or HTTPS.");
  }
  url.pathname = url.pathname.replace(/\/+$/, "") || "/";
  url.search = "";
  url.hash = "";
  return url;
}

async function readBoundedJson(response) {
  const contentLength = Number(response.headers.get("content-length") || 0);
  if (contentLength > MAX_RESPONSE_BYTES) {
    throw new ContentGeneratorError("The graphic renderer response was too large.", {
      code: "INVALID_RENDER_RESPONSE",
      status: 502,
      retryable: true,
    });
  }
  if (!response.body) return {};

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let body = "";
  let bytesRead = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    bytesRead += value.byteLength;
    if (bytesRead > MAX_RESPONSE_BYTES) {
      await reader.cancel();
      throw new ContentGeneratorError("The graphic renderer response was too large.", {
        code: "INVALID_RENDER_RESPONSE",
        status: 502,
        retryable: true,
      });
    }
    body += decoder.decode(value, { stream: true });
  }
  body += decoder.decode();

  try {
    return JSON.parse(body || "{}");
  } catch {
    throw new ContentGeneratorError("The graphic renderer returned invalid JSON.", {
      code: "INVALID_RENDER_RESPONSE",
      status: 502,
      retryable: true,
    });
  }
}

function isPrivateIpv4(hostname) {
  if (!/^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname)) return false;
  const octets = hostname.split(".").map(Number);
  if (octets.some((octet) => octet < 0 || octet > 255)) return true;
  const [first, second] = octets;
  return (
    first === 0 ||
    first === 10 ||
    first === 127 ||
    (first === 100 && second >= 64 && second <= 127) ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168) ||
    first >= 224
  );
}

function isPrivateIpv6(hostname) {
  if (!hostname.includes(":")) return false;
  const normalized = hostname.toLowerCase();
  return (
    normalized === "::" ||
    normalized === "::1" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    /^fe[89ab]/.test(normalized)
  );
}
