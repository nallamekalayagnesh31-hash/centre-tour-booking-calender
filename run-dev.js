import { spawn } from "child_process";
import path from "path";

// Load .env
try {
  process.loadEnvFile(path.resolve(process.cwd(), ".env"));
} catch (e) {
  console.warn("Could not load .env file:", e.message);
}

// Defaults
const apiPort = "8080";
const frontendPort = "8081";

console.log("Starting services...");

// 1. Start API Server (uses PORT=8080)
const apiEnv = {
  ...process.env,
  PORT: apiPort,
};
console.log(`Starting API Server on port ${apiPort}...`);
const apiProcess = spawn("pnpm", ["--filter", "@workspace/api-server", "run", "dev"], {
  stdio: "inherit",
  shell: true,
  env: apiEnv,
});

// 2. Start Frontend Server (uses PORT=8081)
const frontendEnv = {
  ...process.env,
  PORT: frontendPort,
};
console.log(`Starting Frontend Server on port ${frontendPort}...`);
const frontendProcess = spawn("pnpm", ["--filter", "@workspace/centre-tour", "run", "dev"], {
  stdio: "inherit",
  shell: true,
  env: frontendEnv,
});

// Handle termination
const killAll = () => {
  console.log("\nShutting down all servers...");
  apiProcess.kill();
  frontendProcess.kill();
  process.exit();
};

process.on("SIGINT", killAll);
process.on("SIGTERM", killAll);
