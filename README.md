# NH Deserves Better / Civic Commons

Astro application deployed to Cloudflare Workers with D1 and R2 bindings.

## Local development

```sh
npm install
npm run dev
```

Useful checks:

```sh
npm test
npm run generate-types
npm run build
```

## Content Generator integration

Authenticated profile editors can open **Create social graphic** on candidate
and legislator detail pages. The editable form sends a same-origin request to
NH Deserves Better; the browser never calls the rendering service directly.
The server validates the selected template and all fields, then posts one of:

- `candidate-profile-update`
- `legislator-profile-update`

The renderer base URL comes from the non-secret Worker variable
`CONTENT_GENERATOR_BASE_URL`. It defaults in code to
`https://content-generator.randall-d53.workers.dev` and the same production
value is declared in `wrangler.jsonc`. Override it in the relevant Wrangler
environment when using a staging renderer.

Each intentional render receives a local UUID and a source ID in the form
`<template>:<uuid>`. A timeout or interrupted request keeps that UUID and
reuses the stored payload so the renderer can return its idempotent duplicate.
**Create another variation** creates a new UUID. D1 stores render metadata and
the renderer's durable asset URL in `content_graphic_events`; NHDB does not copy
the PNG into R2.

Before deploying the integration, apply the D1 migration:

```sh
npx wrangler d1 execute nhdb --remote --file migrations/0025_content_graphic_events.sql
```

The application also creates the table defensively with `IF NOT EXISTS`, but
applying the tracked migration keeps production schema history complete.

Deploy through the repository's existing Cloudflare workflow or run:

```sh
npx wrangler deploy
```
