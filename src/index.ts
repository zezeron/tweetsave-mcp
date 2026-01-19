#!/usr/bin/env node
/**
 * TweetSave MCP Server
 *
 * Fetches Twitter/X content and converts to blog post format.
 * Uses FxTwitter API (free, no auth required).
 *
 * Tools:
 * - tweetsave_get_tweet: Fetch a single tweet with media
 * - tweetsave_get_thread: Fetch a tweet thread
 * - tweetsave_to_blog: Convert tweet to blog post format
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { fetchTweet, fetchThread, buildTweetUrl, formatDate, formatNumber } from "./twitter/client.js";
import { tweetToMarkdown, tweetToBlogPost, blogPostToMarkdown, tweetsToFeed } from "./utils/formatter.js";
import { ResponseFormat, type Tweet, type BlogPost } from "./types.js";

// Constants
const CHARACTER_LIMIT = 50000;

// Create MCP server
const server = new McpServer({
  name: "tweetsave-mcp-server",
  version: "1.0.0"
});

// =============================================================================
// Tool: tweetsave_get_tweet
// =============================================================================

const GetTweetInputSchema = z.object({
  url: z.string()
    .min(1, "URL is required")
    .describe("Tweet URL or tweet ID. Examples: 'https://x.com/user/status/123456' or '123456'"),
  response_format: z.nativeEnum(ResponseFormat)
    .default(ResponseFormat.MARKDOWN)
    .describe("Output format: 'markdown' for human-readable or 'json' for structured data")
}).strict();

type GetTweetInput = z.infer<typeof GetTweetInputSchema>;

server.registerTool(
  "tweetsave_get_tweet",
  {
    title: "Get Tweet",
    description: `Fetch a single tweet with all its content including text, media (photos, videos, GIFs), polls, and engagement metrics.

This tool retrieves tweet data from Twitter/X using the FxTwitter API. It returns the tweet content, author info, media URLs, and engagement stats.

Args:
  - url (string): Tweet URL or tweet ID
  - response_format ('markdown' | 'json'): Output format (default: 'markdown')

Returns:
  Tweet data including:
  - Author info (name, username, avatar)
  - Tweet text
  - Media URLs (photos, videos)
  - Engagement (likes, retweets, replies, views)
  - Poll data (if applicable)
  - Quote tweet (if applicable)

Examples:
  - "Get tweet from https://x.com/elonmusk/status/123456"
  - "Fetch this tweet: 123456789"

Note: Does not fetch replies. Use tweetsave_to_blog for a complete blog post with formatting.`,
    inputSchema: GetTweetInputSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true
    }
  },
  async (params: GetTweetInput) => {
    try {
      const tweet = await fetchTweet(params.url);

      if (params.response_format === ResponseFormat.JSON) {
        const output = JSON.stringify(tweet, null, 2);
        return {
          content: [{ type: "text", text: output }]
        };
      }

      // Markdown format
      const markdown = tweetToMarkdown(tweet);
      return {
        content: [{ type: "text", text: markdown }]
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        content: [{
          type: "text",
          text: `Error fetching tweet: ${errorMessage}\n\nTips:\n- Make sure the URL is correct\n- Check if the tweet is public\n- Try using just the tweet ID`
        }],
        isError: true
      };
    }
  }
);

// =============================================================================
// Tool: tweetsave_get_thread
// =============================================================================

const GetThreadInputSchema = z.object({
  url: z.string()
    .min(1, "URL is required")
    .describe("URL or ID of any tweet in the thread"),
  response_format: z.nativeEnum(ResponseFormat)
    .default(ResponseFormat.MARKDOWN)
    .describe("Output format: 'markdown' for human-readable or 'json' for structured data")
}).strict();

type GetThreadInput = z.infer<typeof GetThreadInputSchema>;

server.registerTool(
  "tweetsave_get_thread",
  {
    title: "Get Tweet Thread",
    description: `Fetch a tweet thread (multiple connected tweets by the same author).

Note: Current implementation fetches the main tweet. Full thread crawling requires additional API access.

Args:
  - url (string): URL or ID of any tweet in the thread
  - response_format ('markdown' | 'json'): Output format (default: 'markdown')

Returns:
  Array of tweets in the thread with all content and media.

Examples:
  - "Get the full thread from this tweet: https://x.com/user/status/123"`,
    inputSchema: GetThreadInputSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true
    }
  },
  async (params: GetThreadInput) => {
    try {
      const tweets = await fetchThread(params.url);

      if (params.response_format === ResponseFormat.JSON) {
        const output = JSON.stringify({ tweets, count: tweets.length }, null, 2);
        return {
          content: [{ type: "text", text: output }]
        };
      }

      // Markdown format - create a feed
      const markdown = tweetsToFeed(tweets);
      return {
        content: [{ type: "text", text: markdown }]
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        content: [{
          type: "text",
          text: `Error fetching thread: ${errorMessage}`
        }],
        isError: true
      };
    }
  }
);

// =============================================================================
// Tool: tweetsave_to_blog
// =============================================================================

const ToBlogInputSchema = z.object({
  url: z.string()
    .min(1, "URL is required")
    .describe("Tweet URL or tweet ID to convert"),
  include_engagement: z.boolean()
    .default(true)
    .describe("Include engagement metrics (likes, retweets, etc.)"),
  response_format: z.nativeEnum(ResponseFormat)
    .default(ResponseFormat.MARKDOWN)
    .describe("Output format: 'markdown' for blog post or 'json' for structured data")
}).strict();

type ToBlogInput = z.infer<typeof ToBlogInputSchema>;

server.registerTool(
  "tweetsave_to_blog",
  {
    title: "Convert Tweet to Blog Post",
    description: `Convert a tweet into a formatted blog post with title, content, media, and metadata.

This tool transforms a tweet into a readable blog post format, perfect for:
- Archiving tweets
- Creating content from threads
- Generating blog posts from viral tweets

Args:
  - url (string): Tweet URL or tweet ID
  - include_engagement (boolean): Include likes/retweets/etc. (default: true)
  - response_format ('markdown' | 'json'): Output format (default: 'markdown')

Returns:
  BlogPost with:
  - Generated title from tweet content
  - Author info with avatar
  - Formatted content with media
  - Tags from hashtags
  - Read time estimate
  - Engagement summary
  - Source link

Examples:
  - "Convert this tweet to a blog post: https://x.com/user/status/123"
  - "Make a blog from tweet 123456789"`,
    inputSchema: ToBlogInputSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true
    }
  },
  async (params: ToBlogInput) => {
    try {
      const tweet = await fetchTweet(params.url);
      const blogPost = tweetToBlogPost(tweet, [], {
        includeReplies: false
      });

      // Remove engagement if not wanted
      if (!params.include_engagement) {
        blogPost.engagement = { likes: 0, retweets: 0, replies: 0 };
      }

      if (params.response_format === ResponseFormat.JSON) {
        const output = JSON.stringify(blogPost, null, 2);
        return {
          content: [{ type: "text", text: output }]
        };
      }

      // Markdown format
      const markdown = blogPostToMarkdown(blogPost);
      return {
        content: [{ type: "text", text: markdown }]
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        content: [{
          type: "text",
          text: `Error converting to blog: ${errorMessage}`
        }],
        isError: true
      };
    }
  }
);

// =============================================================================
// Tool: tweetsave_batch
// =============================================================================

const BatchInputSchema = z.object({
  urls: z.array(z.string())
    .min(1, "At least one URL required")
    .max(10, "Maximum 10 tweets per batch")
    .describe("Array of tweet URLs or IDs (max 10)"),
  response_format: z.nativeEnum(ResponseFormat)
    .default(ResponseFormat.MARKDOWN)
    .describe("Output format: 'markdown' or 'json'")
}).strict();

type BatchInput = z.infer<typeof BatchInputSchema>;

server.registerTool(
  "tweetsave_batch",
  {
    title: "Batch Fetch Tweets",
    description: `Fetch multiple tweets at once (max 10).

Useful for:
- Collecting tweets from a list
- Building a feed from multiple sources
- Comparing multiple tweets

Args:
  - urls (string[]): Array of tweet URLs or IDs (max 10)
  - response_format ('markdown' | 'json'): Output format (default: 'markdown')

Returns:
  Array of tweets or a combined feed in markdown format.

Examples:
  - "Fetch these tweets: [url1, url2, url3]"`,
    inputSchema: BatchInputSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true
    }
  },
  async (params: BatchInput) => {
    try {
      const results: { url: string; tweet?: Tweet; error?: string }[] = [];

      // Fetch all tweets (sequentially to avoid rate limits)
      for (const url of params.urls) {
        try {
          const tweet = await fetchTweet(url);
          results.push({ url, tweet });
        } catch (error) {
          results.push({
            url,
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }

      const successfulTweets = results
        .filter((r): r is { url: string; tweet: Tweet } => !!r.tweet)
        .map(r => r.tweet);

      const errors = results.filter(r => r.error);

      if (params.response_format === ResponseFormat.JSON) {
        const output = {
          total: params.urls.length,
          successful: successfulTweets.length,
          failed: errors.length,
          tweets: successfulTweets,
          errors: errors.map(e => ({ url: e.url, error: e.error }))
        };
        return {
          content: [{ type: "text", text: JSON.stringify(output, null, 2) }]
        };
      }

      // Markdown format
      let markdown = tweetsToFeed(successfulTweets);

      if (errors.length > 0) {
        markdown += "\n\n## Errors\n\n";
        for (const e of errors) {
          markdown += `- ${e.url}: ${e.error}\n`;
        }
      }

      return {
        content: [{ type: "text", text: markdown }]
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        content: [{
          type: "text",
          text: `Error in batch fetch: ${errorMessage}`
        }],
        isError: true
      };
    }
  }
);

// =============================================================================
// Tool: tweetsave_extract_media
// =============================================================================

const ExtractMediaInputSchema = z.object({
  url: z.string()
    .min(1, "URL is required")
    .describe("Tweet URL or tweet ID"),
  media_type: z.enum(["all", "photos", "videos"])
    .default("all")
    .describe("Type of media to extract: 'all', 'photos', or 'videos'")
}).strict();

type ExtractMediaInput = z.infer<typeof ExtractMediaInputSchema>;

server.registerTool(
  "tweetsave_extract_media",
  {
    title: "Extract Media URLs",
    description: `Extract direct media URLs (photos, videos, GIFs) from a tweet.

Returns direct URLs that can be downloaded or embedded. Video URLs are the highest quality available.

Args:
  - url (string): Tweet URL or tweet ID
  - media_type ('all' | 'photos' | 'videos'): Filter by media type (default: 'all')

Returns:
  List of media items with:
  - type (photo/video/gif)
  - url (direct download URL)
  - dimensions (width/height)
  - duration (for videos)

Examples:
  - "Get all media from this tweet: https://x.com/user/status/123"
  - "Extract video URLs from tweet 123456"`,
    inputSchema: ExtractMediaInputSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true
    }
  },
  async (params: ExtractMediaInput) => {
    try {
      const tweet = await fetchTweet(params.url);

      if (!tweet.media || tweet.media.length === 0) {
        return {
          content: [{
            type: "text",
            text: "No media found in this tweet."
          }]
        };
      }

      let media = tweet.media;

      // Filter by type
      if (params.media_type === "photos") {
        media = media.filter(m => m.type === "photo");
      } else if (params.media_type === "videos") {
        media = media.filter(m => m.type === "video" || m.type === "animated_gif");
      }

      if (media.length === 0) {
        return {
          content: [{
            type: "text",
            text: `No ${params.media_type} found in this tweet.`
          }]
        };
      }

      // Build output
      const output = {
        tweet_id: tweet.id,
        tweet_url: buildTweetUrl(tweet.id, tweet.author.username),
        media_count: media.length,
        media: media.map(m => ({
          type: m.type,
          url: m.url,
          thumbnail_url: m.thumbnail_url,
          width: m.width,
          height: m.height,
          duration_seconds: m.duration_ms ? Math.round(m.duration_ms / 1000) : undefined,
          alt_text: m.alt_text
        }))
      };

      // Markdown format
      const lines = [
        `# Media from Tweet`,
        ``,
        `**Tweet**: ${output.tweet_url}`,
        `**Media count**: ${output.media_count}`,
        ``,
        `## Media URLs`,
        ``
      ];

      for (const m of output.media) {
        lines.push(`### ${m.type.toUpperCase()}`);
        lines.push(`- **URL**: ${m.url}`);
        if (m.width && m.height) {
          lines.push(`- **Dimensions**: ${m.width}x${m.height}`);
        }
        if (m.duration_seconds) {
          lines.push(`- **Duration**: ${m.duration_seconds}s`);
        }
        if (m.thumbnail_url) {
          lines.push(`- **Thumbnail**: ${m.thumbnail_url}`);
        }
        lines.push(``);
      }

      return {
        content: [{ type: "text", text: lines.join("\n") }]
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        content: [{
          type: "text",
          text: `Error extracting media: ${errorMessage}`
        }],
        isError: true
      };
    }
  }
);

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
