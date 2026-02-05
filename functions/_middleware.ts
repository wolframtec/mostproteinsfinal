/**
 * Cloudflare Pages Functions Middleware
 * 
 * This runs on Cloudflare Pages edge workers before serving your static site.
 * It detects social media crawlers and ensures they get proper OG tag handling.
 * 
 * Place this file at: functions/_middleware.ts
 */

interface Env {
  // Add any environment variables you need
}

// List of known social media crawlers
const SOCIAL_CRAWLERS = [
  'facebookexternalhit',
  'facebookcatalog',
  'twitterbot',
  'twitter/',
  'linkedinbot',
  'pinterest',
  'pinterestbot',
  'whatsapp',
  'discordbot',
  'slackbot',
  'slack',
  'telegrambot',
  'telegram',
  'skypeuripreview',
  'googlebot',
  'bingbot',
  'redditbot',
  'applebot',
  'snapchat',
  'tiktok',
  'embedly',
  'quora link preview',
  'showyoubot',
  'outbrain',
];

function isSocialCrawler(userAgent: string): boolean {
  const ua = userAgent.toLowerCase();
  return SOCIAL_CRAWLERS.some(crawler => ua.includes(crawler.toLowerCase()));
}

function getCrawlerType(userAgent: string): string | null {
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
  return 'other';
}

export const onRequest = async (
  context: {
    request: Request;
    next: () => Promise<Response>;
    env: Env;
    data: Record<string, unknown>;
  }
): Promise<Response> => {
  const { request, next } = context;
  const userAgent = request.headers.get('User-Agent') || '';
  const url = new URL(request.url);
  
  // Check if this is a social media crawler
  if (isSocialCrawler(userAgent)) {
    const crawlerType = getCrawlerType(userAgent);
    
    console.log(`[Crawler] ${crawlerType} accessing ${url.pathname}`);
    
    // Get the response from the static site
    const response = await next();
    
    // Clone and modify headers
    const newHeaders = new Headers(response.headers);
    
    // Add crawler type for debugging
    newHeaders.set('X-Crawler-Type', crawlerType || 'unknown');
    
    // Set cache headers for crawlers (1 hour cache)
    newHeaders.set('Cache-Control', 'public, max-age=3600');
    
    // Ensure proper charset for OG tag parsing
    const contentType = newHeaders.get('Content-Type');
    if (contentType?.includes('text/html') && !contentType.includes('charset')) {
      newHeaders.set('Content-Type', 'text/html; charset=utf-8');
    }
    
    // Important: Vary header tells caches to differentiate by User-Agent
    newHeaders.set('Vary', 'User-Agent');
    
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  }
  
  // Regular user - just pass through
  return next();
};
