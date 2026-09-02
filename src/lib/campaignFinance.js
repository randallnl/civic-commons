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
