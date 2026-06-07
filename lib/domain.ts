export function extractDomain(originalUrl: string): string {
  try {
    const hostname = new URL(originalUrl).hostname;
    return hostname.replace(/^www\./, '');
  } catch {
    return originalUrl;
  }
}

export function toCategoryName(domain: string): string {
  const withoutWww = domain.replace(/^www\./, '');
  const parts = withoutWww.split('.');
  if (parts.length <= 2) return parts[0];
  return parts[parts.length - 2];
}
