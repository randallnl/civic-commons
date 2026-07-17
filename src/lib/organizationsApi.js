import { env } from "cloudflare:workers";
import { cleanText } from "./text";

const DEFAULT_SHEET_BASE =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRlVa_PtnK6MieFoBJ1KEqFda8tTsBYps6zOYYKaX3WG78Hlz0Rab1X5TkCDLddQ5B8IluASVujyRjS/pub";

const DEFAULT_PROFILE_CSV_URL = `${DEFAULT_SHEET_BASE}?gid=0&single=true&output=csv`;
const DEFAULT_COMMENTS_CSV_URL = `${DEFAULT_SHEET_BASE}?gid=1943709711&single=true&output=csv`;
const DEFAULT_ENDORSEMENTS_CSV_URL = `${DEFAULT_SHEET_BASE}?gid=1964007252&single=true&output=csv`;

export function organizationsDb() {
  return env.d1_db;
}

export async function ensureOrganizationTables(db = organizationsDb()) {
  if (!db) throw new Error("D1 database binding is not configured.");

  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS organizations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        type TEXT,
        mission TEXT,
        short_description TEXT,
        website TEXT,
        email TEXT,
        phone TEXT,
        facebook TEXT,
        instagram TEXT,
        bluesky TEXT,
        city TEXT,
        town TEXT,
        state TEXT,
        service_area TEXT,
        issue_area TEXT,
        logo_url TEXT,
        banner_image_url TEXT,
        founded_year TEXT,
        approved INTEGER NOT NULL DEFAULT 1,
        notes TEXT,
        source TEXT NOT NULL DEFAULT 'admin',
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`,
    )
    .run();

  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS organization_comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        organization_slug TEXT NOT NULL,
        organization_name TEXT NOT NULL,
        bill TEXT,
        bill_label TEXT,
        position TEXT,
        issue_area TEXT,
        towns TEXT,
        comment TEXT NOT NULL,
        author TEXT,
        date TEXT,
        status TEXT NOT NULL DEFAULT 'published',
        source TEXT NOT NULL DEFAULT 'admin',
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(organization_slug, bill, comment)
      )`,
    )
    .run();

  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS organization_endorsements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        organization_slug TEXT NOT NULL,
        organization_name TEXT NOT NULL,
        organization_website TEXT,
        organization_email TEXT,
        candidate_name TEXT NOT NULL,
        candidate_slug TEXT,
        candidate_slug_key TEXT NOT NULL,
        office TEXT,
        district TEXT,
        election_year TEXT,
        position TEXT,
        statement TEXT,
        date TEXT,
        status TEXT NOT NULL DEFAULT 'published',
        source TEXT NOT NULL DEFAULT 'admin',
        submitter_name TEXT,
        submitter_email TEXT,
        reviewed_by TEXT,
        reviewed_at TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(organization_slug, candidate_slug_key, position, statement)
      )`,
    )
    .run();

  await ensureColumn(db, "organization_endorsements", "organization_website", "TEXT");
  await ensureColumn(db, "organization_endorsements", "organization_email", "TEXT");
  await ensureColumn(db, "organization_endorsements", "submitter_name", "TEXT");
  await ensureColumn(db, "organization_endorsements", "submitter_email", "TEXT");
  await ensureColumn(db, "organization_endorsements", "reviewed_by", "TEXT");
  await ensureColumn(db, "organization_endorsements", "reviewed_at", "TEXT");
}

export async function getOrganizations({ includeUnapproved = false } = {}) {
  const db = organizationsDb();
  if (!db) return [];

  await ensureOrganizationTables(db);

  const organizationResult = await db
    .prepare(
      `SELECT *
       FROM organizations
       WHERE approved = 1 OR ? = 1
       ORDER BY name COLLATE NOCASE`,
    )
    .bind(includeUnapproved ? 1 : 0)
    .all();

  const organizations = (organizationResult.results || []).map(normalizeOrganizationRow);
  const [comments, endorsements] = await Promise.all([
    getOrganizationComments(db),
    getOrganizationEndorsements(db),
  ]);

  return organizations
    .map((organization) => ({
      ...organization,
      comments: commentsForOrganization(comments, organization),
      endorsements: endorsementsForOrganization(endorsements, organization),
    }))
    .map((organization) => ({
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

export async function saveOrganizationProfile(data = {}, db = organizationsDb()) {
  if (!db) throw new Error("D1 database binding is not configured.");
  await ensureOrganizationTables(db);

  const name = cleanText(data.name || "");
  if (!name) throw new Error("Organization name is required.");

  const slug = slugify(data.slug || name);
  if (!slug) throw new Error("Organization slug is required.");

  const result = await db
    .prepare(
      `INSERT INTO organizations (
         name, slug, type, mission, short_description, website, email, phone,
         facebook, instagram, bluesky, city, town, state, service_area,
         issue_area, logo_url, banner_image_url, founded_year, approved, notes,
         source, updated_at
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'admin', CURRENT_TIMESTAMP)
       ON CONFLICT(slug) DO UPDATE SET
         name = excluded.name,
         type = excluded.type,
         mission = excluded.mission,
         short_description = excluded.short_description,
         website = excluded.website,
         email = excluded.email,
         phone = excluded.phone,
         facebook = excluded.facebook,
         instagram = excluded.instagram,
         bluesky = excluded.bluesky,
         city = excluded.city,
         town = excluded.town,
         state = excluded.state,
         service_area = excluded.service_area,
         issue_area = excluded.issue_area,
         logo_url = excluded.logo_url,
         banner_image_url = excluded.banner_image_url,
         founded_year = excluded.founded_year,
         approved = excluded.approved,
         notes = excluded.notes,
         source = 'admin',
         updated_at = CURRENT_TIMESTAMP`,
    )
    .bind(
      name,
      slug,
      cleanText(data.type || ""),
      cleanText(data.mission || ""),
      cleanText(data.shortDescription || data.short_description || ""),
      String(data.website || "").trim(),
      String(data.email || "").trim(),
      String(data.phone || "").trim(),
      String(data.facebook || "").trim(),
      String(data.instagram || "").trim(),
      String(data.bluesky || "").trim(),
      cleanText(data.city || ""),
      cleanText(data.town || ""),
      cleanText(data.state || ""),
      cleanText(data.serviceArea || data.service_area || ""),
      cleanText(data.issueArea || data.issue_area || ""),
      String(data.logoUrl || data.logo_url || "").trim(),
      String(data.bannerImageUrl || data.banner_image_url || "").trim(),
      String(data.foundedYear || data.founded_year || "").trim(),
      truthy(data.approved) ? 1 : 0,
      cleanText(data.notes || ""),
    )
    .run();

  return {
    slug,
    changed: result.meta?.changes ?? result.changes ?? 0,
  };
}

export async function saveOrganizationComment(data = {}, {
  db = organizationsDb(),
  status = "published",
  source = "admin",
} = {}) {
  if (!db) throw new Error("D1 database binding is not configured.");
  await ensureOrganizationTables(db);

  const organizationName = cleanText(data.organizationName || data.organization || "");
  const organizationSlug = slugify(data.organizationSlug || data.organization_slug || organizationName);
  const comment = cleanText(data.comment || "");
  const bill = normalizeBillCode(data.bill || data.billCode || "");
  const billLabel = cleanText(data.billLabel || data.bill_label || bill);

  if (!organizationName) throw new Error("Organization name is required.");
  if (!organizationSlug) throw new Error("Organization slug is required.");
  if (!bill) throw new Error("Bill code is required.");
  if (!comment) throw new Error("Organization comment is required.");

  await ensureOrganizationProfileForComment({
    organizationName,
    organizationSlug,
    db,
  });

  const result = await db
    .prepare(
      `INSERT INTO organization_comments (
         organization_slug, organization_name, bill, bill_label, position,
         issue_area, towns, comment, author, date, status, source, updated_at
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(organization_slug, bill, comment) DO UPDATE SET
         organization_name = excluded.organization_name,
         bill_label = excluded.bill_label,
         position = excluded.position,
         issue_area = excluded.issue_area,
         towns = excluded.towns,
         author = excluded.author,
         date = excluded.date,
         status = excluded.status,
         source = excluded.source,
         updated_at = CURRENT_TIMESTAMP`,
    )
    .bind(
      organizationSlug,
      organizationName,
      bill,
      billLabel,
      cleanText(data.position || ""),
      cleanText(data.issueArea || data.issue_area || ""),
      cleanText(data.towns || data.town || ""),
      comment,
      cleanText(data.author || ""),
      cleanText(data.date || ""),
      status,
      source,
    )
    .run();

  return {
    organizationSlug,
    bill,
    changed: result.meta?.changes ?? result.changes ?? 0,
  };
}

export async function importOrganizationsFromSheets({
  profileCsvUrl =
    import.meta.env.ORGANIZATIONS_PROFILE_CSV_URL || DEFAULT_PROFILE_CSV_URL,
  commentsCsvUrl =
    import.meta.env.ORGANIZATIONS_COMMENTS_CSV_URL || DEFAULT_COMMENTS_CSV_URL,
  endorsementsCsvUrl =
    import.meta.env.ORGANIZATIONS_ENDORSEMENTS_CSV_URL || DEFAULT_ENDORSEMENTS_CSV_URL,
  db = organizationsDb(),
} = {}) {
  if (!db) throw new Error("D1 database binding is not configured.");
  await ensureOrganizationTables(db);

  const [organizations, comments, endorsements] = await Promise.all([
    fetchOrganizationProfiles(profileCsvUrl),
    fetchOrganizationComments(commentsCsvUrl),
    fetchOrganizationEndorsements(endorsementsCsvUrl),
  ]);

  for (const organization of organizations) {
    await saveOrganizationProfile({ ...organization, approved: organization.approved }, db);
  }

  await importOrganizationComments(comments, db);
  await importOrganizationEndorsements(endorsements, db);

  return {
    organizations: organizations.length,
    comments: comments.length,
    endorsements: endorsements.length,
  };
}

export async function getPendingOrganizationEndorsements({
  db = organizationsDb(),
  limit = 50,
} = {}) {
  if (!db) return [];
  await ensureOrganizationTables(db);

  const result = await db
    .prepare(
      `SELECT *
       FROM organization_endorsements
       WHERE status = 'pending'
       ORDER BY created_at DESC, id DESC
       LIMIT ?`,
    )
    .bind(Number(limit) || 50)
    .all();

  return (result.results || []).map(normalizeEndorsementRow);
}

export async function saveOrganizationEndorsement(data = {}, {
  db = organizationsDb(),
  status = "published",
  source = "admin",
} = {}) {
  if (!db) throw new Error("D1 database binding is not configured.");
  await ensureOrganizationTables(db);

  const organizationName = cleanText(data.organizationName || data.organization || "");
  const candidateNameValue = cleanText(data.candidateName || "");
  if (!organizationName) throw new Error("Organization name is required.");
  if (!candidateNameValue) throw new Error("Candidate name is required.");

  const organizationSlug = slugify(data.organizationSlug || data.organization_slug || organizationName);
  const candidateSlugValue = String(data.candidateSlug || data.candidate_slug || "").trim();
  const candidateSlugKey = slugify(data.candidateSlugKey || data.candidate_slug_key || candidateSlugValue || candidateNameValue);
  if (!organizationSlug || !candidateSlugKey) {
    throw new Error("Organization and candidate identifiers are required.");
  }

  const result = await db
    .prepare(
      `INSERT INTO organization_endorsements (
         organization_slug, organization_name, organization_website,
         organization_email, candidate_name, candidate_slug, candidate_slug_key,
         office, district, election_year, position, statement, date, status,
         source, submitter_name, submitter_email, updated_at
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(organization_slug, candidate_slug_key, position, statement) DO UPDATE SET
         organization_name = excluded.organization_name,
         organization_website = excluded.organization_website,
         organization_email = excluded.organization_email,
         candidate_name = excluded.candidate_name,
         candidate_slug = excluded.candidate_slug,
         office = excluded.office,
         district = excluded.district,
         election_year = excluded.election_year,
         date = excluded.date,
         status = excluded.status,
         source = excluded.source,
         submitter_name = excluded.submitter_name,
         submitter_email = excluded.submitter_email,
         updated_at = CURRENT_TIMESTAMP`,
    )
    .bind(
      organizationSlug,
      organizationName,
      String(data.organizationWebsite || data.organization_website || "").trim(),
      String(data.organizationEmail || data.organization_email || "").trim(),
      candidateNameValue,
      candidateSlugValue,
      candidateSlugKey,
      cleanText(data.office || ""),
      cleanText(data.district || ""),
      cleanText(data.electionYear || data.election_year || ""),
      cleanText(data.position || "Endorsed"),
      cleanText(data.statement || ""),
      cleanText(data.date || ""),
      status,
      source,
      cleanText(data.submitterName || data.submitter_name || ""),
      String(data.submitterEmail || data.submitter_email || "").trim(),
    )
    .run();

  if (status === "published") {
    await ensureOrganizationProfileForEndorsement({
      organizationSlug,
      organizationName,
      website: data.organizationWebsite || data.organization_website,
      email: data.organizationEmail || data.organization_email,
      db,
    });
  }

  return {
    organizationSlug,
    candidateSlugKey,
    changed: result.meta?.changes ?? result.changes ?? 0,
  };
}

export async function saveOrganizationEndorsementSubmission(data = {}, options = {}) {
  return saveOrganizationEndorsement(data, {
    ...options,
    status: "pending",
    source: "community",
  });
}

export async function moderateOrganizationEndorsement(id, action, {
  db = organizationsDb(),
  reviewedBy = "",
} = {}) {
  if (!db) throw new Error("D1 database binding is not configured.");
  await ensureOrganizationTables(db);

  const endorsementId = Number(id);
  if (!endorsementId) throw new Error("Endorsement id is required.");
  if (!["approve", "reject"].includes(action)) {
    throw new Error("Choose approve or reject.");
  }

  const rowResult = await db
    .prepare(`SELECT * FROM organization_endorsements WHERE id = ?`)
    .bind(endorsementId)
    .first();
  if (!rowResult) throw new Error("No matching endorsement submission was found.");

  const status = action === "approve" ? "published" : "rejected";
  const result = await db
    .prepare(
      `UPDATE organization_endorsements
       SET status = ?,
           reviewed_by = ?,
           reviewed_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
    )
    .bind(status, cleanText(reviewedBy || ""), endorsementId)
    .run();

  if (status === "published") {
    await ensureOrganizationProfileForEndorsement({
      organizationSlug: rowResult.organization_slug,
      organizationName: rowResult.organization_name,
      website: rowResult.organization_website,
      email: rowResult.organization_email,
      db,
    });
  }

  return {
    status,
    changed: result.meta?.changes ?? result.changes ?? 0,
  };
}

async function getOrganizationComments(db) {
  const result = await db
    .prepare(
      `SELECT *
       FROM organization_comments
       WHERE status = 'published'
       ORDER BY date DESC, id DESC`,
    )
    .all();

  return (result.results || []).map(normalizeCommentRow);
}

async function getOrganizationEndorsements(db) {
  const result = await db
    .prepare(
      `SELECT *
       FROM organization_endorsements
       WHERE status = 'published'
       ORDER BY date DESC, id DESC`,
    )
    .all();

  return (result.results || []).map(normalizeEndorsementRow);
}

async function importOrganizationComments(comments = [], db) {
  for (const comment of comments) {
    await db
      .prepare(
        `INSERT INTO organization_comments (
           organization_slug, organization_name, bill, bill_label, position,
           issue_area, towns, comment, author, date, status, source, updated_at
         )
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published', 'google-sheet', CURRENT_TIMESTAMP)
         ON CONFLICT(organization_slug, bill, comment) DO UPDATE SET
           organization_name = excluded.organization_name,
           bill_label = excluded.bill_label,
           position = excluded.position,
           issue_area = excluded.issue_area,
           towns = excluded.towns,
           author = excluded.author,
           date = excluded.date,
           status = 'published',
           source = 'google-sheet',
           updated_at = CURRENT_TIMESTAMP`,
      )
      .bind(
        comment.organizationSlug,
        comment.organization,
        comment.bill,
        comment.billLabel,
        comment.position,
        (comment.issueAreas || []).join(", "),
        (comment.towns || []).join(", "),
        comment.comment,
        comment.author,
        comment.date,
      )
      .run();
  }
}

async function importOrganizationEndorsements(endorsements = [], db) {
  for (const endorsement of endorsements) {
    await db
      .prepare(
        `INSERT INTO organization_endorsements (
           organization_slug, organization_name, candidate_name, candidate_slug,
           candidate_slug_key, office, district, election_year, position,
           statement, date, status, source, updated_at
         )
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published', 'google-sheet', CURRENT_TIMESTAMP)
         ON CONFLICT(organization_slug, candidate_slug_key, position, statement) DO UPDATE SET
           organization_name = excluded.organization_name,
           candidate_name = excluded.candidate_name,
           candidate_slug = excluded.candidate_slug,
           office = excluded.office,
           district = excluded.district,
           election_year = excluded.election_year,
           date = excluded.date,
           status = 'published',
           source = 'google-sheet',
           updated_at = CURRENT_TIMESTAMP`,
      )
      .bind(
        endorsement.organizationSlug,
        endorsement.organization,
        endorsement.candidateName,
        endorsement.candidateSlug,
        endorsement.candidateSlugKey,
        endorsement.office,
        endorsement.district,
        endorsement.electionYear,
        endorsement.position,
        endorsement.statement,
        endorsement.date,
      )
      .run();
  }
}

async function fetchOrganizationProfiles(csvUrl) {
  const response = await fetch(csvUrl);
  if (!response.ok) throw new Error(`Unable to load organizations: ${response.status}`);
  return parseOrganizationProfiles(await response.text());
}

async function fetchOrganizationComments(csvUrl) {
  const response = await fetch(csvUrl);
  if (!response.ok) throw new Error(`Unable to load organization comments: ${response.status}`);
  return parseOrganizationComments(await response.text());
}

async function fetchOrganizationEndorsements(csvUrl) {
  const response = await fetch(csvUrl);
  if (!response.ok) throw new Error(`Unable to load organization endorsements: ${response.status}`);
  return parseOrganizationEndorsements(await response.text());
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
        logoUrl: row["Logo URL"] || "",
        bannerImageUrl: row["Banner Image URL"] || "",
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

function normalizeOrganizationRow(row = {}) {
  return {
    id: row.id,
    name: cleanText(row.name),
    slug: row.slug,
    type: cleanText(row.type),
    mission: cleanText(row.mission),
    shortDescription: cleanText(row.short_description),
    website: row.website || "",
    email: row.email || "",
    phone: row.phone || "",
    facebook: row.facebook || "",
    instagram: row.instagram || "",
    bluesky: row.bluesky || "",
    city: cleanText(row.city),
    town: cleanText(row.town),
    state: cleanText(row.state),
    serviceArea: cleanText(row.service_area),
    issueArea: cleanText(row.issue_area),
    logoUrl: organizationAssetUrl(row.logo_url || ""),
    bannerImageUrl: organizationAssetUrl(row.banner_image_url || ""),
    foundedYear: row.founded_year || "",
    approved: Number(row.approved) === 1,
    notes: cleanText(row.notes),
  };
}

function normalizeCommentRow(row = {}) {
  return {
    id: row.id,
    organization: cleanText(row.organization_name),
    organizationSlug: row.organization_slug,
    bill: normalizeBillCode(row.bill || ""),
    billLabel: cleanText(row.bill_label || row.bill || ""),
    position: cleanText(row.position),
    issueAreas: splitList(row.issue_area),
    towns: splitList(row.towns),
    comment: cleanText(row.comment),
    author: cleanText(row.author),
    date: cleanText(row.date),
  };
}

function normalizeEndorsementRow(row = {}) {
  return {
    id: row.id,
    organization: cleanText(row.organization_name),
    organizationSlug: row.organization_slug,
    organizationWebsite: row.organization_website || "",
    organizationEmail: row.organization_email || "",
    candidateName: cleanText(row.candidate_name),
    candidateSlug: row.candidate_slug,
    candidateSlugKey: row.candidate_slug_key || slugify(row.candidate_slug || row.candidate_name),
    office: cleanText(row.office),
    district: cleanText(row.district),
    electionYear: cleanText(row.election_year),
    position: cleanText(row.position),
    statement: cleanText(row.statement),
    date: cleanText(row.date),
    status: cleanText(row.status),
    submitterName: cleanText(row.submitter_name),
    submitterEmail: row.submitter_email || "",
    createdAt: row.created_at || "",
  };
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

function organizationAssetUrl(value = "") {
  const asset = String(value || "").trim();
  if (!asset) return "";
  if (/^https?:\/\//i.test(asset) || asset.startsWith("/api/organization-assets/")) return asset;
  return `/api/organization-assets/${asset
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/")}`;
}

async function ensureColumn(db, table, column, type) {
  const result = await db.prepare(`PRAGMA table_info(${table})`).all();
  const columns = new Set((result.results || []).map((row) => row.name));
  if (columns.has(column)) return;
  await db.prepare(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`).run();
}

async function ensureOrganizationProfileForEndorsement({
  organizationSlug,
  organizationName,
  website = "",
  email = "",
  db,
}) {
  if (!organizationName || !organizationSlug) return;
  const existing = await db
    .prepare(`SELECT slug FROM organizations WHERE slug = ?`)
    .bind(organizationSlug)
    .first();
  if (existing) return;

  await saveOrganizationProfile({
    name: organizationName,
    slug: organizationSlug,
    type: "Advocacy organization",
    website,
    email,
    approved: 1,
    source: "endorsement",
  }, db);
}

async function ensureOrganizationProfileForComment({
  organizationSlug,
  organizationName,
  db,
}) {
  if (!organizationName || !organizationSlug) return;
  const existing = await db
    .prepare(`SELECT slug FROM organizations WHERE slug = ?`)
    .bind(organizationSlug)
    .first();
  if (existing) return;

  await saveOrganizationProfile({
    name: organizationName,
    slug: organizationSlug,
    type: "Advocacy organization",
    approved: 1,
    source: "organization-comment",
  }, db);
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

function truthy(value) {
  return ["1", "true", "yes", "on"].includes(String(value || "").toLowerCase());
}
