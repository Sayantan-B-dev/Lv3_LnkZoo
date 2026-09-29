/**
 * SSRF guard for any server-side fetch of a URL a user supplied.
 *
 * The server sits inside the deployment's private network, so a plain
 * `fetch(userUrl)` lets anyone reach things the visitor cannot: `127.0.0.1`,
 * other services on the internal network, and the cloud metadata endpoint at
 * `169.254.169.254` (which hands out credentials). Redirects are the usual way
 * around a naive check — a public host that 302s to `127.0.0.1` — so the guard
 * has to be re-applied to every hop. Use `fetchRemote()` rather than calling
 * `fetch()` directly.
 *
 * Hostnames are checked after `new URL()` canonicalises them: the WHATWG URL
 * parser normalises the alternate IPv4 spellings (`2130706433`, `0x7f000001`,
 * `017700000001`, `127.1`) to a dotted quad, so they cannot slip past on
 * formatting alone.
 *
 * This is a name/IP-based guard, not a DNS-rebinding-proof one: a hostname that
 * resolves to a private address at request time is not caught. That needs a
 * resolver check or an egress proxy, which the current runtime does not give us.
 */

/** Exact hostnames that are never a legitimate target for a public link. */
const BLOCKED_HOSTNAMES = [
  'localhost',
  'localhost.localdomain',
  'metadata',
  'metadata.google.internal',
  'instance-data',
];

/** Suffixes that only ever resolve inside a private network. */
const BLOCKED_SUFFIXES = [
  '.localhost',
  '.local',
  '.internal',
  '.intranet',
  '.lan',
  '.home.arpa',
  '.in-addr.arpa',
];

const MAX_REDIRECTS = 3;

export type UrlCheck = { ok: true; url: URL } | { ok: false; reason: string };

function stripBrackets(host: string): string {
  return host.startsWith('[') && host.endsWith(']') ? host.slice(1, -1) : host;
}

function isIpv4(host: string): boolean {
  const parts = host.split('.');
  if (parts.length !== 4) return false;
  return parts.every((p) => /^\d{1,3}$/.test(p) && Number(p) <= 255);
}

function isBlockedIpv4(host: string): boolean {
  const [a, b] = host.split('.').map(Number);
  if (a === 0 || a === 10 || a === 127) return true; // "this host", private, loopback
  if (a === 169 && b === 254) return true; // link-local + cloud metadata
  if (a === 172 && b >= 16 && b <= 31) return true; // private
  if (a === 192 && b === 168) return true; // private
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
  if (a === 198 && (b === 18 || b === 19)) return true; // benchmarking
  if (a >= 224) return true; // multicast + reserved + broadcast
  return false;
}

function isBlockedIpv6(host: string): boolean {
  const h = host.toLowerCase();
  if (h === '::' || h === '::1') return true; // unspecified + loopback
  if (/^fe[89ab]/.test(h)) return true; // fe80::/10 link-local
  if (h.startsWith('fc') || h.startsWith('fd')) return true; // fc00::/7 unique-local
  if (h.startsWith('ff')) return true; // multicast
  // IPv4-mapped (-::ffff:1.2.3.4) and IPv4-compatible forms.
  const embedded = h.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/);
  if (embedded && isBlockedIpv4(embedded[1])) return true;
  return false;
}

/** Is this URL safe for the server to request? */
export function checkRemoteUrl(raw: string): UrlCheck {
  if (typeof raw !== 'string' || !raw.trim()) {
    return { ok: false, reason: 'No URL provided' };
  }

  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return { ok: false, reason: 'That is not a valid URL' };
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return { ok: false, reason: 'Only http and https links are supported' };
  }
  if (url.username || url.password) {
    return { ok: false, reason: 'Links with embedded credentials are not allowed' };
  }

  const host = stripBrackets(url.hostname).toLowerCase();
  if (!host) return { ok: false, reason: 'That link has no host' };

  if (BLOCKED_HOSTNAMES.includes(host)) {
    return { ok: false, reason: 'That host cannot be reached from our servers' };
  }
  if (BLOCKED_SUFFIXES.some((suffix) => host.endsWith(suffix))) {
    return { ok: false, reason: 'That host cannot be reached from our servers' };
  }

  // A literal address, or a bare intranet name with no dot.
  if (isIpv4(host)) {
    if (isBlockedIpv4(host)) {
      return { ok: false, reason: 'Private and local addresses are not allowed' };
    }
    return { ok: true, url };
  }
  if (host.includes(':')) {
    if (isBlockedIpv6(host)) {
      return { ok: false, reason: 'Private and local addresses are not allowed' };
    }
    return { ok: true, url };
  }
  if (!host.includes('.')) {
    return { ok: false, reason: 'That host cannot be reached from our servers' };
  }

  return { ok: true, url };
}

/**
 * Fetch a user-supplied URL with the guard applied to the first request **and
 * every redirect**. Returns `null` when a hop is rejected, so callers fall back
 * instead of following it.
 */
export async function fetchRemote(
  raw: string,
  init: RequestInit = {},
  maxRedirects: number = MAX_REDIRECTS
): Promise<Response | null> {
  let current = checkRemoteUrl(raw);
  if (!current.ok) return null;

  for (let hop = 0; hop <= maxRedirects; hop++) {
    const res = await fetch(current.url, { ...init, redirect: 'manual' });

    if (res.status < 300 || res.status >= 400) return res;

    const location = res.headers.get('location');
    if (!location) return res;

    let next: UrlCheck;
    try {
      next = checkRemoteUrl(new URL(location, current.url).href);
    } catch {
      return null;
    }
    if (!next.ok) return null;
    current = next;
  }

  // Too many hops — treat it as unreachable rather than following blindly.
  return null;
}
