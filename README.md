<p align="center">
  <img src="https://tweetsave.org/appIcon.png" alt="TweetSave" width="180">
</p>

<p align="center">
  <a href="https://www.npmjs.org/package/tweetsave-mcp"><img src="https://img.shields.io/npm/v/tweetsave-mcp.svg" alt="npm version"></a>
  <a href="https://www.npmjs.org/package/tweetsave-mcp"><img src="https://img.shields.io/npm/dm/tweetsave-mcp.svg" alt="npm downloads"></a>
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT"></a>
</p>

<p align="center">
  <a href="https://modelcontextprotocol.io/"><img src="https://img.shields.io/badge/MCP-Compatible-blue" alt="MCP Server"></a>
  <a href="https://claude.ai"><img src="https://img.shields.io/badge/Claude-Ready-orange" alt="Claude"></a>
  <a href="https://mcp.tweetsave.org/health"><img src="https://img.shields.io/badge/Server-Online-brightgreen" alt="Server Status"></a>
</p>

<p align="center">
  MCP server for fetching Twitter/X content and converting to blog posts.<br>
  <strong>No Twitter API key required</strong> - Uses FxTwitter API (free, open source).
</p>

<p align="center">
  <a href="https://tweetsave.org">Website</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#features">Features</a> •
  <a href="#installation">Installation</a> •
  <a href="#available-tools">Tools</a>
</p>

---

## Features

- Fetch tweets with full content, media, and engagement metrics
- Convert tweets to formatted blog posts
- Extract media URLs (photos, videos, GIFs)
- Batch fetch multiple tweets (up to 10)
- Support for quote tweets and polls
- Markdown and JSON output formats

---

## Quick Start

### Remote MCP (Recommended)

No installation required - connect directly to hosted server:

```bash
npx -y mcp-remote https://mcp.tweetsave.org/sse
```

### Local (npx)

```bash
npx -y tweetsave-mcp
```

---

## Installation

### Remote MCP (Recommended)

Connect to hosted server - no local installation needed.

#### Claude Code

```bash
claude mcp add tweetsave -- npx -y mcp-remote https://mcp.tweetsave.org/sse
```

#### Claude Desktop / Cursor / Windsurf

Add to your MCP configuration:

```json
{
  "mcpServers": {
    "tweetsave": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://mcp.tweetsave.org/sse"]
    }
  }
}
```

**Config file locations:**
- **Claude Desktop (macOS):** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Claude Desktop (Windows):** `%APPDATA%\Claude\claude_desktop_config.json`
- **Cursor:** `~/.cursor/mcp.json`
- **Windsurf:** `~/.codeium/windsurf/mcp_config.json`

#### VS Code

Create `.vscode/mcp.json` in your workspace:

```json
{
  "servers": {
    "tweetsave": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://mcp.tweetsave.org/sse"]
    }
  }
}
```

#### Gemini CLI

```bash
gemini mcp add tweetsave "npx -y mcp-remote https://mcp.tweetsave.org/sse"
```

#### JetBrains IDEs

Settings → Tools → MCP Server → Add:

- **Name:** TweetSave
- **Command:** npx
- **Arguments:** -y mcp-remote https://mcp.tweetsave.org/sse

#### OpenCode

```bash
opencode mcp add
```

Then follow prompts:
- **Name:** tweetsave
- **Type:** Remote
- **URL:** https://mcp.tweetsave.org/sse
- **OAuth:** No

#### Antigravity

Click `...` menu → MCP → Manage MCP Server → View raw config:

```json
{
  "mcpServers": {
    "tweetsave": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://mcp.tweetsave.org/sse"]
    }
  }
}
```

---

### Local Installation

For offline use or development.

#### Claude Code

```bash
claude mcp add tweetsave -- npx -y tweetsave-mcp
```

#### Claude Desktop / Cursor / Windsurf

```json
{
  "mcpServers": {
    "tweetsave": {
      "command": "npx",
      "args": ["-y", "tweetsave-mcp"]
    }
  }
}
```

---

## Available Tools

### `tweetsave_get_tweet`

Fetch a single tweet with all content.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `url` | string | required | Tweet URL or ID |
| `response_format` | 'markdown' \| 'json' | 'markdown' | Output format |

### `tweetsave_get_thread`

Fetch a tweet thread (connected tweets).

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `url` | string | required | Any tweet URL in thread |
| `response_format` | 'markdown' \| 'json' | 'markdown' | Output format |

### `tweetsave_to_blog`

Convert tweet to blog post format.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `url` | string | required | Tweet URL or ID |
| `include_engagement` | boolean | true | Include likes/retweets |
| `response_format` | 'markdown' \| 'json' | 'markdown' | Output format |

### `tweetsave_batch`

Fetch multiple tweets at once.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `urls` | string[] | required | Array of URLs (max 10) |
| `response_format` | 'markdown' \| 'json' | 'markdown' | Output format |

### `tweetsave_extract_media`

Extract direct media URLs from a tweet.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `url` | string | required | Tweet URL or ID |
| `media_type` | 'all' \| 'photos' \| 'videos' | 'all' | Filter type |

---

## Output Examples

### Markdown Format

```markdown
## @itsPaulAi (Paul Couvert)

This is so good 🔥

You can run this new model on a laptop which is:
- 100% open source
- Only 3B active parameters (!!)

---
**Engagement**: 228 likes | 15 retweets | 29.9K views
**Posted**: January 19, 2026 at 08:02 PM
```

### Blog Post Format

```markdown
# This is so good 🔥 You can run this new model...

*A post by @itsPaulAi*

**Author**: Paul Couvert ([@itsPaulAi](https://x.com/itsPaulAi))
**Published**: January 19, 2026 at 08:02 PM
**Read time**: 1 min read

---

[Content here]

---

## Engagement

- **Likes**: 228
- **Retweets**: 15
- **Views**: 29.9K
```

---

## Limitations

- **No replies/comments**: FxTwitter API doesn't support fetching replies
- **Rate limits**: FxTwitter has rate limits for heavy usage
- **Private tweets**: Cannot access protected/private accounts

---

## License

MIT

## Contributing

Contributions welcome! Please open an issue or PR.

## Support

- Issues: https://github.com/zezeron/tweetsave-mcp/issues
- Twitter: [@zezeron](https://x.com/zezeron)
