/**
 * Hook to generate share URLs for social media sharing.
 * 
 * Share URLs use the og-meta edge function which returns server-rendered
 * HTML with proper OG meta tags for crawlers, then redirects humans
 * to the actual page.
 */

const SITE_URL = "https://www.jokabeatz.com";

interface ShareUrls {
  /** URL for social media sharing (edge function with OG tags) */
  shareUrl: string;
  /** Direct URL to the actual page */
  directUrl: string;
}

/**
 * Generate share URLs for a given path
 * @param path - The path to share (e.g., "/blog/my-post" or "/shop/my-product")
 * @returns Object with shareUrl (for social) and directUrl (for direct linking)
 */
export function getShareUrls(path: string): ShareUrls {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const fullUrl = `${SITE_URL}${cleanPath}`;

  return {
    // Use clean site URL for sharing — social crawlers will fetch OG tags from the page itself
    shareUrl: fullUrl,
    directUrl: fullUrl,
  };
}

/**
 * Hook version for use in React components
 */
export function useShareUrl(path: string): ShareUrls {
  return getShareUrls(path);
}

/**
 * Format share text with caption and hashtags, platform-aware
 */
export function formatShareText(
  caption: string,
  hashtags: string[],
  platform: 'twitter' | 'facebook' | 'linkedin' | 'whatsapp'
): string {
  const hashtagString = hashtags.map(h => `#${h}`).join(" ");
  
  if (platform === 'twitter') {
    // Twitter: 280 chars max, reserve space for URL (~23 chars) and hashtags
    const maxCaptionLength = 200 - hashtagString.length;
    const trimmedCaption = caption.length > maxCaptionLength 
      ? caption.slice(0, maxCaptionLength - 3) + "..."
      : caption;
    return `${trimmedCaption}\n\n${hashtagString}`;
  }
  
  // Other platforms: full caption + hashtags
  return `${caption}\n\n${hashtagString}`;
}

/**
 * Open share dialog for different platforms
 */
export function openShareWindow(
  platform: 'twitter' | 'facebook' | 'linkedin' | 'whatsapp',
  shareUrl: string,
  title: string,
  caption?: string,
  hashtags?: string[]
) {
  const shareText = caption && hashtags?.length 
    ? formatShareText(caption, hashtags, platform)
    : title;

  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedText = encodeURIComponent(shareText);
  
  const urls: Record<string, string> = {
    twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    whatsapp: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
  };

  window.open(urls[platform], "_blank", "width=600,height=400");
}
