import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-utils';
import { parseOGMetadata } from '@/services/linkParser.service';
import { suggestTags } from '@/services/autoTag.service';

export const POST = apiHandler(async (req: NextRequest) => {
  try {
    const { url } = await req.json();
    if (!url) return NextResponse.json({ error: 'url required' }, { status: 400 });

    const { title, description, image, domain } = await parseOGMetadata(url);

    const tags = await suggestTags(title, description);

    return NextResponse.json({ title, description, image, domain, url, suggestedTags: tags });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to parse URL', detail: err?.message }, { status: 422 });
  }
});
