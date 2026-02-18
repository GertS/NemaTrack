import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import pdfParse from 'pdf-parse';
import { parseDutchDate, parseHlbAaltjesText } from '@/lib/parser';

function fixture(name: string) {
  return fs.readFileSync(path.join(process.cwd(), 'tests/fixtures', name), 'utf8');
}

function fixturePdf(name: string) {
  return fs.readFileSync(path.join(process.cwd(), 'tests/fixtures', name));
}

describe('parseHlbAaltjesText', () => {
  it('parsed HLB sample for 2004537 with cyst results', () => {
    const out = parseHlbAaltjesText(fixture('hlb-2004537.txt'));
    expect(out.samples[0].sampleNumber).toBe('2004537');
    expect(out.samples[0].pdfFieldName).toContain('Barlage 4');
    expect(out.samples[0].measurements.length).toBeGreaterThanOrEqual(3);
    expect(out.samples[0].cystResult?.cystCount).toBe(62);
  });

  it('parsed HLB sample for 2309991001', () => {
    const out = parseHlbAaltjesText(fixture('hlb-2309991001.txt'));
    expect(out.samples[0].sampleNumber).toBe('2309991001');
    expect(out.samples[0].measurements.some((m) => m.analyteKey.includes('Pratylenchus penetrans'))).toBe(true);
  });

  it('parses OCR split lines where values are on next line', () => {
    const out = parseHlbAaltjesText(fixture('hlb-ocr-split.txt'));
    expect(out.samples[0].measurements.some((m) => m.analyteKey === 'Pratylenchus penetrans' && m.value === 245)).toBe(true);
    expect(out.samples[0].measurements.some((m) => m.analyteKey === 'Meloidogyne hapla' && m.value === 31)).toBe(true);
  });

  it('parses key/value metadata from dense inline OCR text', () => {
    const out = parseHlbAaltjesText(fixture('hlb-inline-mixed.txt'));
    expect(out.samples[0].sampleNumber).toBe('2309991001');
    expect(out.samples[0].pdfFieldName).toContain('H1');
    expect(out.samples[0].reportDate).toContain('22 maart 2023');
  });

  it('best effort on incomplete text without crashing', () => {
    const out = parseHlbAaltjesText(fixture('hlb-edge-case.txt'));
    expect(out.samples).toHaveLength(1);
    expect(out.samples[0].measurements).toHaveLength(0);
    expect(out.warnings.length).toBeGreaterThan(0);
  });

  it('filters out metadata rows that look like field names, dates or locations', () => {
    const out = parseHlbAaltjesText(fixture('hlb-metadata-noise.txt'));
    const measurements = out.samples[0].measurements;

    expect(measurements).toHaveLength(1);
    expect(measurements[0]).toMatchObject({ analyteKey: 'Pratylenchus penetrans', value: 245 });
    expect(measurements.some((m) => /Smeerling|Veenhuizen/i.test(m.analyteKey))).toBe(false);
  });

  it('parses bundled PDF fixtures with realistic OCR noise', async () => {
    const pdf2004531 = await pdfParse(fixturePdf('2004531 - klantnaam. - Smeerling 1.pdf'));
    const out2004531 = parseHlbAaltjesText(pdf2004531.text);

    expect(out2004531.samples[0].sampleNumber).toBe('2004531');
    expect(out2004531.samples[0].pdfFieldName).toBe('Smeerling 1');
    expect(out2004531.samples[0].receivedDate).toBe('27 maart 2020');
    expect(out2004531.samples[0].reportDate).toBe('18 februari 2020');
    expect(out2004531.samples[0].measurements.some((m) => m.analyteKey === 'Tylenchorhynchus spp.' && m.value === 300)).toBe(true);
    expect(out2004531.samples[0].measurements.some((m) => /Smeerling|Veenhuizen/i.test(m.analyteKey))).toBe(false);

    const pdf2309991009 = await pdfParse(fixturePdf('2309991009 - klantnaam - SM1.pdf'));
    const out2309991009 = parseHlbAaltjesText(pdf2309991009.text);

    expect(out2309991009.samples[0].sampleNumber).toBe('2309991009');
    expect(out2309991009.samples[0].pdfFieldName).toBe('SM1');
    expect(out2309991009.samples[0].receivedDate).toBe('27 maart 2024');
    expect(out2309991009.samples[0].reportDate).toBe('9 april 2024');
  });
});

describe('parseDutchDate', () => {
  it('parses Dutch dates', () => {
    const date = parseDutchDate('18 februari 2020');
    expect(date?.toISOString().slice(0, 10)).toBe('2020-02-18');
  });
});
