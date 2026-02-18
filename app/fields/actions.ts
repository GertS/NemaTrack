'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';

export async function createField(formData: FormData) {
  const name = String(formData.get('name') ?? '').trim();
  const notes = String(formData.get('notes') ?? '').trim();
  if (!name) return;

  await prisma.field.create({
    data: {
      name,
      notes: notes || null
    }
  });

  revalidatePath('/fields');
}

export async function addAlias(formData: FormData) {
  const aliasName = String(formData.get('aliasName') ?? '').trim();
  const fieldId = Number(formData.get('fieldId'));
  if (!aliasName || !fieldId) return;

  await prisma.fieldAlias.create({
    data: { aliasName, fieldId }
  });

  revalidatePath('/fields');
}

export async function deleteField(formData: FormData) {
  const fieldId = Number(formData.get('fieldId'));
  if (!fieldId) return;

  await prisma.field.delete({ where: { id: fieldId } });
  revalidatePath('/fields');
}

export async function deleteAlias(formData: FormData) {
  const aliasId = Number(formData.get('aliasId'));
  if (!aliasId) return;

  await prisma.fieldAlias.delete({ where: { id: aliasId } });
  revalidatePath('/fields');
}
