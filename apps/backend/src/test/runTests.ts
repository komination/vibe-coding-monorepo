#!/usr/bin/env bun

import { spawn } from "bun";
import path from "path";

async function runTests() {
  console.log("🧪 Running backend tests...\n");

  const startTime = Date.now();

  try {
    // Run tests with coverage
    const proc = spawn(["bun", "test", "--coverage"], {
      cwd: path.resolve(import.meta.dir, "../.."),
      stdout: "inherit",
      stderr: "inherit",
      env: {
        ...process.env,
        NODE_ENV: "test",
        DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/kanban_test",
      },
    });

    const exitCode = await proc.exited;

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    if (exitCode === 0) {
      console.log(`\n✅ All tests passed in ${duration}s`);
    } else {
      console.log(`\n❌ Tests failed in ${duration}s`);
      process.exit(exitCode);
    }
  } catch (error) {
    console.error("\n❌ Error running tests:", error);
    process.exit(1);
  }
}

// Check if test database exists
async function checkTestDatabase() {
  console.log("📊 Checking test database...");
  
  try {
    const proc = spawn(["bun", "run", "db:test:setup"], {
      cwd: path.resolve(import.meta.dir, "../.."),
      stdout: "inherit",
      stderr: "inherit",
    });

    await proc.exited;
    console.log("✅ Test database ready\n");
  } catch (error) {
    console.error("❌ Failed to setup test database:", error);
    console.log("\nPlease ensure PostgreSQL is running and the test database exists.");
    console.log("You can create it with: createdb kanban_test");
    process.exit(1);
  }
}

// Main execution
async function main() {
  await checkTestDatabase();
  await runTests();
}

main().catch(console.error);