export const prerender = false;

import { env } from "cloudflare:workers";
import { cleanText } from "../../../lib/text";

export async function GET({ url }) {
  const query = cleanText(url.searchParams.get("_mentionQuery") || url.searchParams.get("q") || "");
  const db = env.d1_db;

  if (!db) return htmlResponse("");
  if (query.length < 2) {
    return htmlResponse(`<p class="mention-empty">Type at least 2 letters after @.</p>`);
  }

  const like = `%${query.replace(/[%_]/g, "")}%`;
  const result = await db
    .prepare(
      `SELECT id, gc_personid, employeeno, filer_entity_number, slug,
              display_name, firstname, lastname, party,
              is_current_legislator, is_2026_candidate
       FROM d1_people
       WHERE (is_current_legislator = 1 OR is_2026_candidate = 1)
         AND (
           display_name LIKE ?
           OR firstname LIKE ?
           OR lastname LIKE ?
           OR (firstname || ' ' || lastname) LIKE ?
         )
       ORDER BY lastname COLLATE NOCASE, firstname COLLATE NOCASE, display_name COLLATE NOCASE
       LIMIT 8`,
    )
    .bind(like, like, like, like)
    .all();

  const people = result.results || [];
  if (!people.length) {
    return htmlResponse(`<p class="mention-empty">No matching people found.</p>`);
  }

  return htmlResponse(`
    <div class="mention-result-list" role="listbox" aria-label="Mention suggestions">
      ${people.map(renderPersonOption).join("")}
    </div>
  `);
}

function renderPersonOption(person = {}) {
  const name = cleanText(
    person.display_name ||
      [person.firstname, person.lastname].filter(Boolean).join(" "),
  );
  if (!name) return "";

  const roleLabels = [
    Number(person.is_current_legislator) === 1 && "Legislator",
    Number(person.is_2026_candidate) === 1 && "Candidate",
  ].filter(Boolean);
  const meta = [partyLabel(person.party), roleLabels.join(" · ")].filter(Boolean).join(" · ");

  return `
    <button
      class="mention-suggestion"
      type="button"
      role="option"
      data-mention="${escapeAttribute(`@${name}`)}"
    >
      <strong>${escapeHtml(name)}</strong>
      ${meta ? `<span>${escapeHtml(meta)}</span>` : ""}
    </button>
  `;
}

function partyLabel(value = "") {
  const party = String(value || "").trim().toUpperCase();
  if (["D", "R", "I"].includes(party)) return party;
  return cleanText(value);
}

function htmlResponse(body) {
  return new Response(body, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttribute(value = "") {
  return escapeHtml(value).replace(/`/g, "&#96;");
}
