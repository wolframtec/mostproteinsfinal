# Social Media Crawler Detection Setup

This setup ensures social media platforms (Facebook, Twitter, LinkedIn, etc.) can properly read your Open Graph (OG) tags when your content is shared.

## How It Works

Your site already has OG tags in the static HTML (thanks to Next.js static export). This adds an extra layer to:

1. **Detect social crawlers** by their User-Agent strings
2. **Add cache headers** optimized for crawler behavior
3. **Add debugging headers** so you can verify it's working
4. **Ensure proper charset** declarations for OG tag parsing

## Setup Options

### Option 1: Cloudflare Pages Functions (Recommended for Frontend)

The file `functions/_middleware.ts` will automatically run on Cloudflare Pages edge workers.

**To enable:**

1. The file is already created at `functions/_middleware.ts`
2. Deploy your site - Cloudflare Pages will automatically detect and use it
3. No additional configuration needed

**How it works:**
- Every request to your Pages site goes through this middleware
- If a social crawler is detected, special headers are added
- Static HTML with OG tags is served normally

### Option 2: API Worker Middleware (For API routes)

The API worker (`workers/src/index.ts`) also has the middleware applied for API routes.

This is mainly for debugging API calls from social platforms.

## Testing

### Test with curl (simulate Facebook crawler):

```bash
# Facebook crawler
curl -sI -A "facebookexternalhit/1.1" https://mostproteins.com/

# Should see: X-Crawler-Type: facebook

# Twitter crawler
curl -sI -A "Twitterbot/1.0" https://mostproteins.com/

# Should see: X-Crawler-Type: twitter

# Regular user (no special headers)
curl -sI -A "Mozilla/5.0" https://mostproteins.com/

# Should NOT see X-Crawler-Type header
```

### Test OG tags are present:

```bash
# Check OG tags in HTML
curl -s https://mostproteins.com/ | grep -o '<meta[^>]*property="og:[^"]*"[^>]*>'

# Should see og:title, og:description, og:image, etc.
```

### Online Testing Tools:

| Platform | Testing Tool |
|----------|-------------|
| Facebook | https://developers.facebook.com/tools/debug/ |
| Twitter/X | https://cards-dev.twitter.com/validator |
| LinkedIn | https://www.linkedin.com/post-inspector/ |
| Pinterest | https://developers.pinterest.com/tools/url-debugger/ |
| All-in-one | https://www.opengraph.xyz/ |

## Detected Crawlers

The middleware detects these User-Agents:

- **Facebook**: `facebookexternalhit`, `facebookcatalog`
- **Twitter/X**: `twitterbot`
- **LinkedIn**: `linkedinbot`
- **Pinterest**: `pinterest`, `pinterestbot`
- **WhatsApp**: `whatsapp`
- **Discord**: `discordbot`
- **Slack**: `slackbot`, `slack`
- **Telegram**: `telegrambot`, `telegram`
- **Skype**: `skypeuripreview`
- **Google**: `googlebot` (for rich snippets)
- **Bing**: `bingbot`
- **Reddit**: `redditbot`
- **Apple**: `applebot`
- **Snapchat**: `snapchat`
- **TikTok**: `tiktok`
- **Others**: Embedly, Quora, Outbrain

## Headers Added for Crawlers

When a social crawler is detected, these headers are added:

```
X-Crawler-Type: facebook          # Type of crawler detected
Cache-Control: public, max-age=3600  # 1 hour cache for crawlers
Vary: User-Agent                   # Important for cache differentiation
Content-Type: text/html; charset=utf-8  # Ensures proper charset
```

## Troubleshooting

### OG tags not showing in sharing previews?

1. **Verify HTML has OG tags:**
   ```bash
   curl -s https://mostproteins.com/ | grep "og:"
   ```

2. **Check crawler detection:**
   ```bash
   curl -sI -A "facebookexternalhit/1.1" https://mostproteins.com/ | grep "X-Crawler-Type"
   ```

3. **Test with Facebook Debugger:**
   - Go to https://developers.facebook.com/tools/debug/
   - Enter your URL
   - Click "Scrape Again" to clear cache

4. **Check image URLs are absolute:**
   - OG image URLs must be absolute (https://...)
   - Relative URLs (/images/...) won't work

### Cache issues?

Social platforms cache aggressively. If you update OG tags:

1. **Facebook**: Use the Debugger and click "Scrape Again"
2. **Twitter**: Use the Card Validator and clear cache
3. **LinkedIn**: Use Post Inspector

### Pages Functions not running?

Make sure:
1. File is at `functions/_middleware.ts` (not `.js`)
2. You're deploying to Cloudflare Pages (not just static hosting)
3. Check Functions logs in Cloudflare Dashboard

## Architecture

```
User Request → Cloudflare Edge
    ↓
Is it a social crawler? → Yes → Add crawler headers → Serve HTML with OG tags
    ↓ No
Serve HTML normally
```

The HTML is already prerendered with OG tags (Next.js static export), so crawlers get the full content immediately without JavaScript execution.

## Why This Matters

Most social platforms **do NOT execute JavaScript** when crawling. They only read the raw HTML. Since your site uses static export, the OG tags are already in the HTML source - this middleware just ensures optimal caching and debugging.

## Files Modified/Created

1. `functions/_middleware.ts` - Pages Functions middleware
2. `workers/src/middleware/socialCrawler.ts` - API worker middleware
3. `workers/src/index.ts` - Updated to use middleware

## Deployment

After these changes:

```bash
npm run build
npm run deploy
```

The middleware will be active immediately on Cloudflare's edge network.
