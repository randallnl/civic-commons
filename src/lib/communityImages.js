const COUNTY_IMAGE_FILES = {
  belknap: "belmont nh.jpg",
  carroll: "north conway.jpg",
  cheshire: "keene.jpeg",
  coos: "berlin.webp",
  grafton: "bath nh.jpg",
  hillsborough: "manchester nh.webp",
  merrimack: "concord nh.webp",
  rockingham: "exeter nh.png",
  strafford: "rochester.jpg",
  sullivan: "claremont.webp",
};

export function countyImageUrl(county = "") {
  const filename = COUNTY_IMAGE_FILES[normalizeCounty(county)];
  if (!filename) return "";

  return `/api/organization-assets/${filename
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/")}`;
}

export function countyForCommunity(community = {}) {
  return firstCounty([
    community.county,
    community.countyName,
    community.county_name,
    community.county_slug,
    community.slug,
    community.label,
    ...(community.districts || []),
    ...(community.communities || []),
    ...(community.relatedDistricts || []),
    ...(community.representatives || []),
    ...(community.reps || []),
    ...(community.legislators || []),
  ]);
}

function firstCounty(values = []) {
  for (const value of values.flat()) {
    const county = extractCounty(value);
    if (county) return county;
  }

  return "";
}

function extractCounty(value = "") {
  if (!value) return "";

  if (typeof value === "object") {
    return firstCounty([
      value.county,
      value.countyName,
      value.county_name,
      value.county_slug,
      value.slug,
      value.label,
      value.district_label,
      value.districtLabel,
    ]);
  }

  const normalized = normalizeCounty(value);
  if (COUNTY_IMAGE_FILES[normalized]) return titleCounty(normalized);

  const match = String(value)
    .toLowerCase()
    .match(/(belknap|carroll|cheshire|coos|grafton|hillsborough|merrimack|rockingham|strafford|sullivan)/);

  return match ? titleCounty(match[1]) : "";
}

function normalizeCounty(value = "") {
  return String(value)
    .toLowerCase()
    .replace(/\bcounty\b/g, "")
    .replace(/[^a-z]+/g, " ")
    .trim()
    .split(/\s+/)[0] || "";
}

function titleCounty(value = "") {
  return `${value.slice(0, 1).toUpperCase()}${value.slice(1)}`;
}
