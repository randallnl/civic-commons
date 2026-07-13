import { cleanText } from "./text";

const DEFAULT_SHEET_BASE =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRlVa_PtnK6MieFoBJ1KEqFda8tTsBYps6zOYYKaX3WG78Hlz0Rab1X5TkCDLddQ5B8IluASVujyRjS/pub";

const DEFAULT_PROFILE_CSV_URL = `${DEFAULT_SHEET_BASE}?gid=0&single=true&output=csv`;
const DEFAULT_COMMENTS_CSV_URL = `${DEFAULT_SHEET_BASE}?gid=1943709711&single=true&output=csv`;
const DEFAULT_ENDORSEMENTS_CSV_URL = `${DEFAULT_SHEET_BASE}?gid=1964007252&single=true&output=csv`;

let organizationsCache = null;
let commentsCache = null;
let endorsementsCache = null;

export async function getOrganizations({
  profileCsvUrl =
    import.meta.env.ORGANIZATIONS_PROFILE_CSV_URL || DEFAULT_PROFILE_CSV_URL,
  commentsCsvUrl =
    import.meta.env.ORGANIZATIONS_COMMENTS_CSV_URL || DEFAULT_COMMENTS_CSV_URL,
  endorsementsCsvUrl =
    import.meta.env.ORGANIZATIONS_ENDORSEMENTS_CSV_URL || DEFAULT_ENDORSEMENTS_CSV_URL,
} = {}) {
  const [organizations, comments, endorsements] = await Promise.all([
    getOrganizationProfiles(profileCsvUrl),
    getOrganizationComments(commentsCsvUrl),
    getOrganizationEndorsements(endorsementsCsvUrl),
  ]);

  return organizations.map((organization) => ({
    ...organization,
    comments: commentsForOrganization(comments, organization),
    endorsements: endorsementsForOrganization(endorsements, organization),
  })).map((organization) => ({
    ...organization,
    issueAreas: uniqueList([
      organization.issueArea,
      ...organization.comments.flatMap((comment) => comment.issueAreas || []),
    ]),
    towns: uniqueList([
      organization.city,
      organization.town,
      ...splitList(organization.serviceArea),
      ...organization.comments.flatMap((comment) => comment.towns || []),
    ]),
  }));
}

export async function getOrganization(slug, options = {}) {
  const organizations = await getOrganizations(options);
  return organizations.find((organization) => organization.slug === slug);
}

async function getOrganizationProfiles(csvUrl) {
  if (organizationsCache) return organizationsCache;

  const response = await fetch(csvUrl);
  if (!response.ok) {
    throw new Error(`Unable to load organizations: ${response.status}`);
  }

  organizationsCache = parseOrganizationProfiles(await response.text());
  return organizationsCache;
}

async function getOrganizationComments(csvUrl) {
  if (commentsCache) return commentsCache;

  const response = await fetch(csvUrl);
  if (!response.ok) {
    throw new Error(`Unable to load organization comments: ${response.status}`);
  }

  commentsCache = parseOrganizationComments(await response.text());
  return commentsCache;
}

async function getOrganizationEndorsements(csvUrl) {
  if (endorsementsCache) return endorsementsCache;

  const response = await fetch(csvUrl);
  if (!response.ok) {
    throw new Error(`Unable to load organization endorsements: ${response.status}`);
  }

  endorsementsCache = parseOrganizationEndorsements(await response.text());
  return endorsementsCache;
}

function parseOrganizationProfiles(csv) {
  return rowsFromCsv(csv)
    .map((row) => {
      const name = row["Organization Name"] || "";
      const slug = slugify(row.Slug || name);

      return {
        name: cleanText(name),
        slug,
        type: cleanText(row["Organization Type"] || ""),
        mission: cleanText(row.Mission || ""),
        shortDescription: cleanText(row["Short Description"] || ""),
        website: row.Website || "",
        email: row["Public Contact Email"] || row.Email || "",
        phone: row.Phone || "",
        facebook: row.Facebook || "",
        instagram: row.Instagram || "",
        bluesky: row.Bluesky || "",
        city: cleanText(row.City || ""),
        town: cleanText(row.Town || ""),
        state: cleanText(row.State || ""),
        serviceArea: cleanText(row["Service Area"] || ""),
        issueArea: cleanText(row["Issue Area"] || row.Issue || row.Issues || ""),
        logoUrl: organizationAssetUrl(row["Logo URL"] || ""),
        bannerImageUrl: organizationAssetUrl(row["Banner Image URL"] || ""),
        foundedYear: row["Founded Year"] || "",
        approved: /^yes$/i.test(row.Approved || ""),
        notes: cleanText(row.Notes || ""),
      };
    })
    .filter((organization) => organization.name && organization.approved);
}

function parseOrganizationComments(csv) {
  return rowsFromCsv(csv)
    .map((row) => ({
      organization: cleanText(row.Organization || ""),
      organizationSlug: slugify(row.Organization || ""),
      bill: normalizeBillCode(row.Bill || ""),
      billLabel: cleanText(row.Bill || ""),
      position: cleanText(row.Position || ""),
      issueAreas: splitList(row["Issue Area"] || row.Issue || row.Issues || ""),
      towns: splitList(row.Town || row.Towns || row.Community || row.Communities || ""),
      comment: cleanText(row.Comment || ""),
      author: cleanText(row.Author || ""),
      date: cleanText(row.Date || ""),
    }))
    .filter((comment) => comment.organization && comment.comment);
}

function parseOrganizationEndorsements(csv) {
  return rowsFromCsv(csv)
    .map((row) => ({
      organization: cleanText(row.Organization || ""),
      organizationSlug: slugify(row.Organization || ""),
      candidateName: cleanText(row["Candidate Name"] || ""),
      candidateSlug: row["Candidate Slug"] || "",
      candidateSlugKey: slugify(row["Candidate Slug"] || row["Candidate Name"] || ""),
      office: cleanText(row.Office || ""),
      district: cleanText(row.District || ""),
      electionYear: cleanText(row["Election Year"] || ""),
      position: cleanText(row.Position || ""),
      statement: cleanText(row["Endorsement Statement"] || ""),
      date: cleanText(row.Date || ""),
      status: cleanText(row.Status || ""),
    }))
    .filter((endorsement) =>
      endorsement.organization &&
      endorsement.candidateName &&
      /^published$/i.test(endorsement.status || ""),
    );
}

function commentsForOrganization(comments, organization) {
  return comments.filter((comment) => {
    const orgKey = slugify(comment.organization);
    return orgKey === organization.slug || comment.organization === organization.name;
  });
}

function endorsementsForOrganization(endorsements, organization) {
  return endorsements.filter((endorsement) => {
    const orgKey = slugify(endorsement.organization);
    return orgKey === organization.slug || endorsement.organization === organization.name;
  });
}

export function endorsementsForCandidate(organizations = [], candidate = {}, slug = "") {
  const candidateKeys = new Set(
    [
      slug,
      candidate.slug,
      candidate.filerEntityNumber,
      candidate.name,
      [candidate.filerEntityNumber, candidate.name].filter(Boolean).join("-"),
    ]
      .filter(Boolean)
      .map(slugify),
  );

  return organizations.flatMap((organization) =>
    (organization.endorsements || [])
      .filter((endorsement) => candidateKeys.has(endorsement.candidateSlugKey))
      .map((endorsement) => ({ ...endorsement, organization })),
  );
}

function rowsFromCsv(csv) {
  const rows = parseCsv(csv);
  const [headers = [], ...records] = rows;
  const keys = headers.map((header) => String(header).trim());

  return records.map((record) =>
    Object.fromEntries(keys.map((key, index) => [key, record[index] || ""])),
  );
}

function parseCsv(csv) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let index = 0; index < csv.length; index += 1) {
    const char = csv[index];
    const nextChar = csv[index + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        field += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(field);
      field = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") index += 1;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      continue;
    }

    field += char;
  }

  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((csvRow) =>
    csvRow.some((value) => String(value).trim().length > 0),
  );
}

export function organizationPath(organization = {}) {
  return `/organizations/${organization.slug}`;
}

export function slugify(value = "") {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function normalizeBillCode(value = "") {
  return String(value).toUpperCase().replace(/\s+/g, "");
}

function splitList(value = "") {
  return String(value || "")
    .split(/[,;|]/)
    .map((item) => cleanText(item).trim())
    .filter(Boolean);
}

function uniqueList(values = []) {
  return [...new Set(values.flatMap((value) => splitList(value)))].sort((a, b) =>
    a.localeCompare(b),
  );
}

function organizationAssetUrl(value = "") {
  const key = String(value).trim();
  if (!key || key === "...") return "";
  if (/^https?:\/\//i.test(key)) return key;

  return `/api/organization-assets/${key
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/")}`;
}
