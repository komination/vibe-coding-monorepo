// Test setup for use-cases package
import { beforeAll, afterAll } from "bun:test";

// Global test setup
beforeAll(() => {
  // Setup test environment
  process.env.NODE_ENV = 'test';
});

afterAll(() => {
  // Cleanup after all tests
});