const MOJIBAKE_REPLACEMENTS = [
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
