import { env } from "cloudflare:workers";
import { cleanText } from "./text";

const EMPTY_FINANCE = {
  contributors: [],
  itemizedTotal: 0,
};

export async function getCandidateCampaignFinance({
  filerEntityNumber = "",
  electionYear = 2026,
} = {}) {
  const db = env.d1_db;
  const filerKey = String(filerEntityNumber || "").trim();
  const year = Number(electionYear) || 2026;
  if (!db || !filerKey) return EMPTY_FINANCE;

  try {
    const result = await db
      .prepare(
        `SELECT
           MIN(TRIM(contributor_name)) AS contributor_name,
           SUM(COALESCE(amount, 0)) AS total_amount,
           COUNT(*) AS contribution_count,
           MAX(contribution_date) AS latest_contribution_date,
           MAX(NULLIF(TRIM(contributor_city), '')) AS contributor_city,
           MAX(NULLIF(TRIM(contributor_state), '')) AS contributor_state
         FROM d1_candidate_contributions
         WHERE filer_entity_number = ?
           AND election_year = ?
           AND TRIM(COALESCE(contributor_name, '')) <> ''
         GROUP BY LOWER(TRIM(contributor_name))
         ORDER BY total_amount DESC, contributor_name COLLATE NOCASE`,
      )
      .bind(filerKey, year)
      .all();

    const contributors = (result.results || []).map((row) => ({
      name: cleanText(row.contributor_name),
      amount: Number(row.total_amount) || 0,
      contributionCount: Number(row.contribution_count) || 0,
      latestContributionDate: row.latest_contribution_date || "",
      city: cleanText(row.contributor_city),
      state: cleanText(row.contributor_state),
    }));

    return {
      contributors,
      itemizedTotal: contributors.reduce((total, contributor) => total + contributor.amount, 0),
    };
  } catch (error) {
    if (!String(error?.message || "").includes("no such table")) throw error;
    return EMPTY_FINANCE;
  }
}

export function contributorFinancePath(contributorName = "", electionYear = 2026) {
  const params = new URLSearchParams();
  params.set("name", cleanText(contributorName));
  params.set("year", String(Number(electionYear) || 2026));
  return `/campaign-finance/contributors?${params.toString()}`;
}

export async function getContributorCampaignFinance({
  contributorName = "",
  electionYear = 2026,
} = {}) {
  const db = env.d1_db;
  const name = cleanText(contributorName);
  const year = Number(electionYear) || 2026;
  if (!db || !name) {
    return { contributorName: name, electionYear: year, recipients: [], totalAmount: 0 };
  }

  try {
    const result = await db
      .prepare(
        `SELECT
           cc.person_id,
           MIN(TRIM(cc.contributor_name)) AS contributor_name,
           SUM(COALESCE(cc.amount, 0)) AS total_amount,
           MAX(cc.contribution_date) AS latest_contribution_date,
           p.display_name AS candidate_name,
           p.slug AS candidate_slug,
           cr.office,
           cr.county,
           cr.district,
           cr.political_party,
           cr.status
         FROM d1_candidate_contributions cc
         JOIN d1_people p ON p.id = cc.person_id
         LEFT JOIN d1_person_candidate_roles cr
           ON cr.person_id = cc.person_id
          AND cr.filer_entity_number = cc.filer_entity_number
          AND cr.election_year = cc.election_year
         WHERE LOWER(TRIM(cc.contributor_name)) = LOWER(TRIM(?))
           AND cc.election_year = ?
         GROUP BY
           cc.person_id,
           cc.filer_entity_number,
           p.display_name,
           p.slug,
           cr.office,
           cr.county,
           cr.district,
           cr.political_party,
           cr.status
         ORDER BY total_amount DESC, candidate_name COLLATE NOCASE`,
      )
      .bind(name, year)
      .all();

    const recipients = (result.results || []).map((row) => ({
      personId: Number(row.person_id) || 0,
      name: cleanText(row.candidate_name),
      slug: cleanText(row.candidate_slug),
      amount: Number(row.total_amount) || 0,
      latestContributionDate: row.latest_contribution_date || "",
      office: cleanText(row.office),
      county: cleanText(row.county),
      district: cleanText(row.district),
      party: cleanText(row.political_party),
      status: cleanText(row.status),
    }));

    return {
      contributorName: cleanText(result.results?.[0]?.contributor_name) || name,
      electionYear: year,
      recipients,
      totalAmount: recipients.reduce((total, recipient) => total + recipient.amount, 0),
    };
  } catch (error) {
    if (!String(error?.message || "").includes("no such table")) throw error;
    return { contributorName: name, electionYear: year, recipients: [], totalAmount: 0 };
  }
}
