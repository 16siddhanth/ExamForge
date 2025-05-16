import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Add your initial subjects here. Example:
  await prisma.subject.createMany({
    data: [
      { name: 'Mathematics', mainTopics: ['Algebra', 'Calculus', 'Geometry'] },
      { name: 'Physics', mainTopics: ['Mechanics', 'Optics', 'Thermodynamics'] },
      { name: 'Chemistry', mainTopics: ['Organic', 'Inorganic', 'Physical'] },
      { name: 'Computer Science', mainTopics: ['Data Structures', 'Algorithms', 'Databases'] },
      { name: 'Biology', mainTopics: ['Genetics', 'Ecology', 'Cell Biology'] },
      // Add more subjects as needed
    ],
    skipDuplicates: true,
  });
}

main()
  .then(() => {
    console.log('Seeding complete');
    return prisma.$disconnect();
  })
  .catch((e) => {
    console.error(e);
    return prisma.$disconnect();
  });
