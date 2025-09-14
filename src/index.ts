#!/usr/bin/env node

/**
 * VEX MCP Server entry point
 */

import { VEXMCPServer } from "./server.js";

async function main() {
  const server = new VEXMCPServer();
  await server.run();
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

main().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});