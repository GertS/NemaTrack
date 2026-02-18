import { prisma } from '@/lib/prisma';
import UploadClient from './upload-client';

export default async function UploadPage() {
  const fields = await prisma.field.findMany({ orderBy: { name: 'asc' } });
  return <UploadClient fields={fields.map((f) => ({ id: f.id, name: f.name }))} />;
}
