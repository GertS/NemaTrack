import Link from 'next/link';
import { prisma } from '@/lib/prisma';

export default async function HomePage() {
  const [fieldCount, docCount, sampleCount] = await Promise.all([
    prisma.field.count(),
    prisma.document.count(),
    prisma.sample.count()
  ]);

  return (
    <div className="grid grid-2">
      <section className="card">
        <h1>NemaTrack MVP</h1>
        <p className="small">Beheer PDF-uitslagen van HLB Aaltjes Analyse en bekijk trends per perceel.</p>
        <p>
          <Link href="/upload">➡️ Upload eerste PDF</Link>
        </p>
      </section>
      <section className="card">
        <h2>Statistiek</h2>
        <ul>
          <li>Fields: {fieldCount}</li>
          <li>Documenten: {docCount}</li>
          <li>Monsters: {sampleCount}</li>
        </ul>
      </section>
    </div>
  );
}
