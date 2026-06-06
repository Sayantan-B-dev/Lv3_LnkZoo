import sql from '@/lib/db';

const GROQ_API_KEY = process.env.GROQ_API_KEY;

function normalizeTag(tag: string): string {
  return tag.trim().toLowerCase().replace(/^#/, '');
}

interface TagSuggestion {
  name: string;
  exists: boolean;
}

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
  'may', 'might', 'shall', 'can', 'need', 'dare', 'ought', 'used',
  'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they',
  'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'its', 'our', 'their',
  'mine', 'yours', 'hers', 'its', 'ours', 'theirs',
  'in', 'on', 'at', 'by', 'for', 'with', 'about', 'against', 'between', 'into',
  'through', 'during', 'before', 'after', 'above', 'below', 'from', 'up', 'down',
  'to', 'of', 'off', 'out', 'over', 'under', 'again', 'further', 'then', 'once',
  'and', 'but', 'or', 'nor', 'not', 'so', 'yet', 'both', 'either', 'neither',
  'each', 'every', 'all', 'any', 'few', 'more', 'most', 'other', 'some', 'such',
  'no', 'only', 'own', 'same', 'very', 'just', 'also', 'too', 'as', 'if',
  'because', 'than', 'what', 'which', 'who', 'whom', 'whose', 'when', 'where',
  'why', 'how', 'here', 'there', 'then',
  'list', 'tags', 'tag', 'selection', 'selections', 'analyze', 'analysis',
  'request', 'subject', 'topic', 'core', 'functionality', 'keywords', 'keyword',
  'constraints', 'constraint', 'output', 'input', 'format', 'lowercase',
  'single', 'words', 'word', 'description', 'title', 'identify', 'suggest',
  'suggestion', 'relevant', 'common', 'community', 'developer', 'general',
  'specific', 'company', 'name', 'based', 'text', 'content', 'check', 'checking',
  'step', 'steps', 'first', 'second', 'third', 'final', 'note', 'notes',
]);

function extractTags(text: string): string[] {
  const selections = [...text.matchAll(/selection\s*[:\d]+\s*["']?(\w[\w-]*)["']?/gi)];
  if (selections.length >= 2) {
    return [...new Set(selections.map(m => m[1].toLowerCase()))].slice(0, 5);
  }

  const words: string[] = text.match(/[a-z][\w-]*/gi) ?? [];
  return [...new Set(words.filter(w => !STOP_WORDS.has(w)).map(w => w.toLowerCase()))].slice(0, 5);
}

async function callGroq(title: string, description: string): Promise<string[]> {
  if (!GROQ_API_KEY) return [];

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: `Suggest 3-5 tags for "${title}" — ${description || ''}. Tags: lowercase, single words. Reply: "tag1, tag2, tag3"` }],
      max_tokens: 50,
      temperature: 0.1,
    }),
    signal: AbortSignal.timeout(20000),
  });

  if (!res.ok) {
    console.error('[autoTag] Groq API error:', res.status, await res.text().catch(() => ''));
    return [];
  }

  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content ?? '';
  return extractTags(text);
}

export async function suggestTags(title: string, description: string): Promise<TagSuggestion[]> {
  const aiTags = await callGroq(title, description);
  if (aiTags.length === 0) return [];

  const normalized = aiTags.map(t => ({ original: t, normalized: normalizeTag(t) }));
  const uniqueNormals = [...new Set(normalized.map(n => n.normalized))].filter(Boolean);

  if (uniqueNormals.length === 0) return [];

  const existing = await sql`
    SELECT normalized_name, name FROM tags
    WHERE normalized_name = ANY(${uniqueNormals})
  `;

  const existingMap = new Map<string, string>();
  for (const row of existing) {
    existingMap.set(row.normalized_name, row.name);
  }

  return uniqueNormals.map(n => ({
    name: existingMap.get(n) ?? n,
    exists: existingMap.has(n),
  }));
}
