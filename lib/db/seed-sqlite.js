import initSqlJs from "sql.js";
import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";

const sqliteFile = process.env.SQLITE_FILE || path.resolve(process.cwd(), "../artifacts/api-server/data/dev.sqlite");

function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

async function main() {
  ensureDir(sqliteFile);

  const fileExists = fs.existsSync(sqliteFile);

  const SQL = await initSqlJs();
  let db;
  if (fileExists) {
    const buf = fs.readFileSync(sqliteFile);
    const u8 = new Uint8Array(buf);
    db = new SQL.Database(u8);
  } else {
    db = new SQL.Database();
  }

  // Ensure staff table exists (drizzle migrations should create it). If not, create minimal table.
  try {
    const res = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='staff';");
    if (!res || res.length === 0) {
      console.log('staff table not found; creating minimal staff table');
      db.run(`CREATE TABLE staff (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'counsellor',
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );`);
    }
  } catch (err) {
    console.error('Error checking/creating staff table:', err);
    process.exit(1);
  }

  // Ensure bookings and related tables exist
  try {
    const bookingsRes = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='bookings';");
    if (!bookingsRes || bookingsRes.length === 0) {
      console.log('bookings table not found; creating bookings table');
      db.run(`CREATE TABLE bookings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        parent_name TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT NOT NULL,
        child_name TEXT NOT NULL,
        child_age TEXT NOT NULL,
        date TEXT NOT NULL,
        time_slot TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'enquiry',
        assigned_to TEXT,
        message TEXT,
        whatsapp TEXT,
        preferred_class TEXT,
        referral_source TEXT,
        follow_up_date TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );`);
    }

    const statusRes = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='status_history';");
    if (!statusRes || statusRes.length === 0) {
      console.log('status_history table not found; creating status_history table');
      db.run(`CREATE TABLE status_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        booking_id INTEGER NOT NULL,
        from_status TEXT,
        to_status TEXT NOT NULL,
        changed_by TEXT NOT NULL DEFAULT 'system',
        note TEXT,
        changed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
      );`);
    }

    const notesRes = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='booking_notes';");
    if (!notesRes || notesRes.length === 0) {
      console.log('booking_notes table not found; creating booking_notes table');
      db.run(`CREATE TABLE booking_notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        booking_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        author TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
      );`);
    }

    const referralsRes = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='referral_rewards';");
    if (!referralsRes || referralsRes.length === 0) {
      console.log('referral_rewards table not found; creating referral_rewards table');
      db.run(`CREATE TABLE referral_rewards (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        booking_id INTEGER NOT NULL,
        referrer_name TEXT NOT NULL,
        referrer_phone TEXT NOT NULL,
        referrer_email TEXT,
        reward_status TEXT NOT NULL DEFAULT 'pending',
        reward_details TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
      );`);
    }
  } catch (err) {
    console.error('Error checking/creating booking tables:', err);
    process.exit(1);
  }

  const users = [
    { username: 'admin', name: 'System Admin', role: 'admin', password: 'admin123' },
    { username: 'kavita', name: 'Kavita Sharma', role: 'centre_head', password: 'kavita123' },
    { username: 'deepa', name: 'Deepa Nair', role: 'counsellor', password: 'deepa123' },
  ];

  for (const user of users) {
    const sel = db.exec("SELECT id FROM staff WHERE username = ?", [user.username]);
    // sql.js returns arrays; easier to run a prepared statement
    const stmt = db.prepare("SELECT id FROM staff WHERE username = :u");
    let exists = false;
    try {
      stmt.bind({ ':u': user.username });
      if (stmt.step()) exists = true;
    } finally {
      stmt.free && stmt.free();
    }

    if (!exists) {
      const hash = await bcrypt.hash(user.password, 10);
      const insert = db.prepare(`INSERT INTO staff (username, password_hash, name, role) VALUES (:u, :ph, :n, :r)`);
      insert.bind({ ':u': user.username, ':ph': hash, ':n': user.name, ':r': user.role });
      insert.step();
      insert.free && insert.free();
      console.log(`Created user: ${user.username}`);
    } else {
      console.log(`User ${user.username} already exists`);
    }
  }

  // export and write back to file for persistence
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(sqliteFile, buffer);
  console.log('Wrote sqlite file to', sqliteFile);

  db.close && db.close();
}

main().catch(err => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
