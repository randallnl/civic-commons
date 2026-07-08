export const prerender = false;

import { env } from "cloudflare:workers";

const MONDAY_API_URL = "https://api.monday.com/v2";
const BOARD_ID = "18420986061";
const SUGGESTED_EDIT_COLUMN = "long_text088pmpcx";
const URL_COLUMN = "text_mm52ze2n";

export async function POST({ request }) {
  let submittedPageUrl = "";

  try {
    const form = await request.formData();
    const pageUrl = String(form.get("pageUrl") || "").trim();
    const suggestion = String(form.get("suggestion") || "").trim();
    const contact = String(form.get("contact") || "").trim();
    submittedPageUrl = pageUrl;

    if (!pageUrl || !suggestion) {
      return redirectToForm(pageUrl, "Page and suggested update are required.");
    }

    const token =
      env.MONDAY_API_KEY ||
      env.MONDAY_TOKEN ||
      import.meta.env.MONDAY_API_KEY ||
      import.meta.env.MONDAY_TOKEN ||
      "";

    if (!token) {
      return redirectToForm(pageUrl, "Monday.com is not configured yet.");
    }

    const suggestedEdit = [
      suggestion,
      contact && `\n\nContact: ${contact}`,
    ].filter(Boolean).join("");

    await createMondayItem({
      token,
      pageUrl,
      suggestedEdit,
    });

    return Response.redirect(
      new URL(`/suggest-update?submitted=1&page=${encodeURIComponent(pageUrl)}`, request.url),
      303,
    );
  } catch (error) {
    const message = error?.message || "Unable to send suggestion.";
    return redirectToForm(submittedPageUrl, message, request.url);
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

async function createMondayItem({ token, pageUrl, suggestedEdit }) {
  const mutation = `
    mutation CreateSuggestedUpdate($boardId: ID!, $itemName: String!, $columnValues: JSON!) {
      create_item(board_id: $boardId, item_name: $itemName, column_values: $columnValues) {
        id
      }
    }
  `;
  const columnValues = JSON.stringify({
    [SUGGESTED_EDIT_COLUMN]: { text: suggestedEdit },
    [URL_COLUMN]: pageUrl,
  });

  const response = await fetch(MONDAY_API_URL, {
    method: "POST",
    headers: {
      Authorization: token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: mutation,
      variables: {
        boardId: BOARD_ID,
        itemName: itemNameFor(pageUrl),
        columnValues,
      },
    }),
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.errors?.length) {
    throw new Error(data.errors?.[0]?.message || "Monday.com rejected the suggestion.");
  }

  return data.data?.create_item;
}

function itemNameFor(pageUrl = "") {
  try {
    const url = new URL(pageUrl);
    return `Suggested update: ${url.pathname || "/"}`;
  } catch {
    return "Suggested update";
  }
}

function redirectToForm(pageUrl = "", message = "", requestUrl = "http://localhost/suggest-update") {
  const params = new URLSearchParams();
  if (pageUrl) params.set("page", pageUrl);
  if (message) params.set("error", message);

  return Response.redirect(new URL(`/suggest-update?${params}`, requestUrl), 303);
}
