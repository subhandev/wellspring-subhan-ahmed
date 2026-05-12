import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Rubric: 2 creators × 3 programs × ~10 sessions each — implement in a follow-up.
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
