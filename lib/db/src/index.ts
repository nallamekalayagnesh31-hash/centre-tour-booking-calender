import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { drizzle as drizzleSqlite } from "drizzle-orm/sql-js";
import pg from "pg";
import initSqlJs from "sql.js";
import path from "path";
import fs from "fs";
import * as schema from "./schema";

const { Pool } = pg;

export let pool: pg.Pool | undefined;
export let db: any;

if (process.env.DATABASE_URL) {
  pool = new Pool({ connectionString: process.env.DATABASE_URL });
  db = drizzlePg(pool, { schema });
} else {
  const fileName = "sql-wasm.wasm";

  function findWasm() {
    let dir = process.cwd();
    for (let i = 0; i < 8; i++) {
      // direct node_modules/sql.js
      const direct = path.join(dir, "node_modules", "sql.js", "dist", fileName);
      if (fs.existsSync(direct)) return direct;

      // pnpm store under node_modules/.pnpm
      const pnpmDir = path.join(dir, "node_modules", ".pnpm");
      if (fs.existsSync(pnpmDir)) {
        for (const name of fs.readdirSync(pnpmDir)) {
          if (name.startsWith("sql.js@")) {
            const candidate = path.join(pnpmDir, name, "node_modules", "sql.js", "dist", fileName);
            if (fs.existsSync(candidate)) return candidate;
          }
        }
      }

      dir = path.resolve(dir, "..");
    }

    return null;
  }

  const wasmPath = findWasm();
  if (!wasmPath) {
    throw new Error("sql-wasm.wasm not found in workspace node_modules or pnpm store");
  }

  const SQL = await initSqlJs({ locateFile: () => wasmPath });

  // If SQLITE_FILE is set and exists, load it so the server uses the persisted DB.
  // Prefer an absolute path when provided; otherwise try sensible relative locations.
  let sqliteDb;
  if (process.env.SQLITE_FILE) {
    const envPath = process.env.SQLITE_FILE;
    let candidates: string[] = [];

    if (path.isAbsolute(envPath)) {
      candidates = [envPath];
    } else {
      // Try relative to current working directory and relative to the built artifact directory.
      candidates = [
        path.resolve(process.cwd(), envPath),
        path.resolve(__dirname, '..', envPath),
        path.resolve(__dirname, '..', '..', envPath),
      ];
    }

    console.log('[DB] SQLITE_FILE env:', envPath);
    console.log('[DB] cwd:', process.cwd());
    console.log('[DB] __dirname:', __dirname);
    console.log('[DB] Checking candidates:', candidates);

    let found: string | null = null;
    for (const c of candidates) {
      try {
        if (fs.existsSync(c)) {
          found = c;
          console.log('[DB] Found sqlite file:', found);
          break;
        }
      } catch (e) {
        // ignore and continue
      }
    }

    if (found) {
      const buf = fs.readFileSync(found);
      const u8 = new Uint8Array(buf);
      sqliteDb = new SQL.Database(u8);
      console.log('[DB] Loaded sqlite DB from', found);
    } else {
      // fallback: create a new in-memory DB
      console.log('[DB] SQLITE_FILE set but none of the candidates exist; using in-memory DB');
      sqliteDb = new SQL.Database();
    }
  } else {
    sqliteDb = new SQL.Database();
  }

  db = drizzleSqlite(sqliteDb, { schema });
}

export * from "./schema";
