import { PrismaClient, SessionMediaType } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

/** Rubric: 2 creators × 3 programs × ~10 sessions each */
const PROGRAMS_PER_CREATOR = 3;
const SESSIONS_PER_PROGRAM = 10;

/**
 * One JSON object per line (same keys as API logs where applicable).
 * `tenant_id` is the creator id when in a tenant context, else `pre_auth` sentinel (no HTTP request).
 */
function seedLog(
  level: "info" | "warn" | "error",
  msg: string,
  extra?: Record<string, unknown> & { tenantId?: string }
): void {
  const { tenantId, ...rest } = extra ?? {};
  console.log(
    JSON.stringify({
      level,
      msg,
      component: "prisma_seed",
      request_id: "seed",
      tenant_id: tenantId ?? "pre_auth",
      ...rest
    })
  );
}

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to run seed in production (NODE_ENV=production).");
  }

  seedLog("info", "seed starting", {
    nodeEnv: process.env.NODE_ENV ?? "undefined",
    programsPerCreator: PROGRAMS_PER_CREATOR,
    sessionsPerProgram: SESSIONS_PER_PROGRAM
  });

  seedLog("info", "clearing existing data");
  await prisma.sessionImportKey.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.session.deleteMany();
  await prisma.program.deleteMany();
  await prisma.creator.deleteMany();
  seedLog("info", "cleared");

  const passwordHash = await bcrypt.hash("Password123!", 10);
  const instructors = ["Alex Kim", "Jordan Lee", "Sam Rivera"];
  const seededCreators: Array<{ email: string; id: string }> = [];

  for (let i = 0; i < 2; i++) {
    const email = `creator${i + 1}@wellspring.example`;
    seedLog("info", `creating creator ${i + 1}/2`, { email });
    const creator = await prisma.creator.create({
      data: {
        email,
        passwordHash
      }
    });
    seededCreators.push({ email: creator.email, id: creator.id });

    for (let p = 0; p < PROGRAMS_PER_CREATOR; p++) {
      seedLog("info", `creating program ${p + 1}/${PROGRAMS_PER_CREATOR}`, {
        tenantId: creator.id,
        email,
        programIndex: p + 1
      });
      await prisma.program.create({
        data: {
          tenantId: creator.id,
          title: `Creator ${i + 1} — Program ${p + 1}`,
          description: `Seed program ${p + 1} for creator ${i + 1}.`,
          sessions: {
            create: Array.from({ length: SESSIONS_PER_PROGRAM }, (_, s) => {
              const mediaUrl =
                s % 4 === 0
                  ? `https://example.com/tenants/${creator.id}/media/seed-p${p + 1}-s${s + 1}.mp3`
                  : null;
              return {
                tenantId: creator.id,
                title: `Session ${s + 1}`,
                durationSeconds: 600 + s * 120,
                position: s,
                instructorName: instructors[s % instructors.length],
                tags: ["seed", ["breathwork", "movement", "sleep"][s % 3]],
                mediaUrl,
                mediaType: mediaUrl ? SessionMediaType.AUDIO : null
              };
            })
          }
        }
      });
    }

    seedLog("info", `creator ${i + 1}/2 complete`, { tenantId: creator.id, email });
  }

  seedLog("info", "seed done");
  seedLog("info", "seed credentials (local only)", {
    emails: seededCreators.map((c) => c.email),
    passwordHint: "Password123!"
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    seedLog("error", "seed failed", {
      err: e instanceof Error ? e.message : String(e),
      stack: e instanceof Error ? e.stack : undefined
    });
    await prisma.$disconnect();
    process.exit(1);
  });
