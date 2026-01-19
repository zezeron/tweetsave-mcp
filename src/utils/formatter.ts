/**
 * Content formatters for converting tweets to various formats
 */

import type { Tweet, TweetReply, BlogPost } from "../types.js";
import { buildTweetUrl, formatDate, formatNumber } from "../twitter/client.js";

/**
 * Convert a tweet to Markdown format
 */
export function tweetToMarkdown(tweet: Tweet): string {
  const lines: string[] = [];

  // Header with author info
  lines.push(`## @${tweet.author.username} (${tweet.author.name})`);
  lines.push("");

  // Tweet text
  lines.push(tweet.text);
  lines.push("");

  // Media section
  if (tweet.media && tweet.media.length > 0) {
    lines.push("### Media");
    for (const media of tweet.media) {
      if (media.type === "photo") {
        lines.push(`![Image](${media.url})`);
      } else if (media.type === "video") {
        lines.push(`- [Video](${media.url}) (${media.duration_ms ? Math.round(media.duration_ms / 1000) + "s" : ""})`);
        if (media.thumbnail_url) {
          lines.push(`  ![Thumbnail](${media.thumbnail_url})`);
        }
      } else if (media.type === "animated_gif") {
        lines.push(`- [GIF](${media.url})`);
      }
    }
    lines.push("");
  }

  // Poll section
  if (tweet.poll) {
    lines.push("### Poll");
    for (const option of tweet.poll.options) {
      const bar = "=".repeat(Math.round(option.percentage / 5));
      lines.push(`- ${option.label}: ${option.percentage}% (${formatNumber(option.votes)} votes)`);
      lines.push(`  [${bar}]`);
    }
    lines.push(`Total votes: ${formatNumber(tweet.poll.total_votes)} | Status: ${tweet.poll.voting_status}`);
    lines.push("");
  }

  // Quote tweet
  if (tweet.quoted_tweet) {
    lines.push("### Quoted Tweet");
    lines.push(`> **@${tweet.quoted_tweet.author.username}**: ${tweet.quoted_tweet.text.split("\n").join("\n> ")}`);
    lines.push("");
  }

  // Link previews
  if (tweet.urls && tweet.urls.length > 0) {
    lines.push("### Links");
    for (const url of tweet.urls) {
      if (url.title) {
        lines.push(`- [${url.title}](${url.expanded_url})`);
        if (url.description) {
          lines.push(`  ${url.description.slice(0, 100)}...`);
        }
      } else {
        lines.push(`- [${url.display_url}](${url.expanded_url})`);
      }
    }
    lines.push("");
  }

  // Engagement stats
  lines.push("---");
  lines.push(`**Engagement**: ${formatNumber(tweet.likes)} likes | ${formatNumber(tweet.retweets)} retweets | ${formatNumber(tweet.replies)} replies${tweet.views ? ` | ${formatNumber(tweet.views)} views` : ""}`);
  lines.push("");

  // Metadata
  lines.push(`**Posted**: ${formatDate(tweet.created_at)}`);
  if (tweet.hashtags && tweet.hashtags.length > 0) {
    lines.push(`**Hashtags**: ${tweet.hashtags.map(h => `#${h}`).join(" ")}`);
  }
  lines.push(`**Source**: ${buildTweetUrl(tweet.id, tweet.author.username)}`);

  return lines.join("\n");
}

/**
 * Convert a tweet and its replies to a blog post format
 */
export function tweetToBlogPost(
  tweet: Tweet,
  replies: TweetReply[] = [],
  options: {
    includeReplies?: boolean;
    maxReplies?: number;
  } = {}
): BlogPost {
  const { includeReplies = true, maxReplies = 10 } = options;

  // Generate title from tweet text
  const title = generateTitle(tweet.text);

  // Generate subtitle
  const subtitle = `A post by @${tweet.author.username}`;

  // Build content as Markdown
  const contentParts: string[] = [];

  // Main tweet content
  contentParts.push(tweet.text);
  contentParts.push("");

  // Add media
  if (tweet.media) {
    for (const media of tweet.media) {
      if (media.type === "photo") {
        contentParts.push(`![](${media.url})`);
        contentParts.push("");
      } else if (media.type === "video") {
        contentParts.push(`[Watch Video](${media.url})`);
        contentParts.push("");
      }
    }
  }

  // Add poll as formatted section
  if (tweet.poll) {
    contentParts.push("## Poll Results");
    contentParts.push("");
    for (const option of tweet.poll.options) {
      contentParts.push(`- **${option.label}**: ${option.percentage}%`);
    }
    contentParts.push("");
    contentParts.push(`*${formatNumber(tweet.poll.total_votes)} total votes*`);
    contentParts.push("");
  }

  // Add quote tweet
  if (tweet.quoted_tweet) {
    contentParts.push("---");
    contentParts.push("");
    contentParts.push(`> **@${tweet.quoted_tweet.author.username}** wrote:`);
    contentParts.push(`> ${tweet.quoted_tweet.text.split("\n").join("\n> ")}`);
    contentParts.push("");
  }

  const content = contentParts.join("\n");

  // Calculate read time (average 200 words per minute)
  const wordCount = content.split(/\s+/).length;
  const readTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

  // Collect images and videos
  const images: string[] = [];
  const videos: string[] = [];
  if (tweet.media) {
    for (const media of tweet.media) {
      if (media.type === "photo") {
        images.push(media.url);
      } else if (media.type === "video" || media.type === "animated_gif") {
        videos.push(media.url);
      }
    }
  }

  // Generate tags from hashtags
  const tags = tweet.hashtags || [];

  // Format comments from replies
  const comments = includeReplies
    ? replies.slice(0, maxReplies).map(reply => ({
        author: reply.author.name,
        username: reply.author.username,
        text: reply.text,
        likes: reply.likes,
        timestamp: formatDate(reply.created_at)
      }))
    : undefined;

  return {
    title,
    subtitle,
    author: {
      name: tweet.author.name,
      username: tweet.author.username,
      avatar_url: tweet.author.avatar_url
    },
    published_at: formatDate(tweet.created_at),
    content,
    source_url: buildTweetUrl(tweet.id, tweet.author.username),
    source_type: "tweet",
    featured_image: images[0],
    images,
    videos,
    tags,
    word_count: wordCount,
    read_time_minutes: readTimeMinutes,
    engagement: {
      likes: tweet.likes,
      retweets: tweet.retweets,
      replies: tweet.replies,
      views: tweet.views
    },
    comments
  };
}

/**
 * Convert blog post to Markdown format
 */
export function blogPostToMarkdown(post: BlogPost): string {
  const lines: string[] = [];

  // Title and meta
  lines.push(`# ${post.title}`);
  lines.push("");
  if (post.subtitle) {
    lines.push(`*${post.subtitle}*`);
    lines.push("");
  }

  // Author info
  lines.push(`**Author**: ${post.author.name} ([@${post.author.username}](https://x.com/${post.author.username}))`);
  lines.push(`**Published**: ${post.published_at}`);
  lines.push(`**Read time**: ${post.read_time_minutes} min read`);
  lines.push("");

  // Tags
  if (post.tags.length > 0) {
    lines.push(`**Tags**: ${post.tags.map(t => `#${t}`).join(" ")}`);
    lines.push("");
  }

  lines.push("---");
  lines.push("");

  // Featured image
  if (post.featured_image) {
    lines.push(`![Featured Image](${post.featured_image})`);
    lines.push("");
  }

  // Main content
  lines.push(post.content);
  lines.push("");

  // Engagement
  lines.push("---");
  lines.push("");
  lines.push("## Engagement");
  lines.push("");
  lines.push(`- **Likes**: ${formatNumber(post.engagement.likes)}`);
  lines.push(`- **Retweets**: ${formatNumber(post.engagement.retweets)}`);
  lines.push(`- **Replies**: ${formatNumber(post.engagement.replies)}`);
  if (post.engagement.views) {
    lines.push(`- **Views**: ${formatNumber(post.engagement.views)}`);
  }
  lines.push("");

  // Comments section
  if (post.comments && post.comments.length > 0) {
    lines.push("## Comments");
    lines.push("");
    for (const comment of post.comments) {
      lines.push(`### @${comment.username}`);
      lines.push(`*${comment.timestamp}* | ${formatNumber(comment.likes)} likes`);
      lines.push("");
      lines.push(comment.text);
      lines.push("");
    }
  }

  // Source
  lines.push("---");
  lines.push("");
  lines.push(`*Originally posted on X: [View original](${post.source_url})*`);

  return lines.join("\n");
}

/**
 * Generate a title from tweet text
 */
function generateTitle(text: string): string {
  // Remove URLs
  let cleaned = text.replace(/https?:\/\/\S+/g, "");

  // Remove mentions at the start
  cleaned = cleaned.replace(/^(@\w+\s*)+/, "");

  // Remove hashtags
  cleaned = cleaned.replace(/#\w+/g, "");

  // Clean up whitespace
  cleaned = cleaned.trim().replace(/\s+/g, " ");

  // If text is too short, use generic title
  if (cleaned.length < 10) {
    return "A Thread on X";
  }

  // Truncate to first sentence or 60 chars
  const firstSentence = cleaned.match(/^[^.!?]+[.!?]?/);
  if (firstSentence && firstSentence[0].length <= 80) {
    return firstSentence[0].trim();
  }

  // Truncate at word boundary
  if (cleaned.length > 60) {
    const truncated = cleaned.slice(0, 60);
    const lastSpace = truncated.lastIndexOf(" ");
    if (lastSpace > 30) {
      return truncated.slice(0, lastSpace) + "...";
    }
  }

  return cleaned.slice(0, 60) + (cleaned.length > 60 ? "..." : "");
}

/**
 * Create a feed of multiple tweets as a single markdown document
 */
export function tweetsToFeed(tweets: Tweet[]): string {
  const lines: string[] = [];

  lines.push("# Tweet Feed");
  lines.push("");
  lines.push(`*${tweets.length} tweets*`);
  lines.push("");
  lines.push("---");
  lines.push("");

  for (const tweet of tweets) {
    lines.push(tweetToMarkdown(tweet));
    lines.push("");
    lines.push("---");
    lines.push("");
  }

  return lines.join("\n");
}
