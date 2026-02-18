import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import FieldTrendChart from './chart';
import { deleteSample } from './actions';

export default async function FieldDetailPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  const field = await prisma.field.findUnique({
    where: { id },
    include: {
      samples: {
        include: {
          measurements: true,
          document: true
        },
        orderBy: { reportDate: 'asc' }
      }
    }
  });

  if (!field) return notFound();

  const analytes = Array.from(new Set(field.samples.flatMap((s) => s.measurements.map((m) => m.analyteKey))));
  const data = field.samples.map((sample) => {
    const row: Record<string, string | number> = {
      date: sample.reportDate?.toISOString().slice(0, 10) ?? 'onbekend'
    };
    sample.measurements.forEach((m) => {
      row[m.analyteKey] = m.value;
    });
    return row;
  });

  return (
    <div className="grid" style={{ gap: '1rem' }}>
      <section className="card">
        <h1>{field.name}</h1>
        <p className="small">{field.notes ?? 'Geen notities'}</p>
      </section>

      <section className="card">
        <h2>Trend per aaltjessoort</h2>
        {data.length ? <FieldTrendChart data={data} analytes={analytes} /> : <p>Geen data beschikbaar.</p>}
      </section>

      <section className="card">
        <h2>Meetpunten</h2>
        <table className="table">
          <thead><tr><th>Datum verslag</th><th>Monsternummer</th><th>PDF perceelnaam</th><th>Metingen</th><th>Document</th><th>Actie</th></tr></thead>
          <tbody>
            {field.samples.map((sample) => (
              <tr key={sample.id}>
                <td>{sample.reportDate?.toISOString().slice(0, 10) ?? '-'}</td>
                <td>{sample.sampleNumber ?? '-'}</td>
                <td>{sample.pdfFieldName ?? '-'}</td>
                <td>
                  {sample.measurements.map((m) => (
                    <div key={m.id}>{m.analyteKey}: {m.value}</div>
                  ))}
                </td>
                <td><Link href={`/documents/${sample.documentId}`}>Open</Link></td>
                <td>
                  <form action={deleteSample}>
                    <input type="hidden" name="sampleId" value={sample.id} />
                    <input type="hidden" name="fieldId" value={field.id} />
                    <button type="submit" className="secondary">Verwijderen</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
