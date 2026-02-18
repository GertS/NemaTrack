import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.measurement.deleteMany();
  await prisma.cystResult.deleteMany();
  await prisma.sample.deleteMany();
  await prisma.document.deleteMany();
  await prisma.fieldAlias.deleteMany();
  await prisma.field.deleteMany();

  const field = await prisma.field.create({
    data: {
      name: 'Barlage 4',
      notes: 'Demo perceel',
      aliases: {
        create: [{ aliasName: 'H1' }, { aliasName: 'Barlage 4' }]
      }
    }
  });

  const document = await prisma.document.create({
    data: {
      originalFilename: '2004537 - Sterenborg N. - Barlage 4.pdf',
      labName: 'HLB',
      extractedJson: JSON.stringify({ seed: true }),
      samples: {
        create: {
          sampleNumber: '2004537',
          pdfFieldName: 'Barlage 4',
          receivedDate: new Date('2020-02-18'),
          reportDate: new Date('2020-03-27'),
          linkedFieldId: field.id,
          measurements: {
            create: [
              { analyteKey: 'Pratylenchus penetrans', value: 245, unit: 'aantal per 100 gram grond' },
              { analyteKey: 'Meloidogyne hapla', value: 31, unit: 'aantal per 100 gram grond' },
              { analyteKey: 'Tylenchorhynchus spp.', value: 220, unit: 'aantal per 100 gram grond' }
            ]
          },
          cystResult: {
            create: {
              cystCount: 62,
              lleCount: 2525,
              infestationGrade: 'zwaar besmet'
            }
          }
        }
      }
    }
  });

  await prisma.document.create({
    data: {
      originalFilename: '2309991001 - Mts. N. en I.J. Sterenborg-Kooij - H1.pdf',
      labName: 'HLB',
      extractedJson: JSON.stringify({ seed: true }),
      samples: {
        create: {
          sampleNumber: '2309991001',
          pdfFieldName: 'H1',
          receivedDate: new Date('2023-02-17'),
          reportDate: new Date('2023-03-22'),
          linkedFieldId: field.id,
          measurements: {
            create: [
              { analyteKey: 'Pratylenchus penetrans', value: 190, unit: 'aantal per 100 gram grond' },
              { analyteKey: 'Meloidogyne hapla', value: 14, unit: 'aantal per 100 gram grond' },
              { analyteKey: 'Tylenchorhynchus spp.', value: 260, unit: 'aantal per 100 gram grond' }
            ]
          }
        }
      }
    }
  });

  console.log('Seeded with document', document.id);
}

main().finally(async () => prisma.$disconnect());
