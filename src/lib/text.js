const MOJIBAKE_REPLACEMENTS = [
  [/\u00c2\u00b7/g, " - "],
  [/\u00c2/g, ""],
  [/\u00e2\u20ac\u2122/g, "'"],
  [/\u00e2\u20ac\u02dc/g, "'"],
  [/\u00e2\u20ac\u0153/g, '"'],
  [/\u00e2\u20ac\u009d/g, '"'],
  [/\u00e2\u20ac\u201c/g, "-"],
  [/\u00e2\u20ac\u201d/g, "-"],
  [/\u00e2\u20ac\u00a6/g, "..."],
  [/Â·/g, " - "],
  [/Â/g, ""],
  [/â€™/g, "'"],
  [/â€˜/g, "'"],
  [/â€œ/g, '"'],
  [/â€/g, '"'],
  [/â€“/g, "-"],
  [/â€”/g, "-"],
  [/â€¦/g, "..."],
];

export function cleanText(value = "") {
  let text = String(value || "");

  for (const [pattern, replacement] of MOJIBAKE_REPLACEMENTS) {
    text = text.replace(pattern, replacement);
  }

  return text;
}

export function joinClean(parts = [], separator = " - ") {
  return parts
    .map(cleanText)
    .map((part) => part.trim())
    .filter(Boolean)
    .join(separator);
}
