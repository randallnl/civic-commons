import { env } from "cloudflare:workers";
import { getRepresentative, getRepresentatives } from "./repsApi";

let spotlightLegislatorsCache = null;

export function spotlightTrackerCsvUrl(csvUrl = "") {
  const value =
    csvUrl ||
    env.SPOTLIGHT_TRACKER ||
    import.meta.env.SPOTLIGHT_TRACKER ||
    import.meta.env.SPOTLIGHT_TRACKER_CSV_URL ||
    "";

  return toCsvUrl(value, "legislators");
}

export async function getSpotlightLegislators({ csvUrl = "", limit = 8 } = {}) {
  const resolvedCsvUrl = spotlightTrackerCsvUrl(csvUrl);
  if (!resolvedCsvUrl) return [];
  if (spotlightLegislatorsCache?.url === resolvedCsvUrl) {
    return spotlightLegislatorsCache.legislators.slice(0, limit);
  }

  const response = await fetch(resolvedCsvUrl);
  if (!response.ok) {
    throw new Error(`Unable to load spotlight tracker: ${response.status}`);
  }

  const rows = rowsFromCsv(await response.text());
  const spotlightRows = rows
    .map((row) => ({
      personid: row.personid || row.PersonID || row.PersonId || row["Person ID"] || "",
      name: row.name || row.Name || "",
    }))
    .filter((row) => row.personid || row.name);

  const legislators = (
    await Promise.all(
      spotlightRows.map(async (row) => {
        try {
          if (row.personid) {
            const data = await getRepresentative(row.personid);
            return data.representative || data.person || data;
          }

          const data = await getRepresentatives({ q: row.name, limit: 1 });
          return data.representatives?.[0] || null;
        } catch (error) {
          console.warn(`Unable to load spotlight legislator: ${row.personid || row.name}`, error?.message || error);
          return null;
        }
      }),
    )
  ).filter(Boolean);

  spotlightLegislatorsCache = { url: resolvedCsvUrl, legislators };
  return legislators.slice(0, limit);
}

function toCsvUrl(value = "", sheetName = "") {
  const url = String(value || "").trim();
  if (!url) return "";
  if (/output=csv/i.test(url) || /tqx=out:csv/i.test(url)) return url;

  if (/\/spreadsheets\/d\/e\/[^/]+\/pubhtml/i.test(url)) {
    return url.replace(/\/pubhtml(?:\?.*)?$/i, "/pub?output=csv");
  }

  if (/\/spreadsheets\/d\/e\/[^/]+\/pub/i.test(url)) {
    const parsedUrl = new URL(url);
    parsedUrl.searchParams.set("output", "csv");
    return parsedUrl.toString();
  }

  const spreadsheetId = url.match(/\/spreadsheets\/d\/([^/]+)/)?.[1];
  if (spreadsheetId) {
    const params = new URLSearchParams({
      tqx: "out:csv",
    });
    if (sheetName) params.set("sheet", sheetName);
    return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?${params}`;
  }

  return url;
}

function rowsFromCsv(csv) {
  const rows = parseCsv(csv);
  const [headers = [], ...records] = rows;
  const keys = headers.map((header) => String(header).trim());

  return records.map((record) =>
    Object.fromEntries(keys.map((key, index) => [key, record[index] || ""])),
  );
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
