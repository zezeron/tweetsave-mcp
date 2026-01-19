/**
 * Type definitions for TweetSave MCP Server
 */

// Tweet author information
export interface TweetAuthor {
  id: string;
  username: string;
  name: string;
  avatar_url?: string;
  verified?: boolean;
  followers_count?: number;
}

// Media attachment (image, video, gif)
export interface TweetMedia {
  type: "photo" | "video" | "animated_gif";
  url: string;
  thumbnail_url?: string;
  width?: number;
  height?: number;
  duration_ms?: number; // For videos
  alt_text?: string;
}

// Poll option
export interface PollOption {
  label: string;
  votes: number;
  percentage: number;
}

// Tweet poll
export interface TweetPoll {
  options: PollOption[];
  total_votes: number;
  end_time?: string;
  voting_status: "open" | "closed";
}

// Main tweet data structure
export interface Tweet {
  id: string;
  text: string;
  author: TweetAuthor;
  created_at: string;
  media?: TweetMedia[];
  poll?: TweetPoll;

  // Engagement metrics
  likes: number;
  retweets: number;
  replies: number;
  quotes: number;
  views?: number;
  bookmarks?: number;

  // Thread/conversation info
  conversation_id?: string;
  in_reply_to_id?: string;
  in_reply_to_user?: string;

  // Quote tweet
  quoted_tweet?: Tweet;

  // URLs in tweet
  urls?: Array<{
    url: string;
    expanded_url: string;
    display_url: string;
    title?: string;
    description?: string;
    image?: string;
  }>;

  // Hashtags and mentions
  hashtags?: string[];
  mentions?: string[];

  // Language
  language?: string;

  // Source (e.g., "Twitter for iPhone")
  source?: string;
}

// Reply to a tweet
export interface TweetReply extends Tweet {
  depth: number; // Reply depth (0 = direct reply, 1 = reply to reply, etc.)
}

// Thread (series of tweets by same author)
export interface TweetThread {
  tweets: Tweet[];
  author: TweetAuthor;
  total_tweets: number;
}

// Blog post format output
export interface BlogPost {
  title: string;
  subtitle?: string;
  author: {
    name: string;
    username: string;
    avatar_url?: string;
    bio?: string;
  };
  published_at: string;
  content: string; // Markdown content

  // Original tweet info
  source_url: string;
  source_type: "tweet" | "thread";

  // Media
  featured_image?: string;
  images: string[];
  videos: string[];

  // Metadata
  tags: string[];
  word_count: number;
  read_time_minutes: number;

  // Engagement summary
  engagement: {
    likes: number;
    retweets: number;
    replies: number;
    views?: number;
  };

  // Comments/replies section
  comments?: Array<{
    author: string;
    username: string;
    text: string;
    likes: number;
    timestamp: string;
  }>;
}

// API response from FxTwitter or similar
export interface FxTwitterResponse {
  code: number;
  message: string;
  tweet?: {
    id: string;
    url: string;
    text: string;
    created_at: string;
    created_timestamp: number;
    author: {
      id: string;
      name: string;
      screen_name: string;
      avatar_url: string;
      banner_url?: string;
      description?: string;
      location?: string;
      url?: string;
      followers: number;
      following: number;
      likes: number;
      tweets: number;
      joined: string;
    };
    replies: number;
    retweets: number;
    likes: number;
    views?: number;
    quote_count: number;
    media?: {
      photos?: Array<{
        url: string;
        width: number;
        height: number;
        altText?: string;
      }>;
      videos?: Array<{
        url: string;
        thumbnail_url: string;
        width: number;
        height: number;
        duration: number;
        format: string;
      }>;
      mosaic?: {
        type: string;
        formats: Record<string, { url: string }>;
      };
    };
    poll?: {
      choices: Array<{
        label: string;
        count: number;
        percentage: number;
      }>;
      total_votes: number;
      ends_at: string;
      time_left_en: string;
    };
    card?: {
      type: string;
      url: string;
      title?: string;
      description?: string;
      image?: string;
    };
    lang: string;
    source: string;
    replying_to?: string;
    replying_to_status?: string;
    quote?: FxTwitterResponse["tweet"];
  };
}

// Response format enum
export enum ResponseFormat {
  MARKDOWN = "markdown",
  JSON = "json"
}
