import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { deleteDocument } from './actions';

export default async function DocumentPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  const document = await prisma.document.findUnique({
    where: { id },
    include: {
      samples: {
        include: {
          linkedField: true,
          measurements: true,
          cystResult: true
        }
      }
    }
  });

  if (!document) return notFound();

  return (
    <div className="grid" style={{ gap: '1rem' }}>
      <section className="card">
        <h1>Document #{document.id}</h1>
        <p>Bestandsnaam: {document.originalFilename}</p>
        <p>Lab: {document.labName ?? '-'}</p>
        <p>Geüpload: {document.uploadedAt.toISOString()}</p>
        <form action={deleteDocument}>
          <input type="hidden" name="documentId" value={document.id} />
          <button type="submit" className="secondary">Document verwijderen</button>
        </form>
      </section>

      {document.samples.map((sample) => (
        <section className="card" key={sample.id}>
          <h2>Sample {sample.sampleNumber ?? '-'}</h2>
          <p>PDF perceelnaam: {sample.pdfFieldName ?? '-'}</p>
          <p>
            Gekoppeld field:{' '}
            {sample.linkedField ? (
              <Link href={`/field/${sample.linkedField.id}`}>{sample.linkedField.name}</Link>
            ) : (
              'nog niet gekoppeld'
            )}
          </p>
          <p>Ontvangst: {sample.receivedDate?.toISOString().slice(0, 10) ?? '-'}</p>
          <p>Verslag: {sample.reportDate?.toISOString().slice(0, 10) ?? '-'}</p>

          <h3>Metingen</h3>
          <ul>
            {sample.measurements.map((m) => (
              <li key={m.id}>{m.analyteKey}: {m.value} {m.unit}</li>
            ))}
          </ul>

          {sample.cystResult && (
            <p>
              Cysten: {sample.cystResult.cystCount ?? '-'} | LLE: {sample.cystResult.lleCount ?? '-'} | Besmettingsgraad: {sample.cystResult.infestationGrade ?? '-'}
            </p>
          )}
        </section>
      ))}

      <section className="card">
        <h2>Extracted JSON</h2>
        <pre>{document.extractedJson}</pre>
      </section>
    </div>
  );
}
