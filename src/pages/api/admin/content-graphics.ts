export const prerender = false;

import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { canEditProfiles, requireAdmin } from "../../../lib/adminAuth";
import {
  handleContentGraphicList,
  handleContentGraphicPost,
} from "../../../lib/contentGraphicAction";
import { CONTENT_GENERATOR_PRODUCTION_URL } from "../../../lib/contentGenerator";

export const POST: APIRoute = async ({ request }) => {
  return handleContentGraphicPost({
    request,
    authorize: requireAdmin,
    canGenerate: canEditProfiles,
    db: env.d1_db,
    baseUrl: env.CONTENT_GENERATOR_BASE_URL || CONTENT_GENERATOR_PRODUCTION_URL,
  });
};

export const GET: APIRoute = async ({ request }) => {
  return handleContentGraphicList({
    request,
    authorize: requireAdmin,
    canGenerate: canEditProfiles,
    db: env.d1_db,
  });
};
