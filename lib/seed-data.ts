import { ParsedDocument } from './parser';

export function demoParsedDocument(filename: string): ParsedDocument {
  return {
    labName: 'HLB',
    warnings: ['PDF parsing faalde, demo data gebruikt'],
    samples: [
      {
        sampleNumber: 'DEMO-001',
        pdfFieldName: filename.replace('.pdf', ''),
        receivedDate: '18 februari 2020',
        reportDate: '27 maart 2020',
        measurements: [
          { analyteKey: 'Pratylenchus penetrans', value: 245, unit: 'aantal per 100 gram grond', category: 'Wortellesieaaltjes' },
          { analyteKey: 'Meloidogyne hapla', value: 31, unit: 'aantal per 100 gram grond', category: 'Wortelknobbelaaltjes' },
          { analyteKey: 'Tylenchorhynchus spp.', value: 220, unit: 'aantal per 100 gram grond', category: 'Vrijlevende wortelaaltjes' }
        ],
        cystResult: { cystCount: 62, lleCount: 2525, infestationGrade: 'zwaar besmet' }
      }
    ]
  };
}
