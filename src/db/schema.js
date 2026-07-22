import { sql } from "drizzle-orm";
import {
  index,
  integer,
  primaryKey,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const people = sqliteTable(
  "d1_people",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    gcPersonid: integer("gc_personid"),
    employeeNo: integer("employeeno"),
    filerEntityNumber: text("filer_entity_number"),
    firstName: text("firstname"),
    lastName: text("lastname"),
    middleName: text("middlename"),
    displayName: text("display_name").notNull(),
    slug: text("slug").notNull(),
    party: text("party"),
    email: text("email"),
    phone: text("phone"),
    websiteUrl: text("website_url"),
    photoUrl: text("photo_url"),
    isCurrentLegislator: integer("is_current_legislator").notNull().default(0),
    is2026Legislator: integer("is_2026_legislator").notNull().default(0),
    is2026Candidate: integer("is_2026_candidate").notNull().default(0),
    isFreeStater: integer("is_free_stater").notNull().default(0),
    source: text("source").notNull().default("runtime"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    slugIdx: uniqueIndex("idx_d1_people_slug").on(table.slug),
    gcPersonIdx: uniqueIndex("idx_d1_people_gc_personid").on(table.gcPersonid),
    employeeIdx: uniqueIndex("idx_d1_people_employeeno").on(table.employeeNo),
    filerIdx: uniqueIndex("idx_d1_people_filer_entity_number").on(table.filerEntityNumber),
    nameIdx: index("idx_d1_people_name").on(table.lastName, table.firstName),
    candidateIdx: index("idx_d1_people_candidate").on(table.is2026Candidate, table.filerEntityNumber),
    legislatorIdx: index("idx_d1_people_legislator").on(table.isCurrentLegislator, table.gcPersonid),
  }),
);

export const personLegislatorRoles = sqliteTable(
  "d1_person_legislator_roles",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    personId: integer("person_id").notNull(),
    gcPersonid: integer("gc_personid"),
    employeeNo: integer("employeeno"),
    legislativeBody: text("legislativebody"),
    countyCode: text("countycode"),
    district: text("district"),
    seatNo: text("seatno"),
    townsRepresented: text("towns_represented"),
    active: integer("active").notNull().default(1),
    sessionYear: integer("session_year").notNull().default(2026),
    source: text("source").notNull().default("d1_legislators"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    personRoleIdx: uniqueIndex("idx_d1_person_legislator_roles_unique").on(
      table.personId,
      table.legislativeBody,
      table.countyCode,
      table.district,
      table.sessionYear,
    ),
  }),
);

export const personCandidateRoles = sqliteTable(
  "d1_person_candidate_roles",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    personId: integer("person_id").notNull(),
    filerEntityNumber: text("filer_entity_number").notNull(),
    officeType: text("office_type"),
    office: text("office"),
    county: text("county"),
    district: text("district"),
    politicalParty: text("political_party"),
    electionYear: integer("election_year").notNull().default(2026),
    electionCycle: text("election_cycle"),
    totalRaised: real("total_raised"),
    totalSpent: real("total_spent"),
    status: text("status").notNull().default("active"),
    source: text("source").notNull().default("candidates"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    filerYearIdx: uniqueIndex("idx_d1_person_candidate_roles_unique").on(
      table.filerEntityNumber,
      table.electionYear,
    ),
    personIdx: index("idx_d1_person_candidate_roles_person").on(table.personId),
  }),
);

export const articlePeople = sqliteTable(
  "d1_article_people",
  {
    articleId: integer("article_id").notNull(),
    personId: integer("person_id").notNull(),
    relationType: text("relation_type").notNull().default("mentioned"),
    source: text("source").notNull().default("runtime"),
    rawName: text("raw_name"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.articleId, table.personId, table.relationType] }),
    personIdx: index("idx_d1_article_people_person").on(table.personId),
  }),
);

export const organizations = sqliteTable("organizations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  type: text("type"),
  mission: text("mission"),
  shortDescription: text("short_description"),
  website: text("website"),
  email: text("email"),
  phone: text("phone"),
  facebook: text("facebook"),
  instagram: text("instagram"),
  bluesky: text("bluesky"),
  city: text("city"),
  town: text("town"),
  state: text("state"),
  serviceArea: text("service_area"),
  issueArea: text("issue_area"),
  logoUrl: text("logo_url"),
  bannerImageUrl: text("banner_image_url"),
  foundedYear: text("founded_year"),
  approved: integer("approved").notNull().default(1),
  notes: text("notes"),
  source: text("source").notNull().default("admin"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const organizationComments = sqliteTable(
  "organization_comments",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    organizationSlug: text("organization_slug").notNull(),
    organizationName: text("organization_name").notNull(),
    bill: text("bill"),
    billLabel: text("bill_label"),
    position: text("position"),
    issueArea: text("issue_area"),
    towns: text("towns"),
    comment: text("comment").notNull(),
    author: text("author"),
    date: text("date"),
    linkUrl: text("link_url"),
    linkLabel: text("link_label"),
    photoUrl: text("photo_url"),
    status: text("status").notNull().default("published"),
    source: text("source").notNull().default("admin"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    uniqueCommentIdx: uniqueIndex("idx_organization_comments_unique").on(
      table.organizationSlug,
      table.bill,
      table.comment,
    ),
  }),
);

export const organizationEndorsements = sqliteTable(
  "organization_endorsements",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    organizationSlug: text("organization_slug").notNull(),
    organizationName: text("organization_name").notNull(),
    organizationWebsite: text("organization_website"),
    organizationEmail: text("organization_email"),
    candidateName: text("candidate_name").notNull(),
    candidateSlug: text("candidate_slug"),
    candidateSlugKey: text("candidate_slug_key").notNull(),
    office: text("office"),
    district: text("district"),
    electionYear: text("election_year"),
    position: text("position"),
    statement: text("statement"),
    date: text("date"),
    status: text("status").notNull().default("published"),
    source: text("source").notNull().default("admin"),
    submitterName: text("submitter_name"),
    submitterEmail: text("submitter_email"),
    reviewedBy: text("reviewed_by"),
    reviewedAt: text("reviewed_at"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    uniqueEndorsementIdx: uniqueIndex("idx_organization_endorsements_unique").on(
      table.organizationSlug,
      table.candidateSlugKey,
      table.position,
      table.statement,
    ),
  }),
);

export const communityUpdates = sqliteTable(
  "community_updates",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    entityType: text("entity_type").notNull(),
    entityKey: text("entity_key").notNull(),
    entityName: text("entity_name"),
    pageUrl: text("page_url"),
    displayName: text("display_name"),
    email: text("email"),
    comment: text("comment"),
    linkUrl: text("link_url"),
    photoUrl: text("photo_url"),
    status: text("status").notNull().default("pending"),
    reviewedBy: text("reviewed_by"),
    reviewedAt: text("reviewed_at"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    entityStatusIdx: index("idx_community_updates_entity_status").on(
      table.entityType,
      table.entityKey,
      table.status,
      table.createdAt,
    ),
  }),
);

export const communityUpdateMentions = sqliteTable(
  "community_update_mentions",
  {
    updateId: integer("update_id").notNull(),
    personid: integer("personid").notNull(),
    employeeNo: integer("employeeno"),
    name: text("name").notNull(),
    chamber: text("chamber"),
    party: text("party"),
    district: text("district"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.updateId, table.personid] }),
    updateIdx: index("idx_community_update_mentions_update").on(table.updateId),
  }),
);

export const articleSubmissions = sqliteTable(
  "article_submissions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    url: text("url").notNull(),
    title: text("title"),
    summary: text("summary"),
    publisher: text("publisher"),
    submitterName: text("submitter_name"),
    submitterEmail: text("submitter_email"),
    note: text("note"),
    status: text("status").notNull().default("pending"),
    articleId: text("article_id"),
    previewJson: text("preview_json"),
    scanJson: text("scan_json"),
    reviewedBy: text("reviewed_by"),
    reviewedAt: text("reviewed_at"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    statusCreatedIdx: index("idx_article_submissions_status_created").on(
      table.status,
      table.createdAt,
    ),
  }),
);

export const billOverrides = sqliteTable(
  "d1_bill_overrides",
  {
    sessionYear: integer("sessionyear").notNull(),
    condensedBillNo: text("condensedbillno").notNull(),
    title: text("title"),
    summary: text("summary"),
    description: text("description"),
    updatedBy: text("updated_by"),
    updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.sessionYear, table.condensedBillNo] }),
  }),
);

export const adminMagicLinks = sqliteTable("admin_magic_links", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull(),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: text("expires_at").notNull(),
  usedAt: text("used_at"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const adminSessions = sqliteTable("admin_sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull(),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: text("expires_at").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
