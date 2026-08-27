# Partner legislator widget guide

This guide explains how a partner can publish the **Find your New Hampshire legislators** widget, maintain the bill tracker that powers it, and choose which optional features appear.

## What the widget does

Visitors enter a New Hampshire address. The widget identifies their State Senator and State House representatives, then shows only the votes that are relevant to the partner's published bill tracker.

The embedded experience is headerless: it does not show Civic Commons navigation or a footer. It includes:

- Address lookup and district results
- A compact **Who represents you** selector after a successful lookup
- Legislator cards with party, chamber, district, contact information, alignment percentage, and a preview of tracked votes
- Expandable tracked-vote records
- Bill-detail popups with the organization's recommendation and vote explanation
- A shareable selected-legislator state

## Install the widget

Replace `PARTNER_KEY` with the partner's D1 `partner_key` (for example, `able-nh`). Add this HTML to the partner's page:

```html
<iframe
  id="nhcc-my-state-rep"
  data-src="https://nhciviccommons.com/my-state-rep?embed=1&partner=PARTNER_KEY"
  title="Find your New Hampshire legislators"
  width="100%"
  height="1"
  frameborder="0"
  style="border:0; display:block; overflow:hidden;"
></iframe>

<script>
(() => {
  const frame = document.getElementById("nhcc-my-state-rep");
  const widgetUrl = new URL(frame.dataset.src);
  const pageUrl = new URL(window.location.href);
  const selected = pageUrl.searchParams.get("legislator");

  // Restore a legislator selected from a copied partner-page URL.
  if (selected) widgetUrl.searchParams.set("open", selected);
  frame.src = widgetUrl.toString();

  window.addEventListener("message", (event) => {
    if (event.origin !== "https://nhciviccommons.com") return;
    if (event.source !== frame.contentWindow) return;

    if (event.data?.type === "nhcc:my-state-rep:height") {
      frame.style.height = `${Math.max(1, Number(event.data.height) || 1)}px`;
    }

    if (event.data?.type === "nhcc:my-state-rep:url") {
      const url = new URL(window.location.href);
      if (event.data.open) url.searchParams.set("legislator", event.data.open);
      else url.searchParams.delete("legislator");
      window.history.replaceState({}, "", url);
    }
  });
})();
</script>
```

The script automatically resizes the iframe as cards expand or close. It also changes the **partner page's** URL when a visitor opens a legislator card. A copied URL, such as `?legislator=mark-mclean`, reopens that card when shared.

## How the bill tracker is used

Each active partner has one `tracker_url` in the `partner_trackers` D1 table. It must be a publicly readable CSV URL, commonly the published CSV link from a Google Sheet.

The widget reads the partner's tracker during an address lookup. It only displays and scores a legislator's vote when both conditions are true:

1. The bill or vote appears in the partner tracker.
2. That tracker row has a **Preferred Stance**.

The alignment percentage is calculated from recorded, scored votes only:

- A vote matching the Preferred Stance is aligned.
- A vote opposing the Preferred Stance is not aligned.
- Votes without a recognized recorded position are not included in the percentage.

The widget uses plain-language labels—**In support** and **Opposed**—rather than showing Yea/Nay as the primary public label.

### Tracker columns

Column headers are case-insensitive. `Code` is required. `Preferred Stance` is required for a row to appear and affect alignment.

| Column | Purpose |
| --- | --- |
| `Code` | Bill number, for example `HB 123`. |
| `Preferred Stance` | Organization recommendation: use `yea`, `nay`, `support`, or `oppose`. |
| `Vote Sequence` | Optional. Use when the same bill has multiple distinct votes; it matches one specific roll call. |
| `Name` | Short bill name shown in the widget. |
| `Summary` | Bill summary shown in the detail popup. |
| `Yea Interpretation` | Explanation shown when a legislator voted in support. |
| `Nay Interpretation` | Explanation shown when a legislator opposed. |
| `Yea Impact` / `Nay Impact` | Fallback copy when an interpretation is not available. |
| `Issue Area` | Optional partner categorization. |
| `MoreInfoUrl` | Optional external resource URL. |

For the clearest popup, fill in both **Yea Interpretation** and **Nay Interpretation**. The popup prioritizes the interpretation corresponding to the legislator's recorded vote. When it has no vote-specific interpretation, it shows the conditional fallback: “If in support” and “If opposed.”

## Partner configuration in D1

The widget reads its configuration from the active row in `partner_trackers`.

| Field | Required | Purpose |
| --- | --- | --- |
| `partner_key` | Yes | Stable key used in the embed URL. Use lowercase, URL-safe text. |
| `partner_name` | Yes | Internal/display name for the partner. |
| `tracker_url` | Yes | Public CSV version of the partner's legislative tracker. |
| `is_active` | Yes | `1` enables the partner widget; `0` disables it. |
| `allowed_origins` | Recommended | JSON list of approved embedding sites for the dedicated API widget. |
| `widget_version` | Optional | Internal version label. |

### Toggle optional features

These toggles are intentionally controlled in D1, not by public embed-code parameters. Store `1` to show a feature and `0` to hide it.

| D1 field | Widget feature |
| --- | --- |
| `show_testimony_alignment` | Testimony-alignment percentage. |
| `show_free_state_aligned` | Free State Aligned tag. |
| `show_tpaction_aligned` | TPAction Aligned tag. |
| `show_public_testimony` | Public-testimony summary in the expanded area. |

Example administrative update:

```sql
UPDATE partner_trackers
SET
  show_testimony_alignment = 0,
  show_free_state_aligned = 0,
  show_tpaction_aligned = 0,
  show_public_testimony = 0,
  updated_at = CURRENT_TIMESTAMP
WHERE partner_key = 'PARTNER_KEY';
```

### Customize partner language and color

The current embed theme comes from four D1 fields:

| Field | Example |
| --- | --- |
| `embed_accent_color` | `#3b5f8c` |
| `embed_accent_soft_color` | `#e8f0f7` |
| `embed_alignment_label` | `Aligned with ABLE NH’s tracked priorities` |
| `embed_vote_intro` | `What this vote means for disability justice` |

Use valid six-digit hexadecimal colors. The alignment label appears in each legislator card, and the vote-intro text labels the vote-specific explanation in the bill popup.

## Operational checklist

Before sharing the widget:

1. Publish the Google Sheet (or other tracker) as a public CSV and save that exact CSV link in `tracker_url`.
2. Confirm every bill that should appear has a `Code` and `Preferred Stance`.
3. Add the partner site's origin to `allowed_origins` when using the dedicated API widget.
4. Set the four feature toggles to the partner's desired `0` or `1` values.
5. Set theme fields and partner-specific language.
6. Test an address with a known representative and confirm the expanded card, vote popup, and copied URL all work.

## Troubleshooting

| Symptom | Likely fix |
| --- | --- |
| “Unable to load this partner's bill tracker.” | Confirm `is_active = 1`, the `partner_key` in the iframe matches D1, and `tracker_url` is a publicly accessible CSV—not a Google Sheet editing URL. |
| No votes are shown | Verify `Code` and `Preferred Stance` are present, and that the tracker bill number matches the civic vote data. Add `Vote Sequence` when the bill has multiple recorded votes. |
| Alignment shows `—` | No scored recorded votes were found yet for that legislator. |
| Iframe is too short after expanding a card | Use the supplied embed script; it listens for widget height messages. |
| Copying the URL does not restore the legislator | Use the supplied embed script; it mirrors the widget selection into the partner page's `legislator` parameter. |
