const ENTITY_MAP: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&#x27;': "'",
  '&#x2F;': '/',
  '&#x60;': '`',
  '&#x3C;': '<',
  '&#x3E;': '>',
  '&#38;': '&',
  '&#34;': '"',
  '&#160;': ' ',
  '&nbsp;': ' ',
  '&mdash;': '\u2014',
  '&ndash;': '\u2013',
  '&hellip;': '\u2026',
  '&copy;': '\u00A9',
  '&reg;': '\u00AE',
  '&trade;': '\u2122',
  '&bull;': '\u2022',
  '&middot;': '\u00B7',
  '&raquo;': '\u00BB',
  '&laquo;': '\u00AB',
  '&lsquo;': '\u2018',
  '&rsquo;': '\u2019',
  '&ldquo;': '\u201C',
  '&rdquo;': '\u201D',
};

export function decodeHtmlEntities(text: string): string {
  return text.replace(/&(#x?[0-9a-fA-F]+|\w+);/g, (match) => {
    if (ENTITY_MAP[match]) return ENTITY_MAP[match];
    if (match.startsWith('&#x')) return String.fromCharCode(parseInt(match.slice(3, -1), 16));
    if (match.startsWith('&#')) return String.fromCharCode(parseInt(match.slice(2, -1), 10));
    return match;
  });
}
