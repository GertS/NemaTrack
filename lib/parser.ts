export type ParsedMeasurement = {
  analyteKey: string;
  value: number;
  unit: string;
  category?: string;
};

export type ParsedSample = {
  sampleNumber?: string;
  pdfFieldName?: string;
  receivedDate?: string;
  reportDate?: string;
  measurements: ParsedMeasurement[];
  cystResult?: {
    cystCount?: number;
    lleCount?: number;
    infestationGrade?: string;
  };
};

export type ParsedDocument = {
  labName?: string;
  samples: ParsedSample[];
  warnings: string[];
};

const MONTHS: Record<string, number> = {
  januari: 0,
  februari: 1,
  maart: 2,
  april: 3,
  mei: 4,
  juni: 5,
  juli: 6,
  augustus: 7,
  september: 8,
  oktober: 9,
  november: 10,
  december: 11
};

export function parseDutchDate(value?: string): Date | undefined {
  if (!value) return undefined;
  const match = value.trim().toLowerCase().match(/(\d{1,2})\s+([a-z]+)\s+(\d{4})/);
  if (!match) return undefined;
  const month = MONTHS[match[2]];
  if (month === undefined) return undefined;
  const date = new Date(Number(match[3]), month, Number(match[1]));
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export function parseHlbAaltjesText(text: string): ParsedDocument {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean);

  const warnings: string[] = [];
  const sample: ParsedSample = { measurements: [] };

  const content = lines.join('\n');
  if (/HLB/i.test(content)) {
    const labLine = lines.find((line) => /HLB/i.test(line));
    if (labLine) {
      // keep simple for MVP
    }
  }

  sample.sampleNumber = firstMatch(content, [/Monsternummer\s*:?\s*(\d{6,})/i]);
  sample.pdfFieldName = firstMatch(content, [
    /Perceel\s*:?\s*([^\n]+)/i,
    /Perceel\s*([A-Za-z0-9 .\-/]+)/i
  ])?.split(' Datum')[0].trim();
  sample.receivedDate = firstMatch(content, [/Datum ontvangst\s*:?\s*([^\n]+)/i]);
  sample.reportDate = firstMatch(content, [/Datum verslag\s*:?\s*([^\n]+)/i]);

  const measurementRows = extractMeasurementRows(lines);
  sample.measurements = measurementRows;

  const cyst = extractCyst(lines);
  if (cyst) sample.cystResult = cyst;

  if (!sample.sampleNumber) warnings.push('sampleNumber niet gevonden');
  if (!sample.pdfFieldName) warnings.push('pdfFieldName niet gevonden');
  if (sample.measurements.length === 0) warnings.push('geen metingen gevonden');

  return {
    labName: /HLB/i.test(content) ? 'HLB' : undefined,
    samples: [sample],
    warnings
  };
}

function firstMatch(input: string, patterns: RegExp[]): string | undefined {
  for (const p of patterns) {
    const m = input.match(p);
    if (m?.[1]) return m[1].trim();
  }
  return undefined;
}

function extractMeasurementRows(lines: string[]): ParsedMeasurement[] {
  const out: ParsedMeasurement[] = [];
  for (const line of lines) {
    if (!/[A-Za-z].*\d+$/.test(line)) continue;
    if (/Monsternummer|Debiteurnummer|Datum ontvangst|Datum verslag|Soort monster|Cysteaaltjes|besmettingsgraad/i.test(line)) continue;

    const match = line.match(/^(.+?)\s+(\d+(?:[\.,]\d+)?)\s*(\*{0,2})$/);
    if (!match) continue;

    const analyte = cleanAnalyte(match[1]);
    if (analyte.length < 3) continue;

    const value = Number(match[2].replace(',', '.'));
    if (Number.isNaN(value)) continue;

    out.push({ analyteKey: analyte, value, unit: 'aantal per 100 gram grond' });
  }
  return out;
}

function cleanAnalyte(input: string): string {
  return input
    .replace(/Vrijlevende aaltjes|Wortellesieaaltjes|Wortelknobbelaaltjes|Vrijlevende wortelaaltjes|Stengelaaltjes|Overige plantparasitaire aaltjes|Niet plantparasitaire aaltjes/gi, '')
    .replace(/[()]/g, '')
    .replace(/spp\.?/gi, 'spp.')
    .trim();
}

function extractCyst(lines: string[]): ParsedSample['cystResult'] | undefined {
  const idx = lines.findIndex((line) => /Cysteaaltjes/i.test(line));
  if (idx === -1) return undefined;
  for (let i = idx + 1; i < Math.min(lines.length, idx + 8); i++) {
    const m = lines[i].match(/([A-Za-z]+.*)\s+(\d+)\s+(\d+)\s+([A-Za-z ]+)/);
    if (m) {
      return {
        cystCount: Number(m[2]),
        lleCount: Number(m[3]),
        infestationGrade: m[4].trim()
      };
    }
  }
  return undefined;
}
