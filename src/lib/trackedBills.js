const DEFAULT_TRACKED_BILLS_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vTHKkGGONM78RXb63Igvi2BXipOA4pV4X5CBY6yHaVAizO-l0q_WtU8uyXI-vhxxbKEib9nFlL1nIBz/pub?gid=1337871563&single=true&output=csv";

let trackedBillsCache = null;

export function normalizeBillCode(value = "") {
  return String(value).toUpperCase().replace(/\s+/g, "");
}

export async function getTrackedBills(csvUrl = DEFAULT_TRACKED_BILLS_CSV_URL) {
  if (trackedBillsCache) return trackedBillsCache;

  const response = await fetch(csvUrl);

  if (!response.ok) {
    throw new Error(`Unable to load tracked bills: ${response.status}`);
  }

  trackedBillsCache = parseTrackedBillsCsv(await response.text());
  return trackedBillsCache;
}

function parseTrackedBillsCsv(csv) {
  const rows = parseCsv(csv);
  const [headers = [], ...records] = rows;
  const columnIndex = Object.fromEntries(
    headers.map((header, index) => [header.trim(), index]),
  );
  const codeIndex = columnIndex.Code;
  const bills = new Map();

  if (codeIndex === undefined) return bills;

  for (const record of records) {
    const code = normalizeBillCode(record[codeIndex]);

    if (!code) continue;

    bills.set(code, {
      code,
      name: record[columnIndex.Name] || "",
      summary: record[columnIndex.Summary] || "",
      impact: record[columnIndex.Impact] || "",
      moreInfoUrl: record[columnIndex.MoreInfoURL] || "",
      issueArea: record[columnIndex["Issue Area"]] || "",
    });
  }

  return bills;
}

function parseCsv(csv) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let index = 0; index < csv.length; index += 1) {
    const char = csv[index];
    const nextChar = csv[index + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        field += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(field);
      field = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") index += 1;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      continue;
    }

    field += char;
  }

  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((csvRow) =>
    csvRow.some((value) => String(value).trim().length > 0),
  );
}
