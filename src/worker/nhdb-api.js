const corsHeaders = {
  "Access-Control-Allow-Origin": "https://nhdeservesbetter.com",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-admin-secret",
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
    },
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    if (url.pathname === "/") {
      return json({
        name: "NH Deserves Better API",
        status: "ok",
        endpoints: [
          "/tools",
          "/reps/search?town=Manchester",
          "/reps/lookup",
          "/reps/lookup-address?address=82+Bobcat+Way+Manchester+NH",
          "/bills",
          "/events",
          "/admin/sync-legislator-photos",
        ],
      });
    }

    if (url.pathname === "/tools") {
      return json([
        {
          title: "My State Rep",
          description:
            "Find your representatives and understand how they are voting.",
          url: "/tools/my-state-rep",
          status: "active",
        },
        {
          title: "Bill Tracker",
          description: "Track key legislation, testimony, and vote history.",
          url: "/tools/bill-tracker",
          status: "planned",
        },
        {
          title: "Accountability Dashboard",
          description:
            "Explore voting records and public accountability data.",
          url: "/tools/accountability",
          status: "planned",
        },
      ]);
    }

    if (url.pathname === "/reps/search") {
      return handleTownSearch(request, env);
    }

    if (url.pathname === "/reps/lookup-address") {
      const address = url.searchParams.get("address");

      if (!address) {
        return json(
          {
            error: "Address query parameter is required.",
          },
          400
        );
      }

      const fakeRequest = new Request(request.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ address }),
      });

      return handleAddressLookup(fakeRequest, env);
    }

    if (url.pathname === "/reps/lookup") {
      return handleAddressLookup(request, env);
    }

    if (url.pathname === "/bills") {
      return json({
        message: "Bill tracker endpoint coming soon.",
      });
    }

    if (url.pathname === "/events") {
      return json({
        message: "Events endpoint coming soon.",
      });
    }

    if (url.pathname === "/admin/sync-legislator-photos") {
      return handlePhotoSync(request, env);
    }

    return json({ error: "Not found" }, 404);
  },
};

async function handleTownSearch(request, env) {
  const url = new URL(request.url);
  const town = url.searchParams.get("town");

  if (!town) {
    return json({ error: "Town is required." }, 400);
  }

  const reps = await env.DB.prepare(`
    SELECT
      r.personid AS id,
      r.employeeno,
      CASE r.legislativebody
        WHEN 'S' THEN 'Senate'
        WHEN 'H' THEN 'House'
        ELSE r.legislativebody
      END AS chamber,
      r.firstname || ' ' || r.lastname AS name,
      r.firstname,
      r.lastname,
      r.party,
      COALESCE(dm.district_label, r.district) AS district,
      r.district AS raw_district,
      r.countycode,
      COALESCE(dm.communities_represented, r.city, '') AS location_text,
      r.emailaddress AS email,
      '' AS phone,
      COALESCE(o.display_photo_url, p.photo_url, '') AS photo,
      o.notes
    FROM d1_legislators r
    LEFT JOIN override_representatives o
      ON o.representative_id = r.personid
    LEFT JOIN d1_legislator_photos p
      ON r.employeeno = p.employeeno
    LEFT JOIN d1_district_mapping dm
      ON (
        (
          r.legislativebody = 'H'
          AND dm.body = 'H'
          AND CAST(r.countycode AS INTEGER) = dm.county
          AND CAST(r.district AS INTEGER) = dm.district
        )
        OR
        (
          r.legislativebody = 'S'
          AND dm.body = 'S'
          AND CAST(r.district AS INTEGER) = dm.district
        )
      )
    WHERE LOWER(COALESCE(dm.communities_represented, r.city, '')) LIKE LOWER(?)
      AND r.active = 1
      AND COALESCE(o.is_hidden, 0) = 0
    ORDER BY
      CASE r.legislativebody
        WHEN 'S' THEN 1
        WHEN 'H' THEN 2
        ELSE 3
      END,
      r.lastname,
      r.firstname
  `)
    .bind(`%${town}%`)
    .all();

  return json({
    town,
    representatives: reps.results,
  });
}

async function handleAddressLookup(request, env) {
  try {
    if (request.method !== "POST") {
      return json({ error: "Method not allowed. Use POST." }, 405);
    }

    const body = await request.json();
    const address = String(body.address || "").trim();

    if (!address) {
      return json({ error: "Address is required." }, 400);
    }

    if (!env.CIVIC_API_KEY) {
      return json({ error: "Missing CIVIC_API_KEY secret." }, 500);
    }

    const civicData = await getCivicData(address, env.CIVIC_API_KEY);
    const parsed = parseCivicDivisions(civicData.divisions || {});

    const matchedDistricts = await findDistrictsFromPlace(
      env,
      parsed.place,
      parsed.ward
    );

    const houseDistricts = matchedDistricts.filter((d) => d.body === "H");

    const houseReps = await findHouseRepsFromDistrictMappings(
      env,
      houseDistricts
    );

    const senators = parsed.senate
      ? await findSenators(env, parsed.senate)
      : [];

    return json({
      address,
      normalizedInput: civicData.normalizedInput || null,
      civic: {
        house: parsed.house,
        senate: parsed.senate,
        place: parsed.place,
        ward: parsed.ward,
      },
      matchedDistricts,
      representatives: [...senators, ...houseReps],
      groups: {
        senate: senators,
        house: houseReps,
      },
    });
  } catch (error) {
    return json(
      {
        error: error.message || "Unable to look up representatives.",
      },
      500
    );
  }
}

async function getCivicData(address, apiKey) {
  const civicUrl =
    "https://civicinfo.googleapis.com/civicinfo/v2/divisionsByAddress?address=" +
    encodeURIComponent(address) +
    "&key=" +
    encodeURIComponent(apiKey);

  const response = await fetch(civicUrl);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || "Google Civic lookup failed.");
  }

  return data;
}

function parseCivicDivisions(divisions) {
  const entries = Object.entries(divisions || {});

  let house = null;
  let senate = null;
  let place = null;
  let ward = null;

  for (const [ocdId, info] of entries) {
    const name = info?.name || "";

    if (ocdId.includes("/sldl:")) {
      house = parseHouseDistrict(ocdId, name);
    }

    if (ocdId.includes("/sldu:")) {
      senate = parseSenateDistrict(ocdId, name);
    }

    if (ocdId.includes("/place:") && !place) {
      place = {
        ocdId,
        name: name.replace(/\s+(city|town)$/i, "").trim(),
      };
    }

    if (ocdId.includes("/ward:") && !ward) {
      const match =
        ocdId.match(/\/ward:(\d+)/i) ||
        name.match(/ward\s+(\d+)/i);

      ward = {
        ocdId,
        name,
        number: match ? Number(match[1]) : null,
      };
    }
  }

  return {
    house,
    senate,
    place,
    ward,
  };
}

function parseHouseDistrict(ocdId, name) {
  const raw = decodeURIComponent(
    (ocdId.match(/\/sldl:([^/]+)/i) || [])[1] || ""
  );

  const districtMatch = raw.match(/(\d+)$/);
  const district = districtMatch ? Number(districtMatch[1]) : null;

  const countyName = raw
    .replace(/[_-]?\d+$/g, "")
    .replace(/_/g, " ")
    .trim();

  const county = countyNameToNumber(countyName);

  return {
    ocdId,
    name,
    raw,
    body: "H",
    county,
    district,
    districtLabel: county
      ? `${countyCodeFromNumber(county)} ${district}`
      : String(district || ""),
  };
}

function parseSenateDistrict(ocdId, name) {
  const raw = decodeURIComponent(
    (ocdId.match(/\/sldu:([^/]+)/i) || [])[1] || ""
  );

  const districtMatch = raw.match(/(\d+)$/);
  const district = districtMatch ? Number(districtMatch[1]) : null;

  return {
    ocdId,
    name,
    raw,
    body: "S",
    county: null,
    district,
    districtLabel: String(district || ""),
  };
}

function countyNameToNumber(value) {
  const normalized = String(value || "")
    .toLowerCase()
    .replace(/county/g, "")
    .replace(/[^a-z]/g, "")
    .trim();

  const map = {
    belknap: 1,
    carroll: 2,
    cheshire: 3,
    coos: 4,
    grafton: 5,
    hillsborough: 6,
    merrimack: 7,
    rockingham: 8,
    strafford: 9,
    sullivan: 10,
  };

  return map[normalized] || null;
}

function countyCodeFromNumber(county) {
  const map = {
    1: "BEL",
    2: "CAR",
    3: "CHE",
    4: "COO",
    5: "GRA",
    6: "HIL",
    7: "MER",
    8: "ROC",
    9: "STR",
    10: "SUL",
  };

  return map[county] || "";
}

function normalizeCommunityText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\./g, "")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function findDistrictsFromPlace(env, place, ward) {
  const placeName = normalizeCommunityText(place?.name || "");
  const wardNumber = ward?.number ? String(ward.number).trim() : "";

  if (!placeName) return [];

  let result;

  if (wardNumber) {
    result = await env.DB.prepare(`
      SELECT
        body,
        county,
        district,
        district_label,
        communities_represented
      FROM d1_district_mapping
      WHERE LOWER(communities_represented) LIKE LOWER(?)
        AND (
          LOWER(communities_represented) LIKE LOWER(?)
          OR LOWER(communities_represented) LIKE LOWER(?)
          OR LOWER(communities_represented) LIKE LOWER(?)
          OR LOWER(communities_represented) LIKE LOWER(?)
        )
      ORDER BY
        CASE body
          WHEN 'S' THEN 1
          WHEN 'H' THEN 2
          ELSE 3
        END,
        county,
        district
    `)
      .bind(
        `%${placeName}%`,
        `%ward ${wardNumber}%`,
        `%wards ${wardNumber},%`,
        `%wards ${wardNumber} %`,
        `% ${wardNumber},%`
      )
      .all();
  } else {
    result = await env.DB.prepare(`
      SELECT
        body,
        county,
        district,
        district_label,
        communities_represented
      FROM d1_district_mapping
      WHERE LOWER(communities_represented) LIKE LOWER(?)
      ORDER BY
        CASE body
          WHEN 'S' THEN 1
          WHEN 'H' THEN 2
          ELSE 3
        END,
        county,
        district
    `)
      .bind(`%${placeName}%`)
      .all();
  }

  const seen = new Set();

  return result.results.filter((row) => {
    const key = `${row.body}_${row.county}_${row.district}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function findHouseRepsFromDistrictMappings(env, districts) {
  if (!districts.length) return [];

  const reps = [];

  for (const district of districts) {
    const result = await env.DB.prepare(`
      SELECT
        l.personid AS id,
        l.employeeno,
        'House' AS chamber,
        l.firstname || ' ' || l.lastname AS name,
        l.firstname,
        l.lastname,
        l.party,
        COALESCE(dm.district_label, l.district) AS district,
        l.district AS raw_district,
        l.countycode,
        COALESCE(dm.communities_represented, l.city, '') AS location_text,
        l.emailaddress AS email,
        '' AS phone,
        COALESCE(o.display_photo_url, p.photo_url, '') AS photo,
        o.notes
      FROM d1_legislators l
      LEFT JOIN d1_district_mapping dm
        ON dm.body = 'H'
        AND CAST(l.countycode AS INTEGER) = dm.county
        AND CAST(l.district AS INTEGER) = dm.district
      LEFT JOIN override_representatives o
        ON o.representative_id = l.personid
      LEFT JOIN d1_legislator_photos p
        ON p.employeeno = l.employeeno
      WHERE l.active = 1
        AND l.legislativebody = 'H'
        AND CAST(l.countycode AS INTEGER) = ?
        AND CAST(l.district AS INTEGER) = ?
        AND COALESCE(o.is_hidden, 0) = 0
      ORDER BY l.lastname, l.firstname
    `)
      .bind(district.county, district.district)
      .all();

    reps.push(...result.results);
  }

  return dedupeReps(reps);
}

async function findSenators(env, senate) {
  if (!senate || !senate.district) return [];

  const result = await env.DB.prepare(`
    SELECT
      l.personid AS id,
      l.employeeno,
      'Senate' AS chamber,
      l.firstname || ' ' || l.lastname AS name,
      l.firstname,
      l.lastname,
      l.party,
      COALESCE(dm.district_label, l.district) AS district,
      l.district AS raw_district,
      l.countycode,
      COALESCE(dm.communities_represented, l.city, '') AS location_text,
      l.emailaddress AS email,
      '' AS phone,
      COALESCE(o.display_photo_url, p.photo_url, '') AS photo,
      o.notes
    FROM d1_legislators l
    LEFT JOIN d1_district_mapping dm
      ON dm.body = 'S'
      AND CAST(l.district AS INTEGER) = dm.district
    LEFT JOIN override_representatives o
      ON o.representative_id = l.personid
    LEFT JOIN d1_legislator_photos p
      ON p.employeeno = l.employeeno
    WHERE l.active = 1
      AND l.legislativebody = 'S'
      AND CAST(l.district AS INTEGER) = ?
      AND COALESCE(o.is_hidden, 0) = 0
    ORDER BY l.lastname, l.firstname
  `)
    .bind(senate.district)
    .all();

  return dedupeReps(result.results);
}

function dedupeReps(reps) {
  const seen = new Set();

  return reps.filter((rep) => {
    const key = rep.id || rep.employeeno || rep.name;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function handlePhotoSync(request, env) {
  const secret = request.headers.get("x-admin-secret");

  if (!env.ADMIN_SECRET || secret !== env.ADMIN_SECRET) {
    return json({ error: "Unauthorized" }, 401);
  }

  if (!env.LEGISLATOR_PHOTOS) {
    return json({ error: "Missing LEGISLATOR_PHOTOS R2 binding." }, 500);
  }

  let cursor = undefined;
  let totalObjects = 0;
  let matched = 0;
  const skipped = [];

  do {
    const listed = await env.LEGISLATOR_PHOTOS.list({
      cursor,
      limit: 1000,
    });

    for (const object of listed.objects) {
      totalObjects++;

      const key = object.key;
      const filename = key.split("/").pop();

      const match = filename.match(/^(\d+)_/);

      if (!match) {
        skipped.push({
          key,
          reason: "Filename does not start with employeeno_",
        });
        continue;
      }

      const employeeno = Number(match[1]);

      const legislator = await env.DB.prepare(`
        SELECT
          personid,
          employeeno,
          firstname,
          lastname
        FROM d1_legislators
        WHERE employeeno = ?
        LIMIT 1
      `)
        .bind(employeeno)
        .first();

      if (!legislator) {
        skipped.push({
          key,
          employeeno,
          reason: "No matching legislator found",
        });
        continue;
      }

      const photoUrl = `https://photos.nhdeservesbetter.com/${encodeURI(key)}`;

      await env.DB.prepare(`
        INSERT OR REPLACE INTO d1_legislator_photos (
          employeeno,
          personid,
          firstname,
          lastname,
          filename,
          photo_url,
          source,
          updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `)
        .bind(
          legislator.employeeno,
          legislator.personid,
          legislator.firstname,
          legislator.lastname,
          filename,
          photoUrl,
          "r2_filename"
        )
        .run();

      matched++;
    }

    cursor = listed.truncated ? listed.cursor : undefined;
  } while (cursor);

  return json({
    status: "ok",
    totalObjects,
    matched,
    skippedCount: skipped.length,
    skipped: skipped.slice(0, 50),
  });
}
