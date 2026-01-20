#!/usr/bin/env node
/**
 * TweetSave MCP Server - stdio Transport
 *
 * Fetches Twitter/X content and converts to blog post format.
 * Uses FxTwitter API (free, no auth required).
 *
 * Tools:
 * - tweetsave_get_tweet: Fetch a single tweet with media
 * - tweetsave_get_thread: Fetch a tweet thread
 * - tweetsave_to_blog: Convert tweet to blog post format
 * - tweetsave_batch: Fetch multiple tweets at once
 * - tweetsave_extract_media: Extract media URLs from a tweet
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerTools } from "./tools.js";

// Create MCP server
const server = new McpServer({
  name: "tweetsave-mcp-server",
  version: "1.0.0"
});

// Register all tools from shared module
registerTools(server);

// =============================================================================
// Main
// =============================================================================

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("TweetSave MCP server running via stdio");
}

main().catch(error => {
  console.error("Fatal error:", error);
  process.exit(1);
});
