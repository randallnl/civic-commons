const DEFAULT_SHEET_BASE =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRlVa_PtnK6MieFoBJ1KEqFda8tTsBYps6zOYYKaX3WG78Hlz0Rab1X5TkCDLddQ5B8IluASVujyRjS/pub";

const DEFAULT_PROFILE_CSV_URL = `${DEFAULT_SHEET_BASE}?gid=0&single=true&output=csv`;
const DEFAULT_COMMENTS_CSV_URL = `${DEFAULT_SHEET_BASE}?gid=1943709711&single=true&output=csv`;

let organizationsCache = null;
let commentsCache = null;

export async function getOrganizations({
  profileCsvUrl =
    import.meta.env.ORGANIZATIONS_PROFILE_CSV_URL || DEFAULT_PROFILE_CSV_URL,
  commentsCsvUrl =
    import.meta.env.ORGANIZATIONS_COMMENTS_CSV_URL || DEFAULT_COMMENTS_CSV_URL,
} = {}) {
  const [organizations, comments] = await Promise.all([
    getOrganizationProfiles(profileCsvUrl),
    getOrganizationComments(commentsCsvUrl),
  ]);

  return organizations.map((organization) => ({
    ...organization,
    comments: commentsForOrganization(comments, organization),
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

function parseOrganizationProfiles(csv) {
  return rowsFromCsv(csv)
    .map((row) => {
      const name = row["Organization Name"] || "";
      const slug = slugify(row.Slug || name);

      return {
        name,
        slug,
        type: row["Organization Type"] || "",
        mission: row.Mission || "",
        shortDescription: row["Short Description"] || "",
        website: row.Website || "",
        email: row["Public Contact Email"] || row.Email || "",
        phone: row.Phone || "",
        facebook: row.Facebook || "",
        instagram: row.Instagram || "",
        bluesky: row.Bluesky || "",
        city: row.City || "",
        state: row.State || "",
        serviceArea: row["Service Area"] || "",
        logoUrl: imageUrl(row["Logo URL"] || ""),
        bannerImageUrl: imageUrl(row["Banner Image URL"] || ""),
        foundedYear: row["Founded Year"] || "",
        approved: /^yes$/i.test(row.Approved || ""),
        notes: row.Notes || "",
      };
    })
    .filter((organization) => organization.name && organization.approved);
}

function parseOrganizationComments(csv) {
  return rowsFromCsv(csv)
    .map((row) => ({
      organization: row.Organization || "",
      organizationSlug: slugify(row.Organization || ""),
      bill: normalizeBillCode(row.Bill || ""),
      billLabel: row.Bill || "",
      position: row.Position || "",
      comment: row.Comment || "",
      author: row.Author || "",
      date: row.Date || "",
    }))
    .filter((comment) => comment.organization && comment.comment);
}

function commentsForOrganization(comments, organization) {
  return comments.filter((comment) => {
    const orgKey = slugify(comment.organization);
    return orgKey === organization.slug || comment.organization === organization.name;
  });
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

function imageUrl(value = "") {
  const url = String(value).trim();
  const driveMatch = url.match(/drive\.google\.com\/file\/d\/([^/]+)/);
  if (driveMatch) {
    return `https://drive.google.com/uc?export=view&id=${driveMatch[1]}`;
  }
  return url;
}
