export const WARD_COMMUNITY_COUNTS = new Map([
  ["berlin", 4],
  ["claremont", 3],
  ["concord", 10],
  ["dover", 6],
  ["franklin", 3],
  ["keene", 5],
  ["laconia", 6],
  ["lebanon", 3],
  ["manchester", 12],
  ["nashua", 9],
  ["portsmouth", 5],
  ["rochester", 6],
  ["somersworth", 5],
]);

export function normalizeWardNumber(value = "") {
  const match = String(value || "").match(/\d+/);
  return match ? String(Number(match[0])) : "";
}

export function normalizedTownName(value = "") {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\./g, "")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function wardOptionsFor(townName = "") {
  const count = WARD_COMMUNITY_COUNTS.get(normalizedTownName(townName)) || 0;
  return Array.from({ length: count }, (_, index) => String(index + 1));
}

export function selectedWardContext({ selectedWard = "", civicWard } = {}) {
  const selected = normalizeWardNumber(selectedWard);
  const detected = normalizeWardNumber(civicWard?.number ?? civicWard);
  const wardNumber = selected || detected;

  return {
    selectedWard: selected,
    detectedWard: detected,
    wardNumber,
    ward: wardNumber ? `Ward ${wardNumber}` : "",
  };
}

export function isHouseRecord(record = {}) {
  const body = String(record.body || record.legislativebody || "").trim().toLowerCase();
  if (body === "h" || body === "house") return true;
  return /representative|house/i.test(
    `${record.office || ""} ${record.officeType || ""} ${record.chamber || ""} ${record.legislativebody || ""}`,
  );
}

export function representsWard(record = {}, wardValue = "") {
  const wardNumber = normalizeWardNumber(wardValue);
  if (!wardNumber) return true;

  const text = recordSearchText(record);
  if (!/\bwards?\b/i.test(text)) return true;
  const directWard = new RegExp(`\\bward(?:s)?\\s*${escapeRegExp(wardNumber)}\\b`, "i");
  if (directWard.test(text)) return true;

  for (const match of text.matchAll(/\bwards?\s+((?:\d{1,2}\s*(?:,|&|and)\s*)+\d{1,2})/gi)) {
    const listedWards = match[1].match(/\d+/g) || [];
    if (listedWards.some((listedWard) => Number(listedWard) === Number(wardNumber))) return true;
  }

  for (const match of text.matchAll(/\bwards?\s+(\d{1,2})\s*(?:-|\u2013|\u2014|to|through)\s*(\d{1,2})\b/gi)) {
    const start = Number(match[1]);
    const end = Number(match[2]);
    const selected = Number(wardNumber);
    if (selected >= Math.min(start, end) && selected <= Math.max(start, end)) return true;
  }

  return false;
}

export function filterLegislativeRecordsByWard(items = [], ward = "") {
  const wardNumber = normalizeWardNumber(ward);
  if (!wardNumber) return items;

  return items.filter((record) =>
    !isHouseRecord(record) || representsWard(record, wardNumber)
  );
}

export function recordSearchText(record = {}) {
  return [
    record.location_text,
    record.locationText,
    record.towns_represented,
    record.townsRepresented,
    record.communities_represented,
    record.communitiesRepresented,
    record.towns,
    record.town,
    record.city,
    record.district_label,
    record.districtLabel,
    record.name,
    record.office,
    record.district,
    record.raw_district,
  ].flatMap(stringifyLegislativeValue).filter(Boolean).join(" ");
}

export function stringifyLegislativeValue(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.flatMap(stringifyLegislativeValue);
  if (typeof value === "object") {
    return [
      value.town,
      value.name,
      value.label,
      value.location_text,
      value.locationText,
    ].flatMap(stringifyLegislativeValue);
  }
  return [String(value)];
}

export function representedTownsFromValue(value = []) {
  if (Array.isArray(value)) {
    return value
      .map((item) =>
        typeof item === "object" && item !== null
          ? item.town || item.name || item.label
          : item,
      )
      .map(normalizeTownOption)
      .filter(Boolean);
  }

  return String(value || "")
    .split(/[,;|]/)
    .map(normalizeTownOption)
    .filter(Boolean);
}

export function filterLegislativeRecordsByTown(items = [], townName = "") {
  const normalizedTown = normalizedTownName(normalizeTownOption(townName));
  if (!normalizedTown) return items;

  return items.filter((record) =>
    [
      record.townsRepresented,
      record.towns_represented,
      record.communitiesRepresented,
      record.communities_represented,
      record.locationText,
      record.location_text,
      record.towns,
      record.town,
    ]
      .flatMap(representedTownsFromValue)
      .some((representedTown) =>
        normalizedTownName(normalizeTownOption(representedTown)) === normalizedTown
      )
  );
}

export function normalizeTownOption(value = "") {
  return String(value || "")
    .replace(/\s*-?\s*Wards?\s+.*$/i, "")
    .trim();
}

function escapeRegExp(value = "") {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
