import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { parseDutchDate, parseHlbAaltjesText } from '@/lib/parser';

function fixture(name: string) {
  return fs.readFileSync(path.join(process.cwd(), 'tests/fixtures', name), 'utf8');
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
});

describe('parseDutchDate', () => {
  it('parses Dutch dates', () => {
    const date = parseDutchDate('18 februari 2020');
    expect(date?.toISOString().slice(0, 10)).toBe('2020-02-18');
  });
});
