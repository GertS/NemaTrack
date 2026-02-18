import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { addAlias, createField } from './actions';

export default async function FieldsPage() {
  const fields = await prisma.field.findMany({ include: { aliases: true }, orderBy: { name: 'asc' } });

  return (
    <div className="grid" style={{ gap: '1rem' }}>
      <section className="card">
        <h1>Fields beheren</h1>
        <form action={createField} className="grid grid-2">
          <input name="name" placeholder="Canonieke field naam" required />
          <input name="notes" placeholder="Notities (optioneel)" />
          <button type="submit">Field toevoegen</button>
        </form>
      </section>

      <section className="card">
        <h2>Alias toevoegen</h2>
        <form action={addAlias} className="grid grid-2">
          <input name="aliasName" placeholder="Naam zoals in PDF" required />
          <select name="fieldId" required defaultValue="">
            <option value="" disabled>Kies field</option>
            {fields.map((field) => (
              <option key={field.id} value={field.id}>{field.name}</option>
            ))}
          </select>
          <button type="submit">Alias opslaan</button>
        </form>
      </section>

      <section className="card">
        <h2>Overzicht</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Field</th>
              <th>Notities</th>
              <th>Aliassen</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {fields.map((field) => (
              <tr key={field.id}>
                <td>{field.name}</td>
                <td>{field.notes ?? '-'}</td>
                <td>{field.aliases.map((a) => a.aliasName).join(', ') || '-'}</td>
                <td><Link href={`/field/${field.id}`}>Open</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
