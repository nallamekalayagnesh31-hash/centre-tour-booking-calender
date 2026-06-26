import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';

const sqliteFile = path.resolve('artifacts/api-server/data/dev.sqlite');

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
    
    // Check existing columns
    const res = db.exec("PRAGMA table_info(bookings)");
    const columns = res[0].values.map(r => r[1]);
    console.log('Current columns:', columns);
    
    // Add columns if they do not exist
    if (!columns.includes('preferred_class')) {
      console.log('Adding preferred_class column...');
      db.run("ALTER TABLE bookings ADD COLUMN preferred_class TEXT;");
    }
    if (!columns.includes('referral_source')) {
      console.log('Adding referral_source column...');
      db.run("ALTER TABLE bookings ADD COLUMN referral_source TEXT;");
    }
    if (!columns.includes('follow_up_date')) {
      console.log('Adding follow_up_date column...');
      db.run("ALTER TABLE bookings ADD COLUMN follow_up_date TEXT;");
    }
    
    // Write database file back
    const data = db.export();
    fs.writeFileSync(sqliteFile, Buffer.from(data));
    console.log('Database updated successfully.');
    db.close && db.close();
  } catch (err) {
    console.error('Error modifying database:', err);
    process.exit(1);
  }
})();
