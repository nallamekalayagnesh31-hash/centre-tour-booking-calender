/// <reference types="node" />
import { defineConfig } from "drizzle-kit";
import path from "path";

const schema = "./src/schema/index.ts";

if (!process.env.DATABASE_URL && !process.env.SQLITE_FILE) {
  throw new Error("DATABASE_URL or SQLITE_FILE must be set for migrations");
}

let cfg;
if (process.env.SQLITE_FILE) {
  const sqlitePath = path.relative(process.cwd(), path.resolve(process.env.SQLITE_FILE));
  cfg = defineConfig({
    schema,
    dialect: "sqlite",
    dbCredentials: {
      url: `file:${sqlitePath}`,
    },
  });
} else {
  cfg = defineConfig({
    schema,
    dialect: "postgresql",
    dbCredentials: {
      url: process.env.DATABASE_URL!,
    },
  });
}

export default cfg;
