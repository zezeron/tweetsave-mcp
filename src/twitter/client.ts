/**
 * Twitter/X API Client
 *
 * Uses FxTwitter API (free, no auth required) as the default backend.
 * Can be extended to support official Twitter API or other providers.
 */

import axios, { AxiosError } from "axios";
import type { Tweet, TweetAuthor, TweetMedia, TweetReply, FxTwitterResponse } from "../types.js";

// API Configuration
const FXTWITTER_API = "https://api.fxtwitter.com";
const VXTWITTER_API = "https://api.vxtwitter.com"; // Backup
const REQUEST_TIMEOUT = 30000;

/**
 * Extract tweet ID from various URL formats
 */
export function extractTweetId(input: string): string | null {
  // If it's already just an ID (numeric string)
  if (/^\d+$/.test(input.trim())) {
    return input.trim();
  }

  // URL patterns
  const patterns = [
    // twitter.com/user/status/123456
    /(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)/i,
    // Short URLs like t.co redirects
    /\/status\/(\d+)/i,
    // Just the ID at the end
    /(\d{15,20})$/
  ];

  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}

/**
 * Extract username from URL
 */
export function extractUsername(url: string): string | null {
  const match = url.match(/(?:twitter\.com|x\.com)\/(\w+)/i);
  return match ? match[1] : null;
}

/**
 * Fetch tweet data from FxTwitter API
 */
export async function fetchTweet(tweetIdOrUrl: string): Promise<Tweet> {
  const tweetId = extractTweetId(tweetIdOrUrl);

  if (!tweetId) {
    throw new Error(`Invalid tweet URL or ID: ${tweetIdOrUrl}`);
  }

  // We need a username for FxTwitter API, try to extract or use placeholder
  let username = extractUsername(tweetIdOrUrl);
  if (!username) {
    username = "i"; // FxTwitter accepts 'i' as placeholder
  }

  try {
    const response = await axios.get<FxTwitterResponse>(
      `${FXTWITTER_API}/${username}/status/${tweetId}`,
      {
        timeout: REQUEST_TIMEOUT,
        headers: {
          "Accept": "application/json",
          "User-Agent": "tweetsave-mcp/1.0 (github.com/zezeron)"
        }
      }
    );

    if (response.data.code !== 200 || !response.data.tweet) {
      throw new Error(response.data.message || "Tweet not found");
    }

    return convertFxTweetToTweet(response.data.tweet);
  } catch (error) {
    if (error instanceof AxiosError) {
      if (error.response?.status === 404) {
        throw new Error(`Tweet not found: ${tweetId}`);
      }
      if (error.response?.status === 429) {
        throw new Error("Rate limit exceeded. Please wait and try again.");
      }
      throw new Error(`Failed to fetch tweet: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Fetch replies to a tweet
 * Note: FxTwitter doesn't support replies directly, so we use a workaround
 */
export async function fetchReplies(
  tweetIdOrUrl: string,
  limit: number = 20
): Promise<TweetReply[]> {
  // FxTwitter doesn't have a replies endpoint
  // For now, we'll return an empty array with a note
  // In a production app, you'd need:
  // 1. Twitter API v2 with search endpoint
  // 2. A scraping solution
  // 3. A third-party service

  console.error("Note: Reply fetching requires Twitter API v2 or scraping solution");

  // Return empty for now - can be implemented with proper API
  return [];
}

/**
 * Fetch a tweet thread (conversation)
 */
export async function fetchThread(tweetIdOrUrl: string): Promise<Tweet[]> {
  const mainTweet = await fetchTweet(tweetIdOrUrl);
  const thread: Tweet[] = [mainTweet];

  // If this tweet is a reply, try to fetch parent
  // FxTwitter includes some context but not full thread
  // Full implementation would require crawling up the reply chain

  return thread;
}

/**
 * Convert FxTwitter response to our Tweet type
 */
function convertFxTweetToTweet(fxTweet: NonNullable<FxTwitterResponse["tweet"]>): Tweet {
  const author: TweetAuthor = {
    id: fxTweet.author.id,
    username: fxTweet.author.screen_name,
    name: fxTweet.author.name,
    avatar_url: fxTweet.author.avatar_url,
    verified: false, // FxTwitter doesn't provide this
    followers_count: fxTweet.author.followers
  };

  const media: TweetMedia[] = [];

  // Process photos
  if (fxTweet.media?.photos) {
    for (const photo of fxTweet.media.photos) {
      media.push({
        type: "photo",
        url: photo.url,
        width: photo.width,
        height: photo.height,
        alt_text: photo.altText
      });
    }
  }

  // Process videos
  if (fxTweet.media?.videos) {
    for (const video of fxTweet.media.videos) {
      media.push({
        type: "video",
        url: video.url,
        thumbnail_url: video.thumbnail_url,
        width: video.width,
        height: video.height,
        duration_ms: video.duration * 1000
      });
    }
  }

  // Extract hashtags and mentions from text
  const hashtags = (fxTweet.text.match(/#\w+/g) || []).map(h => h.slice(1));
  const mentions = (fxTweet.text.match(/@\w+/g) || []).map(m => m.slice(1));

  // Build URLs array from card if present
  const urls: Tweet["urls"] = [];
  if (fxTweet.card) {
    urls.push({
      url: fxTweet.card.url,
      expanded_url: fxTweet.card.url,
      display_url: fxTweet.card.url.replace(/^https?:\/\//, ""),
      title: fxTweet.card.title,
      description: fxTweet.card.description,
      image: fxTweet.card.image
    });
  }

  const tweet: Tweet = {
    id: fxTweet.id,
    text: fxTweet.text,
    author,
    created_at: fxTweet.created_at,
    media: media.length > 0 ? media : undefined,
    likes: fxTweet.likes,
    retweets: fxTweet.retweets,
    replies: fxTweet.replies,
    quotes: fxTweet.quote_count,
    views: fxTweet.views,
    hashtags: hashtags.length > 0 ? hashtags : undefined,
    mentions: mentions.length > 0 ? mentions : undefined,
    urls: urls.length > 0 ? urls : undefined,
    language: fxTweet.lang,
    source: fxTweet.source,
    in_reply_to_user: fxTweet.replying_to,
    in_reply_to_id: fxTweet.replying_to_status
  };

  // Handle poll
  if (fxTweet.poll) {
    tweet.poll = {
      options: fxTweet.poll.choices.map(c => ({
        label: c.label,
        votes: c.count,
        percentage: c.percentage
      })),
      total_votes: fxTweet.poll.total_votes,
      end_time: fxTweet.poll.ends_at,
      voting_status: fxTweet.poll.time_left_en === "Final results" ? "closed" : "open"
    };
  }

  // Handle quote tweet
  if (fxTweet.quote) {
    tweet.quoted_tweet = convertFxTweetToTweet(fxTweet.quote);
  }

  return tweet;
}

/**
 * Build tweet URL from ID and username
 */
export function buildTweetUrl(tweetId: string, username: string): string {
  return `https://x.com/${username}/status/${tweetId}`;
}

/**
 * Format timestamp to readable date
 */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

/**
 * Format large numbers (1000 -> 1K, 1000000 -> 1M)
 */
export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  }
  return num.toString();
}
