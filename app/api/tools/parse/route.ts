import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-utils';
import { parseOGMetadata } from '@/services/linkParser.service';
import { suggestTags } from '@/services/autoTag.service';

const STOP_WORDS = new Set([
  'the','a','an','is','are','was','were','be','been','being',
  'have','has','had','do','does','did','will','would','could','should',
  'may','might','shall','can','need','dare','ought','used',
  'this','that','these','those','i','you','he','she','it','we','they',
  'me','him','her','us','them','my','your','his','its','our','their',
  'in','on','at','by','for','with','about','against','between','into',
  'through','during','before','after','above','below','from','up','down',
  'to','of','off','out','over','under','again','further','then','once',
  'and','but','or','nor','not','so','yet','both','either','neither',
  'each','every','all','any','few','more','most','other','some','such',
  'no','only','own','same','very','just','also','too','as','if',
  'because','than','what','which','who','whom','whose','when','where',
  'why','how','here','there','then','get','use','using','new','top',
  'best','guide','how','what','why','make','making',
]);

function fallbackTags(title: string, description: string): Array<{ name: string; exists: boolean }> {
  const text = `${title} ${description}`.toLowerCase();
  const words = text.match(/[a-z][\w'-]*/gi) ?? [];
  const unique = [...new Set(words.filter(w => w.length > 2 && !STOP_WORDS.has(w)))].slice(0, 5);
  return unique.map(name => ({ name, exists: false }));
}

export const POST = apiHandler(async (req: NextRequest) => {
  try {
    const { url } = await req.json();
    if (!url) return NextResponse.json({ error: 'url required' }, { status: 400 });

    const { title, description, image, domain } = await parseOGMetadata(url);

    const suggestedTags = await suggestTags(title, description);
    const tags = suggestedTags.length > 0 ? suggestedTags : fallbackTags(title, description);

    return NextResponse.json({ title, description, image, domain, url, suggestedTags: tags });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to parse URL', detail: err?.message }, { status: 422 });
  }
});
