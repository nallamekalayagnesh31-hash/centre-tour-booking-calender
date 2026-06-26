import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';

const sqliteFile = process.env.SQLITE_FILE || path.resolve('artifacts/api-server/data/dev.sqlite');

if (!fs.existsSync(sqliteFile)) {
  console.error('File not found:', sqliteFile);
  process.exit(2);
}

(async () => {
  try {
    const buf = fs.readFileSync(sqliteFile);
    const require = createRequire(import.meta.url);
    const wasmPath = path.join(path.dirname(require.resolve('sql.js')), 'sql-wasm.wasm');
    const SQL = await initSqlJs({ locateFile: () => wasmPath });
    const db = new SQL.Database(new Uint8Array(buf));
    const res = db.exec("SELECT name FROM sqlite_master WHERE type='table';");
    if (!res || res.length === 0) {
      console.log('No tables found');
    } else {
      const rows = res[0].values.map(r => r[0]);
      console.log('Tables in', sqliteFile, ':', rows.join(', '));
    }
    db.close && db.close();
  } catch (err) {
    console.error('Error reading sqlite file:', err);
    process.exit(1);
  }
})();
