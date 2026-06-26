import pg from "pg";

const { Client } = pg;
const connectionString = process.env.DATABASE_URL || "postgres://postgres@127.0.0.1:5432/centre_tour_booking";

async function main() {
  const client = new Client({ connectionString });
  await client.connect();

  console.log("Connected to database. Seeding demo accounts...");

  const users = [
    {
      username: "admin",
      name: "System Admin",
      role: "admin",
      passwordHash: "$2b$10$rZ8klRl0umHyHr5S9aufUueJ4f8n1PL6tx.XssQaPA4W2V95sp7iW"
    },
    {
      username: "kavita",
      name: "Kavita Sharma",
      role: "centre_head",
      passwordHash: "$2b$10$ldMFpVi/IesjTcTOBbfHV.3H.P6XpugIqLWCiM5E7JK58XyXsNgie"
    },
    {
      username: "deepa",
      name: "Deepa Nair",
      role: "counsellor",
      passwordHash: "$2b$10$7ZS3eEhLgZ7IV56w83QHm.jL3fD9rgefAM59n1nYMwNtO1ofBy5SG"
    }
  ];

  for (const user of users) {
    // Check if user already exists
    const res = await client.query("SELECT id FROM staff WHERE username = $1", [user.username]);
    if (res.rows.length === 0) {
      await client.query(
        "INSERT INTO staff (username, name, role, password_hash) VALUES ($1, $2, $3, $4)",
        [user.username, user.name, user.role, user.passwordHash]
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
