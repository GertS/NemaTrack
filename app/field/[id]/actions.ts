'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';

export async function deleteSample(formData: FormData) {
  const sampleId = Number(formData.get('sampleId'));
  const fieldId = Number(formData.get('fieldId'));
  if (!sampleId || !fieldId) return;

  await prisma.sample.delete({ where: { id: sampleId } });

  revalidatePath(`/field/${fieldId}`);
}
