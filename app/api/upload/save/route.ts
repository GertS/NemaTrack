import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseDutchDate, ParsedDocument } from '@/lib/parser';

export async function POST(request: Request) {
  const body = (await request.json()) as {
    originalFilename: string;
    pdfText?: string | null;
    extracted: ParsedDocument;
    linkedFieldId?: number | null;
    newFieldName?: string;
  };

  const sample = body.extracted.samples[0];
  if (!sample) return NextResponse.json({ error: 'Geen sample in extractie' }, { status: 400 });

  let linkedFieldId = body.linkedFieldId ?? null;
  if (!linkedFieldId && body.newFieldName?.trim()) {
    const field = await prisma.field.create({ data: { name: body.newFieldName.trim() } });
    linkedFieldId = field.id;
  }

  const document = await prisma.document.create({
    data: {
      originalFilename: body.originalFilename,
      pdfText: body.pdfText ?? null,
      extractedJson: JSON.stringify(body.extracted, null, 2),
      labName: body.extracted.labName ?? null,
      samples: {
        create: {
          sampleNumber: sample.sampleNumber ?? null,
          pdfFieldName: sample.pdfFieldName ?? null,
          receivedDate: parseDutchDate(sample.receivedDate),
          reportDate: parseDutchDate(sample.reportDate),
          linkedFieldId,
          measurements: {
            create: sample.measurements.map((m) => ({
              analyteKey: m.analyteKey,
              value: m.value,
              unit: m.unit,
              category: m.category ?? null
            }))
          },
          cystResult: sample.cystResult
            ? {
                create: {
                  cystCount: sample.cystResult.cystCount ?? null,
                  lleCount: sample.cystResult.lleCount ?? null,
                  infestationGrade: sample.cystResult.infestationGrade ?? null
                }
              }
            : undefined
        }
      }
    },
    include: { samples: true }
  });

  return NextResponse.json({ id: document.id, sampleId: document.samples[0]?.id });
}
