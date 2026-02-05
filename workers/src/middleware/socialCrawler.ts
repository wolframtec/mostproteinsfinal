/**
 * Social Media Crawler Detection Middleware
 * 
 * Detects social media crawlers and ensures they receive
 * prerendered HTML with proper OG tags.
 * 
 * This middleware adds:
 * - Cache headers for crawlers (they tend to cache aggressively)
 * - X-Crawler-Type header for debugging
 * - Bypasses any client-side routing for crawlers
 */

// List of known social media and sharing platform crawlers
const SOCIAL_CRAWLERS = [
  // Facebook/Meta
  'facebookexternalhit',
  'facebookcatalog',
  // Twitter/X
  'twitterbot',
  'twitter\/' ,
  // LinkedIn
  'linkedinbot',
  // Pinterest
  'pinterest',
  'pinterestbot',
  // WhatsApp
  'whatsapp',
  // Discord
  'discordbot',
  // Slack
  'slackbot',
  'slack',
  // Telegram
  'telegrambot',
  'telegram',
  // Skype
  'skypeuripreview',
  // Google (for rich snippets)
  'googlebot',
  'google\-bot',
  // Bing
  'bingbot',
  // Reddit
  'redditbot',
  // Apple
  'applebot',
  // Snapchat
  'snapchat',
  // TikTok
  'tiktok',
  // Other social/sharing
  'embedly',
  'quora link preview',
  'showyoubot',
  'outbrain',
  'w3c_validator',
];

/**
 * Check if user agent is a social media crawler
 */
export function isSocialCrawler(userAgent: string): boolean {
  const ua = userAgent.toLowerCase();
  return SOCIAL_CRAWLERS.some(crawler => {
    const pattern = crawler.toLowerCase();
    // Handle regex patterns
    if (pattern.includes('\\') || pattern.includes('^') || pattern.includes('$')) {
      return new RegExp(pattern).test(ua);
    }
    return ua.includes(pattern);
  });
}

/**
 * Get the crawler type for debugging
 */
export function getCrawlerType(userAgent: string): string | null {
  const ua = userAgent.toLowerCase();
  
  if (ua.includes('facebook')) return 'facebook';
  if (ua.includes('twitter')) return 'twitter';
  if (ua.includes('linkedin')) return 'linkedin';
  if (ua.includes('pinterest')) return 'pinterest';
  if (ua.includes('whatsapp')) return 'whatsapp';
  if (ua.includes('discord')) return 'discord';
  if (ua.includes('slack')) return 'slack';
  if (ua.includes('telegram')) return 'telegram';
  if (ua.includes('googlebot')) return 'google';
  if (ua.includes('bingbot')) return 'bing';
  if (ua.includes('applebot')) return 'apple';
  
  return 'other';
}

/**
 * Middleware to handle social media crawlers
 * Adds appropriate headers for crawler caching and debugging
 */
export async function socialCrawlerMiddleware(
  request: Request,
  env: Record<string, unknown>,
  ctx: ExecutionContext,
  next: () => Promise<Response>
): Promise<Response> {
  const userAgent = request.headers.get('User-Agent') || '';
  
  if (!isSocialCrawler(userAgent)) {
    // Not a crawler, proceed normally
    return next();
  }
  
  const crawlerType = getCrawlerType(userAgent);
  const url = new URL(request.url);
  
  console.log(`Social crawler detected: ${crawlerType} accessing ${url.pathname}`);
  
  // Fetch the response
  const response = await next();
  
  // Clone response to modify headers
  const newHeaders = new Headers(response.headers);
  
  // Add crawler identification header (useful for debugging)
  newHeaders.set('X-Crawler-Type', crawlerType || 'unknown');
  
  // Social crawlers prefer longer cache times to reduce load
  // But not too long so updates are picked up
  newHeaders.set('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
  
  // Ensure content is served as HTML with proper charset
  const contentType = newHeaders.get('Content-Type');
  if (contentType && contentType.includes('text/html')) {
    // Make sure charset is specified for proper OG tag parsing
    if (!contentType.includes('charset')) {
      newHeaders.set('Content-Type', `${contentType}; charset=utf-8`);
    }
  }
  
  // Add Vary header so caches distinguish between crawlers and regular users
  newHeaders.set('Vary', 'User-Agent');
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}

/**
 * Standalone handler for Cloudflare Pages Functions
 * Use this if you want to add crawler detection to your Pages site
 * 
 * Example usage in functions/_middleware.ts:
 * 
 * export const onRequest = async (context) => {
 *   return handleSocialCrawler(context.request, context.next);
 * };
 */
export async function handleSocialCrawler(
  request: Request,
  next: () => Promise<Response>
): Promise<Response> {
  const userAgent = request.headers.get('User-Agent') || '';
  
  if (!isSocialCrawler(userAgent)) {
    return next();
  }
  
  const crawlerType = getCrawlerType(userAgent);
  const response = await next();
  
  const newHeaders = new Headers(response.headers);
  newHeaders.set('X-Crawler-Type', crawlerType || 'unknown');
  newHeaders.set('Cache-Control', 'public, max-age=3600');
  newHeaders.set('Vary', 'User-Agent');
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}
