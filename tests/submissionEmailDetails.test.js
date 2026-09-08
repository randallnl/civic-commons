import assert from "node:assert/strict";
import test from "node:test";

import {
  normalizeSubmissionDetails,
  submissionDetailsHtml,
  submissionDetailsText,
} from "../src/lib/submissionEmailDetails.js";

test("formats complete submission details for plain-text emails", () => {
  const details = [
    { label: "Submitted about", value: "Representative Example" },
    { label: "Update text", value: "Add the latest voting record." },
    { label: "Source link", value: "https://example.com/source", href: "https://example.com/source" },
    { label: "Photos", value: "2 photos uploaded" },
  ];

  assert.equal(
    submissionDetailsText(details),
    [
      "Submitted about: Representative Example",
      "Update text: Add the latest voting record.",
      "Source link: https://example.com/source",
      "Photos: 2 photos uploaded",
    ].join("\n\n"),
  );
});

test("escapes detail content and only links public web URLs in HTML emails", () => {
  const html = submissionDetailsHtml([
    { label: "Update <text>", value: "Line one\nLine <two>" },
    { label: "Source", value: "View source", href: "https://example.com/?a=1&b=2" },
    { label: "Unsafe", value: "Do not link", href: "javascript:alert(1)" },
  ]);

  assert.match(html, /Update &lt;text&gt;/);
  assert.match(html, /Line one<br \/>Line &lt;two&gt;/);
  assert.match(html, /href="https:\/\/example\.com\/\?a=1&amp;b=2"/);
  assert.doesNotMatch(html, /javascript:/);
});

test("omits blank submission details", () => {
  assert.deepEqual(
    normalizeSubmissionDetails([
      { label: "Suggested update", value: "" },
      { label: "", value: "orphaned value" },
      { label: "Additional information", value: "Useful context" },
    ]),
    [{ label: "Additional information", value: "Useful context", href: "" }],
  );
});
