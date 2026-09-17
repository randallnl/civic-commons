export const MAX_SITE_SEARCH_LENGTH = 120;

export function normalizeSiteSearchQuery(value = "") {
  return String(value).replace(/\s+/g, " ").trim();
}

export function billSearchQuery(query = "") {
  const normalized = normalizeSiteSearchQuery(query);
  const billNumber = normalized.match(/^(HB|SB|HCR|SCR|HR|SR)\s+(\d+[A-Z]?)$/i);
  return billNumber ? `${billNumber[1].toUpperCase()}${billNumber[2].toUpperCase()}` : normalized;
}

function searchKey(value = "") {
  return String(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function personRank(person, query) {
  const name = searchKey(person.name);
  const needle = searchKey(query);
  if (!needle) return 3;
  if (name === needle) return 0;
  if (name.startsWith(needle)) return 1;
  if (name.includes(needle) || searchKey(person.aliases).includes(needle)) return 2;
  return 3;
}

export function mergePeopleSearchResults(legislators = [], candidates = [], query = "") {
  const people = new Map();

  for (const person of legislators) {
    if (!person.slug) continue;
    const key = person.slug.toLowerCase();
    people.set(key, { ...person, isLegislator: true, isCandidate: false });
  }

  for (const person of candidates) {
    if (!person.slug) continue;
    const key = person.slug.toLowerCase();
    const existing = people.get(key);
    people.set(key, existing
      ? {
          ...existing,
          isCandidate: true,
          isFreeStateAligned: existing.isFreeStateAligned || person.isFreeStateAligned,
          isTpActionAligned: existing.isTpActionAligned || person.isTpActionAligned,
          photoUrl: existing.photoUrl || person.photoUrl,
          party: existing.party || person.party,
          candidateOffice: person.candidateOffice,
        }
      : { ...person, isLegislator: false, isCandidate: true });
  }

  return [...people.values()]
    .map((person, index) => ({ person, index }))
    .sort((left, right) => personRank(left.person, query) - personRank(right.person, query) || left.index - right.index)
    .map(({ person }) => person);
}
