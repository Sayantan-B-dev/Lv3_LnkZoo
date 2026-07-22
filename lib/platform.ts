export async function fetchOEmbed(url: string): Promise<{ title: string; description: string; image: string } | null> {
  const hostname = new URL(url).hostname.toLowerCase();

  try {
    // X/Twitter
    if (hostname === 'x.com' || hostname === 'twitter.com') {
      const oembedUrl = `https://publish.twitter.com/oembed?url=${encodeURIComponent(url)}`;
      const res = await fetch(oembedUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        signal: AbortSignal.timeout(5000),
      });
      if (res.ok) {
        const data = await res.json();
        const textMatch = data.html?.match(/<p[^>]*>([^<]+)<\/p>/i);
        const text = textMatch ? textMatch[1].trim() : '';
        const title = text || `${data.author_name || 'Post'} on X`;
        return { title, description: `by ${data.author_name || 'Unknown'}`, image: '' };
      }
    }
  } catch {}

  return null;
}

export function fallbackTitle(url: string): string | null {
  try {
    const hostname = new URL(url).hostname.toLowerCase();

    if (hostname.includes('instagram')) {
      const path = url.toLowerCase();
      if (path.includes('/reel/')) return 'Instagram Reel';
      if (path.includes('/p/')) return 'Instagram Post';
      if (path.includes('/tv/')) return 'Instagram Video';
      return 'Instagram';
    }

    if (hostname.includes('facebook') || hostname.includes('fb.com')) {
      if (pathIncludes(url, ['/share/', '/posts/', '/video/', '/watch/', '/reel/'])) return 'Facebook Post';
      return 'Facebook';
    }

    if (hostname.includes('threads')) {
      const atMatch = url.match(/@([a-zA-Z0-9_.]+)/);
      return atMatch ? `Threads by @${atMatch[1]}` : 'Threads Post';
    }

    if (hostname === 'x.com' || hostname.includes('twitter')) {
      return 'Post on X';
    }

    if (hostname.includes('youtube') || hostname.includes('youtu.be')) {
      if (url.includes('/playlist')) return 'YouTube Playlist';
      if (url.includes('/shorts/')) return 'YouTube Shorts';
      return 'YouTube Video';
    }

    if (hostname.includes('linkedin')) {
      if (pathIncludes(url, ['/posts/', '/company/', '/in/'])) return 'LinkedIn Post';
      return 'LinkedIn';
    }

    return null;
  } catch {
    return null;
  }
}

function pathIncludes(url: string, patterns: string[]): boolean {
  try {
    const path = new URL(url).pathname.toLowerCase();
    return patterns.some(p => path.includes(p));
  } catch {
    return false;
  }
}
