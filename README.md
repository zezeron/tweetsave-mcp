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
  <a href="#installation-methods">Installation</a> •
  <a href="#available-tools-mcp">Tools</a>
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

### Option 1: Remote MCP (Recommended)

No installation required - connect directly to hosted server:

```bash
npx mcp-remote https://mcp.tweetsave.org/sse
```

**Live endpoint:** `https://mcp.tweetsave.org/sse`

### Option 2: npx (Local)

```bash
npx -y tweetsave-mcp
```

### Option 3: Global Install

```bash
npm install -g tweetsave-mcp
tweetsave-mcp
```

### Option 4: From Source

```bash
git clone https://github.com/zezeron/tweetsave-mcp
cd tweetsave-mcp
npm install && npm run build
npm start
```

---

## Installation Methods

### Method 1: Remote MCP (Recommended)

Connect to hosted server - no local installation needed.

#### Claude CLI

```bash
claude mcp add tweetsave -- npx -y mcp-remote https://mcp.tweetsave.org/sse
```

#### Claude Desktop / Cursor / VS Code / Windsurf

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

#### Gemini CLI

```bash
gemini mcp add tweetsave "npx -y mcp-remote https://mcp.tweetsave.org/sse"
```

#### JetBrains IDEs

Settings → Tools → AI Assistant → Model Context Protocol:

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

---

### Method 2: Local CLI Usage

For personal use with Claude CLI or Claude Desktop.

#### Claude CLI

```bash
# Add to Claude CLI
claude mcp add tweetsave -- npx -y tweetsave-mcp

# Or with local path (development)
claude mcp add tweetsave -- node /path/to/tweetsave-mcp/dist/index.js
```

#### Claude Desktop (macOS)

Edit `~/Library/Application Support/Claude/claude_desktop_config.json`:

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

#### Claude Desktop (Windows)

Edit `%APPDATA%\Claude\claude_desktop_config.json`:

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

#### Cursor / VS Code with Continue

Add to your MCP configuration:

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

### Method 2: NPM Publishing (Global Distribution)

To publish your own version to npm for public use.

#### Prerequisites

1. npm account: https://www.npmjs.com/signup
2. Unique package name (check availability)

#### Steps

```bash
# 1. Login to npm
npm login

# 2. Check if name is available
npm search tweetsave-mcp

# 3. Update package.json with your details
# - name: your-unique-package-name
# - author: Your Name
# - repository: your GitHub repo

# 4. Build the project
npm run build

# 5. Test locally before publishing
npm link
tweetsave-mcp  # Should start the server

# 6. Publish to npm
npm publish

# 7. Verify publication
npm info tweetsave-mcp
```

#### Package.json Requirements

```json
{
  "name": "tweetsave-mcp",
  "version": "1.0.0",
  "bin": {
    "tweetsave-mcp": "dist/index.js"
  },
  "files": [
    "dist",
    "README.md"
  ],
  "keywords": [
    "mcp",
    "mcp-server",
    "twitter",
    "claude"
  ]
}
```

#### Updating Published Package

```bash
# Bump version
npm version patch  # 1.0.0 -> 1.0.1
npm version minor  # 1.0.0 -> 1.1.0
npm version major  # 1.0.0 -> 2.0.0

# Publish update
npm publish
```

#### Listing on MCP Directories

After publishing to npm:

1. **Smithery**: https://smithery.ai → Submit Server
2. **MCP Hub**: https://github.com/modelcontextprotocol/servers → Open PR
3. **Awesome MCP**: https://github.com/punkpeye/awesome-mcp-servers → Open PR

---

### Method 3: Cloud Deployment (HTTP API)

For hosting as a remote service accessible via HTTP.

#### HTTP Server

The package includes an HTTP server for cloud deployment:

```bash
# Start HTTP server
npm run start:http

# Or with custom port
PORT=8080 npm run start:http
```

#### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/sse` | GET | SSE endpoint for MCP clients |
| `/messages?sessionId=X` | POST | MCP message handler |
| `/api/tweet/:id` | GET | Fetch tweet |
| `/api/tweet/:id?format=json` | GET | Tweet as JSON |
| `/api/tweet/:id?format=markdown` | GET | Tweet as Markdown |
| `/api/tweet/:id?format=blog` | GET | Tweet as Blog Post |

#### Example Requests

```bash
# Health check
curl http://localhost:3000/health
# {"status":"ok","server":"tweetsave-mcp"}

# Get tweet as JSON
curl http://localhost:3000/api/tweet/123456789

# Get tweet as blog post
curl "http://localhost:3000/api/tweet/123456789?format=blog"
```

#### Deploy to Railway

```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login
railway login

# 3. Initialize project
railway init

# 4. Add start command to package.json
# "start": "node dist/http-server.js"

# 5. Deploy
railway up

# 6. Get public URL
railway domain
```

#### Deploy to Render

1. Create `render.yaml`:

```yaml
services:
  - type: web
    name: tweetsave-mcp
    env: node
    buildCommand: npm install && npm run build
    startCommand: npm run start:http
    envVars:
      - key: PORT
        value: 10000
```

2. Connect GitHub repo to Render
3. Auto-deploys on push

#### Deploy to Fly.io

```bash
# 1. Install Fly CLI
brew install flyctl

# 2. Login
fly auth login

# 3. Create fly.toml
cat > fly.toml << 'EOF'
app = "tweetsave-mcp"
primary_region = "iad"

[build]
  builder = "heroku/buildpacks:20"

[env]
  PORT = "8080"

[http_service]
  internal_port = 8080
  force_https = true

[[services]]
  internal_port = 8080
  protocol = "tcp"

  [[services.ports]]
    port = 80
    handlers = ["http"]

  [[services.ports]]
    port = 443
    handlers = ["tls", "http"]
EOF

# 4. Deploy
fly launch
fly deploy
```

#### Deploy to Vercel (Serverless)

Create `api/tweet/[id].js`:

```javascript
import { fetchTweet } from '../../dist/twitter/client.js';
import { tweetToMarkdown, tweetToBlogPost, blogPostToMarkdown } from '../../dist/utils/formatter.js';

export default async function handler(req, res) {
  const { id } = req.query;
  const format = req.query.format || 'json';

  try {
    const tweet = await fetchTweet(id);

    if (format === 'markdown') {
      res.setHeader('Content-Type', 'text/markdown');
      return res.send(tweetToMarkdown(tweet));
    }

    if (format === 'blog') {
      const blog = tweetToBlogPost(tweet);
      res.setHeader('Content-Type', 'text/markdown');
      return res.send(blogPostToMarkdown(blog));
    }

    res.json(tweet);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
}
```

#### Docker Deployment

Create `Dockerfile`:

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist ./dist

ENV PORT=3000
EXPOSE 3000

CMD ["node", "dist/http-server.js"]
```

Build and run:

```bash
docker build -t tweetsave-mcp .
docker run -p 3000:3000 tweetsave-mcp
```

---

## Available Tools (MCP)

### `tweetsave_get_tweet`

Fetch a single tweet with all content.

**Input:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `url` | string | required | Tweet URL or ID |
| `response_format` | 'markdown' \| 'json' | 'markdown' | Output format |

**Example:**
```
Get tweet from https://x.com/elonmusk/status/123456
```

### `tweetsave_get_thread`

Fetch a tweet thread (connected tweets).

**Input:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `url` | string | required | Any tweet URL in thread |
| `response_format` | 'markdown' \| 'json' | 'markdown' | Output format |

### `tweetsave_to_blog`

Convert tweet to blog post format.

**Input:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `url` | string | required | Tweet URL or ID |
| `include_engagement` | boolean | true | Include likes/retweets |
| `response_format` | 'markdown' \| 'json' | 'markdown' | Output format |

**Example:**
```
Convert this tweet to a blog post: https://x.com/user/status/123
```

### `tweetsave_batch`

Fetch multiple tweets at once.

**Input:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `urls` | string[] | required | Array of URLs (max 10) |
| `response_format` | 'markdown' \| 'json' | 'markdown' | Output format |

### `tweetsave_extract_media`

Extract direct media URLs from a tweet.

**Input:**
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

---

*Originally posted on X: [View original](https://x.com/...)*
```

---

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3000 | HTTP server port |

---

## Limitations

- **No replies/comments**: FxTwitter API doesn't support fetching replies. Requires Twitter API v2 for full thread support.
- **Rate limits**: FxTwitter has rate limits. For heavy usage, implement caching.
- **Private tweets**: Cannot access protected/private accounts.
- **Thread limitations**: Currently fetches main tweet only. Full thread crawling requires additional implementation.

---

## Development

```bash
# Clone
git clone https://github.com/zezeron/tweetsave-mcp
cd tweetsave-mcp

# Install
npm install

# Development (watch mode)
npm run dev

# Build
npm run build

# Test stdio server
npm start

# Test HTTP server
npm run start:http
```

### Project Structure

```
tweetsave-mcp/
├── src/
│   ├── index.ts           # MCP Server (stdio transport)
│   ├── http-server.ts     # HTTP/SSE Server (cloud deployment)
│   ├── tools.ts           # Shared MCP tool definitions
│   ├── types.ts           # TypeScript interfaces
│   ├── twitter/
│   │   └── client.ts      # FxTwitter API client
│   └── utils/
│       └── formatter.ts   # Tweet→Markdown/Blog converters
├── dist/                  # Compiled JavaScript
├── package.json
├── tsconfig.json
└── README.md
```

---

## Roadmap

- [ ] Full thread crawling (parent + replies)
- [ ] Twitter API v2 support (for replies)
- [ ] Caching layer (Redis/memory)
- [ ] Rate limit handling
- [ ] Webhook support for real-time updates
- [ ] Multiple output templates

---

## License

MIT

## Contributing

Contributions welcome! Please open an issue or PR.

## Support

- Issues: https://github.com/zezeron/tweetsave-mcp/issues
- Twitter: [@zezeron](https://x.com/zezeron)
