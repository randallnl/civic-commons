export const prerender = false;

const API_BASE =
  import.meta.env.REP_LOOKUP_API_BASE ||
  "https://api.nhciviccommons.com";

export async function POST({ request }) {
  try {
    const body = await request.json();
    const address = String(body.address || "").trim();

    if (!address) {
      return json({ error: "Address is required." }, 400);
    }

    const response = await fetch(`${API_BASE}/reps/lookup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ address }),
    });

    const data = await response.json();

    return json(data, response.status);
  } catch (error) {
    return json(
      {
        error: error?.message || "Unable to look up representatives.",
      },
      500
    );
  }
}

export function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      Allow: "POST, OPTIONS",
    },
  });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}
