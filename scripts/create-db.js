import pg from "pg";

const { Client } = pg;
const connectionString = process.env.SYSTEM_DATABASE_URL || "postgres://postgres@127.0.0.1:5432/postgres";

async function main() {
  console.log("Connecting to default postgres database to check for centre_tour_booking database...");
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    const res = await client.query("SELECT 1 FROM pg_database WHERE datname='centre_tour_booking'");
    if (res.rows.length === 0) {
      await client.query("CREATE DATABASE centre_tour_booking");
      console.log("Database 'centre_tour_booking' created successfully.");
    } else {
      console.log("Database 'centre_tour_booking' already exists.");
    }
  } catch (err) {
    console.error("Error checking or creating database:", err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
