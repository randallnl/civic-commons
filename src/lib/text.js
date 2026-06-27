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

const WINDOWS_1252_BYTES = new Map([
  ["€", 0x80],
  ["‚", 0x82],
  ["ƒ", 0x83],
  ["„", 0x84],
  ["…", 0x85],
  ["†", 0x86],
  ["‡", 0x87],
  ["ˆ", 0x88],
  ["‰", 0x89],
  ["Š", 0x8a],
  ["‹", 0x8b],
  ["Œ", 0x8c],
  ["Ž", 0x8e],
  ["‘", 0x91],
  ["’", 0x92],
  ["“", 0x93],
  ["”", 0x94],
  ["•", 0x95],
  ["–", 0x96],
  ["—", 0x97],
  ["˜", 0x98],
  ["™", 0x99],
  ["š", 0x9a],
  ["›", 0x9b],
  ["œ", 0x9c],
  ["ž", 0x9e],
  ["Ÿ", 0x9f],
]);

const UTF8_DECODER = new TextDecoder("utf-8", { fatal: false });
const MOJIBAKE_MARKERS = /[ÂÃâ]/;

export function cleanText(value = "") {
  let text = String(value || "");
  text = decodeMojibake(text);

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

function decodeMojibake(text = "") {
  if (!MOJIBAKE_MARKERS.test(text)) return text;

  const bytes = [];
  for (const character of text) {
    const code = character.codePointAt(0);
    if (WINDOWS_1252_BYTES.has(character)) {
      bytes.push(WINDOWS_1252_BYTES.get(character));
    } else if (code <= 0xff) {
      bytes.push(code);
    } else {
      return text;
    }
  }

  const decoded = UTF8_DECODER.decode(new Uint8Array(bytes));
  if (!decoded || decoded.includes("�")) return text;

  return mojibakeScore(decoded) < mojibakeScore(text) ? decoded : text;
}

function mojibakeScore(text = "") {
  return (text.match(/[ÂÃâ]/g) || []).length;
}
