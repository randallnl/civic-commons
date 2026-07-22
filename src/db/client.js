import { drizzle } from "drizzle-orm/d1";
import { env } from "cloudflare:workers";
import * as schema from "./schema";

export function getDrizzleDb(database = env.d1_db) {
  if (!database) throw new Error("D1 database binding is not configured.");
  return drizzle(database, { schema });
}

export { schema };
