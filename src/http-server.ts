#!/usr/bin/env node
/**
 * TweetSave MCP Server - HTTP Transport
 *
 * For hosting as a remote MCP server (cloud deployment).
 * Supports both:
 * - SSE transport for MCP clients (mcp-remote)
 * - REST API for direct HTTP access
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { createServer, type IncomingMessage, type ServerResponse } from "http";

import { fetchTweet } from "./twitter/client.js";
import { tweetToMarkdown, tweetToBlogPost, blogPostToMarkdown } from "./utils/formatter.js";
import { registerTools } from "./tools.js";

const PORT = process.env.PORT || 3000;

// =============================================================================
// Session Management
// =============================================================================

// Store active SSE transports by session ID
const transports: Record<string, SSEServerTransport> = {};

// =============================================================================
// HTTP Server
// =============================================================================

const httpServer = createServer(async (req: IncomingMessage, res: ServerResponse) => {
  // CORS headers for cross-origin requests
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  const url = req.url || "/";

  // ---------------------------------------------------------------------------
  // Health Check
  // ---------------------------------------------------------------------------
  if (url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      status: "ok",
      server: "tweetsave-mcp",
      version: "1.0.0",
      transports: {
        sse: "/sse",
        messages: "/messages"
      }
    }));
    return;
  }

  // ---------------------------------------------------------------------------
  // SSE Endpoint - Establish MCP Connection
  // ---------------------------------------------------------------------------
  if (url === "/sse" && req.method === "GET") {
    console.log("New SSE connection request");

    try {
      // Create SSE transport - it handles setting response headers
      const transport = new SSEServerTransport("/messages", res);
      const sessionId = transport.sessionId;
      transports[sessionId] = transport;

      console.log(`SSE connection established: ${sessionId}`);

      // Create MCP server for this session
      const mcpServer = new McpServer({
        name: "tweetsave-mcp-server",
        version: "1.0.0"
      });

      // Register all tools
      registerTools(mcpServer);

      // Connect the transport
      await mcpServer.connect(transport);

      // Clean up on disconnect
      res.on("close", () => {
        console.log(`SSE connection closed: ${sessionId}`);
        delete transports[sessionId];
      });

    } catch (error) {
      console.error("SSE connection error:", error);
      if (!res.headersSent) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Failed to establish SSE connection" }));
      }
    }
    return;
  }

  // ---------------------------------------------------------------------------
  // Messages Endpoint - Handle MCP Client Requests
  // ---------------------------------------------------------------------------
  if (url.startsWith("/messages") && req.method === "POST") {
    // Extract session ID from query string
    const urlObj = new URL(url, `http://localhost:${PORT}`);
    const sessionId = urlObj.searchParams.get("sessionId");

    if (!sessionId) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Missing sessionId parameter" }));
      return;
    }

    const transport = transports[sessionId];
    if (!transport) {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Session not found" }));
      return;
    }

    try {
      // Delegate to the transport's message handler
      await transport.handlePostMessage(req, res);
    } catch (error) {
      console.error("Message handling error:", error);
      if (!res.headersSent) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Failed to process message" }));
      }
    }
    return;
  }

  // ---------------------------------------------------------------------------
  // REST API - Direct Tweet Access (alternative to MCP)
  // ---------------------------------------------------------------------------
  if (url.startsWith("/api/tweet/")) {
    const tweetId = url.replace("/api/tweet/", "").split("?")[0];

    try {
      const tweet = await fetchTweet(tweetId);
      const urlObj = new URL(url, `http://localhost:${PORT}`);
      const format = urlObj.searchParams.get("format") || "json";

      if (format === "markdown") {
        res.writeHead(200, { "Content-Type": "text/markdown; charset=utf-8" });
        res.end(tweetToMarkdown(tweet));
      } else if (format === "blog") {
        const blog = tweetToBlogPost(tweet);
        res.writeHead(200, { "Content-Type": "text/markdown; charset=utf-8" });
        res.end(blogPostToMarkdown(blog));
      } else {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(tweet, null, 2));
      }
    } catch (error) {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error"
      }));
    }
    return;
  }

  // ---------------------------------------------------------------------------
  // 404 - Not Found
  // ---------------------------------------------------------------------------
  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({
    error: "Not found",
    endpoints: {
      "/health": "Health check",
      "/sse": "SSE endpoint for MCP clients (GET)",
      "/messages?sessionId=X": "Message endpoint for MCP clients (POST)",
      "/api/tweet/:id": "Direct API - Get tweet (params: format=json|markdown|blog)"
    }
  }));
});

// =============================================================================
// Start Server
// =============================================================================

httpServer.listen(PORT, () => {
  console.log(`TweetSave MCP HTTP server running on port ${PORT}`);
  console.log(`\nEndpoints:`);
  console.log(`  GET  /health                    - Health check`);
  console.log(`  GET  /sse                       - SSE endpoint for MCP clients`);
  console.log(`  POST /messages?sessionId=X      - Message endpoint for MCP clients`);
  console.log(`  GET  /api/tweet/:id?format=X    - Direct API (format: json|markdown|blog)`);
  console.log(`\nFor remote MCP access, use:`);
  console.log(`  npx mcp-remote http://localhost:${PORT}/sse`);
});
