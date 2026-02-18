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

const CATEGORY_WORDS = [
  'Vrijlevende aaltjes',
  'Wortellesieaaltjes',
  'Wortelknobbelaaltjes',
  'Vrijlevende wortelaaltjes',
  'Stengelaaltjes',
  'Overige plantparasitaire aaltjes',
  'Niet plantparasitaire aaltjes'
];

export function parseDutchDate(value?: string): Date | undefined {
  if (!value) return undefined;
  const match = value.trim().toLowerCase().match(/(\d{1,2})\s+([a-zé]+)\s+(\d{4})/);
  if (!match) return undefined;
  const month = MONTHS[match[2]];
  if (month === undefined) return undefined;
  const date = new Date(Number(match[3]), month, Number(match[1]));
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export function parseHlbAaltjesText(text: string): ParsedDocument {
  const lines = normalizeLines(text);
  const content = lines.join('\n');

  const sample: ParsedSample = {
    sampleNumber: extractSimpleValue(lines, /^Monsternummer\s*:?\s*(.+)$/i, /(\d{5,})/),
    pdfFieldName: extractSimpleValue(lines, /^Perceel\s*:?\s*(.+)$/i),
    receivedDate: extractSimpleValue(lines, /^Datum ontvangst\s*:?\s*(.+)$/i, /(\d{1,2}\s+[a-zé]+\s+\d{4})/i),
    reportDate: extractSimpleValue(lines, /^Datum verslag\s*:?\s*(.+)$/i, /(\d{1,2}\s+[a-zé]+\s+\d{4})/i),
    measurements: []
  };

  // fallback op hele content als key/value op één regel slecht ge-OCRd is
  sample.sampleNumber ||= firstCapture(content, [/Monsternummer\s*:?\s*(\d{5,})/i]);
  if (sample.pdfFieldName && !looksLikeFieldName(sample.pdfFieldName)) sample.pdfFieldName = undefined;
  sample.pdfFieldName ||= extractFieldNameFromContent(content);

  const orderedDates = extractOrderedDutchDates(content);
  if (!sample.receivedDate && orderedDates[0]) sample.receivedDate = orderedDates[0];
  if (!sample.reportDate && orderedDates[1]) sample.reportDate = orderedDates[1];

  sample.measurements = extractMeasurementRows(lines);
  sample.cystResult = extractCyst(lines);

  const warnings: string[] = [];
  if (!sample.sampleNumber) warnings.push('sampleNumber niet gevonden');
  if (!sample.pdfFieldName) warnings.push('pdfFieldName niet gevonden');
  if (sample.measurements.length === 0) warnings.push('geen metingen gevonden');

  return {
    labName: /\bHLB\b/i.test(content) ? 'HLB' : undefined,
    samples: [sample],
    warnings
  };
}

function normalizeLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

function extractSimpleValue(lines: string[], linePattern: RegExp, capturePattern?: RegExp): string | undefined {
  for (const line of lines) {
    const base = line.match(linePattern);
    if (!base?.[1]) continue;
    const cleaned = base[1].trim();
    if (!cleaned || cleaned === ':') continue;
    if (!capturePattern) return cleaned;
    const extracted = cleaned.match(capturePattern)?.[1];
    if (extracted) return extracted.trim();
  }
  return undefined;
}

function firstCapture(input: string, patterns: RegExp[]): string | undefined {
  for (const p of patterns) {
    const m = input.match(p);
    if (m?.[1]) return m[1].trim();
  }
  return undefined;
}

function extractFieldNameFromContent(content: string): string | undefined {
  const fromPerceel = firstCapture(content, [
    /Perceel\s*:?\s*([^\n]*?)(?=\s+Monsternummer|\s+Datum ontvangst|\s+Datum verslag|\n|$)/i,
    /Perceel\s*:?\s*([^\n]+)/i
  ]);
  if (fromPerceel && looksLikeFieldName(fromPerceel)) {
    return fromPerceel.split(' Datum')[0].trim();
  }

  const fromDebiteurLine = firstCapture(content, [/Debiteurnummer\s*:?\s*\n\s*([^\n]+)/i]);
  if (fromDebiteurLine && looksLikeFieldName(fromDebiteurLine)) {
    return fromDebiteurLine;
  }

  return undefined;
}

function looksLikeFieldName(value: string): boolean {
  if (!value) return false;
  if (/^(Vrijlevende|AALTJES ANALYSE|Analysemethode|Perceel|Monsternummer)/i.test(value)) {
    return false;
  }
  if (/(Monsternummer|Datum ontvangst|Datum verslag|Soort monster|Debiteurnummer)/i.test(value)) {
    return false;
  }
  if (/^\d+\s*[A-Za-z]/.test(value)) {
    return false;
  }
  return /[A-Za-z]/.test(value);
}

function extractOrderedDutchDates(content: string): string[] {
  const monthNames = Object.keys(MONTHS).join('|');
  const matches = content.match(new RegExp(`\\b\\d{1,2}\\s+(?:${monthNames})\\s+\\d{4}\\b`, 'gi')) ?? [];
  return Array.from(new Set(matches.map((m) => m.trim())));
}

function extractMeasurementRows(lines: string[]): ParsedMeasurement[] {
  const out: ParsedMeasurement[] = [];
  const seen = new Set<string>();
  let currentCategory: string | undefined;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    const foundCategory = CATEGORY_WORDS.find((c) => new RegExp(`^${escapeRegex(c)}$`, 'i').test(line));
    if (foundCategory) {
      currentCategory = foundCategory;
      continue;
    }

    if (isNoiseLine(line)) continue;

    // Case A: analyte + waarde op dezelfde regel
    const sameLineMatch = line.match(/^(.+?)\s+(\d+(?:[\.,]\d+)?)\s*(\*{0,2})$/);
    if (sameLineMatch) {
      pushMeasurement(out, seen, {
        analyteKey: cleanAnalyteName(sameLineMatch[1]),
        value: parseNumeric(sameLineMatch[2]),
        unit: 'aantal per 100 gram grond',
        category: currentCategory
      });
      continue;
    }

    // Case B: analyte op regel i en waarde op regel i+1 (komt vaak voor bij OCR / geknipte kolommen)
    const analyteCandidate = cleanAnalyteName(line);
    if (looksLikeAnalyte(analyteCandidate) && i + 1 < lines.length) {
      const nextLine = lines[i + 1];
      const valueOnly = nextLine.match(/^(\d+(?:[\.,]\d+)?)\s*(\*{0,2})$/);
      if (valueOnly) {
        pushMeasurement(out, seen, {
          analyteKey: analyteCandidate,
          value: parseNumeric(valueOnly[1]),
          unit: 'aantal per 100 gram grond',
          category: currentCategory
        });
        i += 1;
        continue;
      }
    }

    // Case C: analyte over twee regels + waarde op regel i+2 (bijv. "Tylenchorhynchus" + "spp." + "300")
    if (i + 2 < lines.length && looksLikeContinuation(lines[i + 1])) {
      const joinedAnalyte = cleanAnalyteName(`${line} ${lines[i + 1]}`);
      const valueOnly = lines[i + 2].match(/^(\d+(?:[\.,]\d+)?)\s*(\*{0,2})$/);
      if (looksLikeAnalyte(joinedAnalyte) && valueOnly) {
        pushMeasurement(out, seen, {
          analyteKey: joinedAnalyte,
          value: parseNumeric(valueOnly[1]),
          unit: 'aantal per 100 gram grond',
          category: currentCategory
        });
        i += 2;
      }
    }
  }

  return out;
}

function pushMeasurement(target: ParsedMeasurement[], seen: Set<string>, row: ParsedMeasurement) {
  if (!row.analyteKey || Number.isNaN(row.value)) return;
  if (!looksLikeAnalyte(row.analyteKey)) return;
  const key = `${row.analyteKey}::${row.value}`;
  if (seen.has(key)) return;
  seen.add(key);
  target.push(row);
}

function parseNumeric(raw: string): number {
  return Number(raw.replace(',', '.'));
}

function looksLikeAnalyte(value: string): boolean {
  if (value.length < 4) return false;
  if (/Monsternummer|Debiteurnummer|Datum ontvangst|Datum verslag|Soort monster|Cysteaaltjes|besmettingsgraad|AALTJES ANALYSE|IBAN|BIC/i.test(value)) {
    return false;
  }
  if (value.includes(':') || isDateLikeLabel(value) || isAddressLikeLabel(value)) {
    return false;
  }

  const tokens = value.trim().split(/\s+/).filter(Boolean);
  if (tokens.length < 2) {
    return false;
  }

  return /[A-Za-z]/.test(value);
}

function looksLikeContinuation(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return /^(spp\.?|cf\.?|sp\.?|species)$/.test(normalized);
}

function isDateLikeLabel(value: string): boolean {
  const normalized = value.toLowerCase().trim();
  const monthNames = Object.keys(MONTHS).join('|');
  return new RegExp(`^\\d{1,2}\\s+(?:${monthNames})$`, 'i').test(normalized);
}

function isAddressLikeLabel(value: string): boolean {
  const normalized = value.toLowerCase();
  return /\b(laan|straat|weg|dijk|kade|plein|steeg|hof|gracht|buurt|wijk|postcode)\b/.test(normalized);
}

function isNoiseLine(line: string): boolean {
  return /Monsternummer|Debiteurnummer|Datum ontvangst|Datum verslag|Soort monster|Cysteaaltjes|besmettingsgraad|aantallen per|Een betrouwbare indicatie|AALTJES ANALYSE|research and consultancy|Kampweg|IBAN|BIC|K\.v\.K|BTW/i.test(line);
}

function cleanAnalyteName(input: string): string {
  return input
    .replace(new RegExp(CATEGORY_WORDS.map(escapeRegex).join('|'), 'gi'), '')
    .replace(/[()]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractCyst(lines: string[]): ParsedSample['cystResult'] | undefined {
  const idx = lines.findIndex((line) => /Cysteaaltjes/i.test(line));
  if (idx === -1) return undefined;

  for (let i = idx; i < Math.min(lines.length, idx + 10); i++) {
    const line = lines[i];
    const m = line.match(/(?:Aardappelcysteaaltjes\s+)?(\d+)\s+(\d+)\s+([A-Za-z][A-Za-z ]+)/i);
    if (m) {
      return {
        cystCount: Number(m[1]),
        lleCount: Number(m[2]),
        infestationGrade: m[3].trim()
      };
    }
  }

  return undefined;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
