import pg from "pg";
import bcrypt from "bcryptjs";

const { Client } = pg;
const connectionString = process.env.DATABASE_URL || "postgres://postgres@127.0.0.1:5432/centre_tour_booking";

async function main() {
  const client = new Client({ connectionString });
  await client.connect();

  console.log("Connected to database. Seeding demo accounts...");

  const users = [
    { username: "admin", name: "System Admin", role: "admin", password: "admin123" },
    { username: "kavita", name: "Kavita Sharma", role: "centre_head", password: "kavita123" },
    { username: "deepa", name: "Deepa Nair", role: "counsellor", password: "deepa123" }
  ];

  for (const user of users) {
    const passwordHash = await bcrypt.hash(user.password, 10);
    // Check if user already exists
    const res = await client.query("SELECT id FROM staff WHERE username = $1", [user.username]);
    if (res.rows.length === 0) {
      await client.query(
        "INSERT INTO staff (username, name, role, password_hash) VALUES ($1, $2, $3, $4)",
        [user.username, user.name, user.role, passwordHash]
      );
      console.log(`Created user: ${user.username}`);
    } else {
      console.log(`User ${user.username} already exists`);
    }
  }

  await client.end();
  console.log("Seeding complete!");
}

main().catch(err => {
  console.error("Error during seeding:", err);
  process.exit(1);
});
