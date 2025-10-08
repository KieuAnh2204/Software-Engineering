import { defineConfig } from "drizzle-kit";

// @ts-ignore - process is available in Node.js runtime
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    // @ts-ignore - process is available in Node.js runtime
    url: process.env.DATABASE_URL,
  },
});
