'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';

export async function deleteDocument(formData: FormData) {
  const documentId = Number(formData.get('documentId'));
  if (!documentId) return;

  await prisma.document.delete({ where: { id: documentId } });
  revalidatePath('/');
  redirect('/');
}
