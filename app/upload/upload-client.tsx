'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ParsedDocument } from '@/lib/parser';

type FieldOption = { id: number; name: string };

export default function UploadClient({ fields }: { fields: FieldOption[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [parsed, setParsed] = useState<ParsedDocument | null>(null);
  const [pdfText, setPdfText] = useState<string | null>(null);
  const [filename, setFilename] = useState('');
  const [fieldId, setFieldId] = useState('');
  const [newFieldName, setNewFieldName] = useState('');

  async function onParse(formData: FormData) {
    setLoading(true);
    const res = await fetch('/api/upload/parse', { method: 'POST', body: formData });
    const json = await res.json();
    setParsed(json.extracted);
    setPdfText(json.pdfText);
    setFilename(json.originalFilename);
    setLoading(false);
  }

  async function onSave() {
    if (!parsed) return;
    setLoading(true);
    const res = await fetch('/api/upload/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        originalFilename: filename,
        pdfText,
        extracted: parsed,
        linkedFieldId: fieldId ? Number(fieldId) : null,
        newFieldName
      })
    });
    const json = await res.json();
    setLoading(false);
    if (json.id) router.push(`/documents/${json.id}`);
  }

  const sample = parsed?.samples[0];

  return (
    <div className="grid" style={{ gap: '1rem' }}>
      <section className="card">
        <h1>PDF upload</h1>
        <form
          action={onParse}
          className="grid"
        >
          <input type="file" name="file" accept="application/pdf" required />
          <button type="submit" disabled={loading}>{loading ? 'Bezig...' : 'Parse PDF'}</button>
        </form>
      </section>

      {sample && (
        <section className="card">
          <h2>Review extractie</h2>
          <p><b>Bestand:</b> {filename}</p>
          {parsed?.warnings.length ? <p className="small">Warnings: {parsed.warnings.join(' | ')}</p> : null}
          <ul>
            <li>Sample nummer: {sample.sampleNumber ?? '-'}</li>
            <li>PDF perceelnaam: {sample.pdfFieldName ?? '-'}</li>
            <li>Datum ontvangst: {sample.receivedDate ?? '-'}</li>
            <li>Datum verslag: {sample.reportDate ?? '-'}</li>
          </ul>

          <h3>Metingen</h3>
          <table className="table">
            <thead><tr><th>Aaltjessoort</th><th>Waarde</th><th>Unit</th></tr></thead>
            <tbody>
              {sample.measurements.map((m, i) => (
                <tr key={i}><td>{m.analyteKey}</td><td>{m.value}</td><td>{m.unit}</td></tr>
              ))}
            </tbody>
          </table>

          {sample.cystResult && (
            <>
              <h3>Cysteaaltjes</h3>
              <p>
                Cysten: {sample.cystResult.cystCount ?? '-'} | LLE: {sample.cystResult.lleCount ?? '-'} | Besmettingsgraad: {sample.cystResult.infestationGrade ?? '-'}
              </p>
            </>
          )}

          <h3>Koppeling field</h3>
          <div className="grid grid-2">
            <select value={fieldId} onChange={(e) => setFieldId(e.target.value)}>
              <option value="">Niet gekoppeld</option>
              {fields.map((field) => (
                <option value={field.id} key={field.id}>{field.name}</option>
              ))}
            </select>
            <input placeholder="of nieuw field" value={newFieldName} onChange={(e) => setNewFieldName(e.target.value)} />
          </div>
          <button onClick={onSave} disabled={loading} style={{ marginTop: '1rem' }}>
            {loading ? 'Opslaan...' : 'Opslaan in database'}
          </button>
        </section>
      )}
    </div>
  );
}
