import { NextResponse } from 'next/server';
import pdfParse from 'pdf-parse';
import { parseHlbAaltjesText } from '@/lib/parser';
import { demoParsedDocument } from '@/lib/seed-data';

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get('file');

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Geen bestand ontvangen' }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  let text = '';
  try {
    const parsed = await pdfParse(buffer);
    text = parsed.text || '';
  } catch {
    text = '';
  }

  const parsed = text.trim() ? parseHlbAaltjesText(text) : demoParsedDocument(file.name);

  return NextResponse.json({
    originalFilename: file.name,
    pdfText: text || null,
    extracted: parsed
  });
}
