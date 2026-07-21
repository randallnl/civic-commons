import { z } from "zod";

const emptyToUndefined = (value) => (value === "" ? undefined : value);
const stringish = z.preprocess(
  (value) => {
    if (value === null || value === undefined) return "";
    return String(value);
  },
  z.string(),
);
const optionalStringish = z.preprocess(emptyToUndefined, stringish.optional());
const numberish = z.preprocess(
  (value) => {
    if (value === "" || value === null || value === undefined) return undefined;
    const number = Number(value);
    return Number.isFinite(number) ? number : value;
  },
  z.number().optional(),
);
const relationList = z.array(z.unknown()).default([]);

export const CandidateSchema = z
  .object({
    filerEntityNumber: optionalStringish,
    filer_entity_number: optionalStringish,
    personId: numberish,
    person_id: numberish,
    candidateFirstName: optionalStringish,
    candidate_first_name: optionalStringish,
    candidateLastName: optionalStringish,
    candidate_last_name: optionalStringish,
    name: optionalStringish,
    officeType: optionalStringish,
    office_type: optionalStringish,
    office: optionalStringish,
    county: optionalStringish,
    district: optionalStringish,
    politicalParty: optionalStringish,
    political_party: optionalStringish,
    electionYear: numberish,
    election_year: numberish,
    electionCycle: optionalStringish,
    election_cycle: optionalStringish,
    candidateWebsite: optionalStringish,
    candidate_website: optionalStringish,
    candidateEmail: optionalStringish,
    candidate_email: optionalStringish,
    photoUrl: optionalStringish,
    photo_url: optionalStringish,
    slug: optionalStringish,
    isFreeStater: z.unknown().optional(),
    is_free_stater: z.unknown().optional(),
    candidateRoles: z.array(z.unknown()).optional(),
  })
  .passthrough();

export const RepresentativeSchema = z
  .object({
    id: z.union([z.string(), z.number()]).optional(),
    personid: z.union([z.string(), z.number()]).optional(),
    employeeno: z.union([z.string(), z.number()]).optional(),
    name: optionalStringish,
    firstname: optionalStringish,
    lastname: optionalStringish,
    chamber: optionalStringish,
    body: optionalStringish,
    party: optionalStringish,
    district: optionalStringish,
    raw_district: optionalStringish,
    county: optionalStringish,
    countycode: optionalStringish,
    location_text: optionalStringish,
    email: optionalStringish,
    photo: optionalStringish,
    isFreeStater: z.unknown().optional(),
    is_free_stater: z.unknown().optional(),
    alignmentPercent: numberish,
    alignment_percent: numberish,
    voteHistory: z.array(z.unknown()).default([]),
  })
  .passthrough();

export const ArticleSchema = z
  .object({
    article_id: optionalStringish,
    articleId: optionalStringish,
    url: optionalStringish,
    title: optionalStringish,
    summary: optionalStringish,
    publisher: optionalStringish,
    source: optionalStringish,
    publication: optionalStringish,
    domain: optionalStringish,
    resource_type: optionalStringish,
    resourceType: optionalStringish,
    towns: relationList,
    bills: relationList,
    legislators: relationList,
    candidates: relationList,
    issueAreas: relationList,
    impactTypes: relationList,
    preview: z.unknown().optional(),
  })
  .passthrough();

export const SuggestUpdateSchema = z.object({
  pageUrl: stringish.pipe(z.string().url("Enter a valid page URL.")),
  submitterEmail: stringish.pipe(z.string().email("Enter a valid email address.")),
  suggestion: stringish.pipe(z.string().min(1, "Suggested update is required.")),
  otherInfo: stringish.optional().default(""),
});

export function parseCandidate(value) {
  return parseWithFallback(CandidateSchema, value, {});
}

export function parseRepresentative(value) {
  return parseWithFallback(RepresentativeSchema, value, {});
}

export function parseArticle(value) {
  return parseWithFallback(ArticleSchema, value, {});
}

export function parseList(values, parseItem) {
  return (Array.isArray(values) ? values : [])
    .map((value) => parseItem(value))
    .filter(Boolean);
}

function parseWithFallback(schema, value, fallback) {
  const parsed = schema.safeParse(value);
  return parsed.success ? parsed.data : schema.parse(fallback);
}
