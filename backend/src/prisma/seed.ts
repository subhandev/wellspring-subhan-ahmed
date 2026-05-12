import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

/** Rubric: 2 creators × 3 programs × ~10 sessions each */
const PROGRAMS_PER_CREATOR = 3;
const SESSIONS_PER_PROGRAM = 10;

async function main() {
  await prisma.sessionImportKey.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.session.deleteMany();
  await prisma.program.deleteMany();
  await prisma.creator.deleteMany();

  const passwordHash = await bcrypt.hash("Password123!", 10);
  const instructors = ["Alex Kim", "Jordan Lee", "Sam Rivera"];

  for (let i = 0; i < 2; i++) {
    const creator = await prisma.creator.create({
      data: {
        email: `creator${i + 1}@wellspring-seed.example`,
        passwordHash,
      },
    });

    for (let p = 0; p < PROGRAMS_PER_CREATOR; p++) {
      await prisma.program.create({
        data: {
          tenantId: creator.id,
          title: `Creator ${i + 1} — Program ${p + 1}`,
          description: `Seed program ${p + 1} for creator ${i + 1}.`,
          sessions: {
            create: Array.from({ length: SESSIONS_PER_PROGRAM }, (_, s) => {
              const mediaUrl =
                s % 4 === 0
                  ? `https://example.com/seed-media/${creator.id}/p${p + 1}-s${s + 1}.mp3`
                  : null;
              return {
                tenantId: creator.id,
                title: `Session ${s + 1}`,
                durationSeconds: 600 + s * 120,
                position: s,
                instructorName: instructors[s % instructors.length],
                tags: ["seed", ["breathwork", "movement", "sleep"][s % 3]],
                mediaUrl,
                mediaType: mediaUrl ? "audio/mpeg" : null,
              };
            }),
          },
        },
      });
    }
  }
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
