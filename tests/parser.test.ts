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
