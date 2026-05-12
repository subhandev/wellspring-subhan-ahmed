import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

/** Rubric: 2 creators × 3 programs × ~10 sessions each */
const PROGRAMS_PER_CREATOR = 3;
const SESSIONS_PER_PROGRAM = 10;

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to run seed in production (NODE_ENV=production).");
  }

  console.log(`[seed] starting (NODE_ENV=${process.env.NODE_ENV ?? "undefined"})`);
  console.log(
    `[seed] will create: creators=2, programsPerCreator=${PROGRAMS_PER_CREATOR}, sessionsPerProgram=${SESSIONS_PER_PROGRAM}`
  );

  console.log("[seed] clearing existing data...");
  await prisma.sessionImportKey.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.session.deleteMany();
  await prisma.program.deleteMany();
  await prisma.creator.deleteMany();
  console.log("[seed] cleared.");

  const passwordHash = await bcrypt.hash("Password123!", 10);
  const instructors = ["Alex Kim", "Jordan Lee", "Sam Rivera"];
  const seededCreators: Array<{ email: string; id: string }> = [];

  for (let i = 0; i < 2; i++) {
    const email = `creator${i + 1}@wellspring-seed.example`;
    console.log(`[seed] creating creator ${i + 1}/2 (${email})...`);
    const creator = await prisma.creator.create({
      data: {
        email,
        passwordHash
      }
    });
    seededCreators.push({ email: creator.email, id: creator.id });

    for (let p = 0; p < PROGRAMS_PER_CREATOR; p++) {
      console.log(`[seed] creating program ${p + 1}/${PROGRAMS_PER_CREATOR} for ${email}...`);
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
                mediaType: mediaUrl ? "audio/mpeg" : null
              };
            })
          }
        }
      });
    }

    console.log(`[seed] creator ${i + 1}/2 complete.`);
  }

  console.log("[seed] done.");
  console.log("[seed] credentials:");
  for (const c of seededCreators) {
    console.log(`- email: ${c.email}`);
  }
  console.log("- password: Password123!");
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
