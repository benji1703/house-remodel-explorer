import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is unavailable. Set it to your Supabase connection string before using the database."
    );
  }

  return drizzle(postgres(url), { schema });
}
