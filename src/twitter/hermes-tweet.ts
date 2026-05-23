/**
 * Optional Hermes Tweet/Xquik search backend.
 *
 * The default TweetSave tools keep using FxTwitter for URL and ID fetches.
 * This module only powers query search when an operator provides an API key.
 */

import axios, { AxiosError } from "axios";
import type { Tweet } from "../types.js";

const DEFAULT_BASE_URL = "https://xquik.com";
const REQUEST_TIMEOUT = 30000;

type JsonObject = Record<string, unknown>;

function getApiKey(): string {
  const key = process.env.HERMES_TWEET_API_KEY || process.env.XQUIK_API_KEY;
  if (!key?.trim()) {
    throw new Error(
      "Hermes Tweet search requires HERMES_TWEET_API_KEY or XQUIK_API_KEY in the server environment"
    );
  }
  return key.trim();
}

function getBaseUrl(): string {
  const baseUrl =
    process.env.HERMES_TWEET_API_BASE || process.env.XQUIK_BASE_URL || DEFAULT_BASE_URL;
  return baseUrl.trim().replace(/\/+$/, "") || DEFAULT_BASE_URL;
}

function authHeaders(apiKey: string): Record<string, string> {
  if (apiKey.toLowerCase().startsWith("bearer ")) {
    return { Authorization: apiKey };
  }
  return { "x-api-key": apiKey };
}

export async function searchHermesTweets(query: string, limit: number): Promise<Tweet[]> {
  const apiKey = getApiKey();
  const safeLimit = Math.max(1, Math.min(limit, 50));
  const response = await axios
    .get<unknown>(`${getBaseUrl()}/api/v1/x/tweets/search`, {
      timeout: REQUEST_TIMEOUT,
      headers: {
        Accept: "application/json",
        "User-Agent": "tweetsave-mcp/1.0 (github.com/zezeron)",
        ...authHeaders(apiKey)
      },
      params: {
        q: query,
        limit: safeLimit
      }
    })
    .catch((error: unknown) => {
      if (error instanceof AxiosError) {
        const status = error.response?.status;
        const detail = status ? `HTTP ${status}` : error.message;
        throw new Error(`Hermes Tweet search failed: ${detail}`);
      }
      throw error;
    });

  return parseHermesTweetSearchPayload(response.data);
}

export function parseHermesTweetSearchPayload(payload: unknown): Tweet[] {
  return collectTweetCandidates(payload)
    .map(normalizeHermesTweet)
    .filter((tweet): tweet is Tweet => tweet !== null);
}

function collectTweetCandidates(value: unknown): unknown[] {
  if (Array.isArray(value)) {
    return value;
  }
  if (!isObject(value)) {
    return [];
  }

  for (const key of ["tweets", "data", "results", "items", "statuses"]) {
    const nested = collectTweetCandidates(value[key]);
    if (nested.length > 0) {
      return nested;
    }
  }

  for (const nestedValue of Object.values(value)) {
    const nested = collectTweetCandidates(nestedValue);
    if (nested.length > 0) {
      return nested;
    }
  }

  return [];
}

function normalizeHermesTweet(value: unknown): Tweet | null {
  if (!isObject(value)) {
    return null;
  }

  const id = firstString(value, [
    ["tweet_id"],
    ["id"],
    ["id_str"],
    ["rest_id"],
    ["conversation_id"]
  ]);
  if (!id) {
    return null;
  }

  const text = firstString(value, [
    ["source_full_text"],
    ["full_text"],
    ["text"],
    ["content"],
    ["body"]
  ]) || "";
  const username = (firstString(value, [
    ["handle"],
    ["username"],
    ["screen_name"],
    ["author", "username"],
    ["author", "screen_name"],
    ["user", "username"],
    ["user", "screen_name"]
  ]) || "unknown").replace(/^@/, "");
  const authorName = firstString(value, [
    ["name"],
    ["author", "name"],
    ["user", "name"]
  ]) || username;

  return {
    id,
    text,
    author: {
      id: firstString(value, [["author_id"], ["author", "id"], ["user", "id"]]) || "",
      username,
      name: authorName
    },
    created_at: firstString(value, [["created_at"], ["createdAt"], ["timestamp"], ["time"]]) || "",
    likes: metricValue(value, ["likes", "like_count"]),
    retweets: metricValue(value, ["retweets", "retweet_count", "reposts"]),
    replies: metricValue(value, ["replies", "reply_count"]),
    quotes: metricValue(value, ["quotes", "quote_count"]),
    views: metricValue(value, ["views", "impressions", "impression_count"]) || undefined,
    bookmarks: metricValue(value, ["bookmarks", "bookmark_count"]) || undefined,
    conversation_id: firstString(value, [["conversation_id"]]) || undefined,
    hashtags: extractTags(text, /#(\w+)/g),
    mentions: extractTags(text, /@(\w+)/g)
  };
}

function firstString(value: JsonObject, paths: string[][]): string | null {
  for (const path of paths) {
    const nested = getPath(value, path);
    const text = valueToString(nested);
    if (text) {
      return text;
    }
  }
  return null;
}

function getPath(value: JsonObject, path: string[]): unknown {
  let current: unknown = value;
  for (const key of path) {
    if (!isObject(current)) {
      return undefined;
    }
    current = current[key];
  }
  return current;
}

function valueToString(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed || null;
  }
  if (typeof value === "number" || typeof value === "bigint") {
    return String(value);
  }
  return null;
}

function metricValue(value: JsonObject, keys: string[]): number {
  for (const key of keys) {
    const direct = valueToNumber(value[key]);
    if (direct !== null) {
      return direct;
    }
    for (const metricsKey of ["metrics", "public_metrics"]) {
      const metrics = value[metricsKey];
      if (isObject(metrics)) {
        const nested = valueToNumber(metrics[key]);
        if (nested !== null) {
          return nested;
        }
      }
    }
  }
  return 0;
}

function valueToNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return null;
}

function extractTags(text: string, pattern: RegExp): string[] | undefined {
  const matches = [...text.matchAll(pattern)].map(match => match[1]).filter(Boolean);
  return matches.length > 0 ? matches : undefined;
}

function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
