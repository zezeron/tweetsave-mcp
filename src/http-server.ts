#!/usr/bin/env node
/**
 * TweetSave MCP Server - HTTP Transport
 *
 * For hosting as a remote MCP server (cloud deployment).
 * Supports streamable HTTP transport for stateless operation.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createServer } from "http";
import { z } from "zod";

import { fetchTweet, fetchThread, buildTweetUrl } from "./twitter/client.js";
import { tweetToMarkdown, tweetToBlogPost, blogPostToMarkdown, tweetsToFeed } from "./utils/formatter.js";
import { ResponseFormat, type Tweet } from "./types.js";

const PORT = process.env.PORT || 3000;

// Create MCP server
const server = new McpServer({
  name: "tweetsave-mcp-server",
  version: "1.0.0"
});

// Register tools (same as stdio version)
// ... (tools are registered in index.ts, would need to refactor to share)

// For now, create a simple HTTP wrapper
const httpServer = createServer(async (req, res) => {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  // Health check
  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok", server: "tweetsave-mcp" }));
    return;
  }

  // Simple REST API endpoints (alternative to full MCP)
  if (req.url?.startsWith("/api/tweet/")) {
    const tweetId = req.url.replace("/api/tweet/", "").split("?")[0];
    try {
      const tweet = await fetchTweet(tweetId);
      const format = new URL(req.url, `http://localhost`).searchParams.get("format") || "json";

      if (format === "markdown") {
        res.writeHead(200, { "Content-Type": "text/markdown" });
        res.end(tweetToMarkdown(tweet));
      } else if (format === "blog") {
        const blog = tweetToBlogPost(tweet);
        res.writeHead(200, { "Content-Type": "text/markdown" });
        res.end(blogPostToMarkdown(blog));
      } else {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(tweet, null, 2));
      }
    } catch (error) {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }));
    }
    return;
  }

  // MCP endpoint would go here with StreamableHTTPServerTransport
  // For full MCP support, implement the /mcp endpoint

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({
    error: "Not found",
    endpoints: {
      "/health": "Health check",
      "/api/tweet/:id": "Get tweet (params: format=json|markdown|blog)"
    }
  }));
});

httpServer.listen(PORT, () => {
  console.log(`TweetSave HTTP server running on port ${PORT}`);
  console.log(`Endpoints:`);
  console.log(`  GET /health - Health check`);
  console.log(`  GET /api/tweet/:id?format=json|markdown|blog - Fetch tweet`);
});
