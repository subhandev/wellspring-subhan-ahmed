import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

/** Rubric: 2 creators × 3 programs × ~10 sessions each */
const SESSIONS_PER_PROGRAM = 10;

/**
 * Demo tenants: realistic emails and program catalog (brief only requires counts).
 * Media is left empty so local UI does not hit broken URLs.
 */
const SEED_CREATORS = [
  {
    personaName: "Nora Chen",
    email: "nora.chen@wellspring.example",
    programs: [
      {
        title: "30-Day Sleep Reset",
        description:
          "Evening routines, wind-down cues, and gentle practices to support deeper rest."
      },
      {
        title: "Morning Breathwork Lab",
        description:
          "Short guided breath sessions to build focus and calm before the day starts."
      },
      {
        title: "Gentle Movement Foundations",
        description: "Low-impact mobility and strength basics suitable for beginners."
      }
    ]
  },
  {
    personaName: "Marcus Ortiz",
    email: "marcus.ortiz@wellspring.example",
    programs: [
      {
        title: "Beginner Yoga Foundations",
        description: "Alignment, breath, and steady pacing for a sustainable home practice."
      },
      {
        title: "Desk Reset — 15-Minute Breaks",
        description:
          "Micro-sessions for neck, shoulders, breath, and eyes between meetings."
      },
      {
        title: "Evening Wind-Down Series",
        description:
          "Progressive relaxation and light movement to transition out of work mode."
      }
    ]
  }
] as const;

const SESSION_PHASE_LABELS = [
  "Welcome and intentions",
  "Foundations",
  "Guided practice",
  "Technique focus",
  "Integration",
  "Check-in and adjustments",
  "Deeper variation",
  "Rest and recovery",
  "Q&A themes",
  "Closing ritual"
];

const TAG_ROTATIONS = [
  ["breathwork", "nervous-system"],
  ["movement", "mobility"],
  ["sleep", "evening-routine"],
  ["mindfulness", "grounding"],
  ["yoga", "alignment"],
  ["stress-relief", "desk-break"]
];

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

  const programsPerCreator = SEED_CREATORS[0]?.programs.length ?? 0;

  seedLog("info", "seed starting", {
    nodeEnv: process.env.NODE_ENV ?? "undefined",
    tenantCount: SEED_CREATORS.length,
    programsPerCreator,
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
  const seededAccounts: Array<{ email: string; id: string; personaName: string }> = [];

  for (const profile of SEED_CREATORS) {
    seedLog("info", `creating tenant ${profile.personaName}`, {
      email: profile.email,
      personaName: profile.personaName
    });
    const creator = await prisma.creator.create({
      data: {
        email: profile.email,
        passwordHash
      }
    });
    seededAccounts.push({
      email: creator.email,
      id: creator.id,
      personaName: profile.personaName
    });

    for (let p = 0; p < profile.programs.length; p++) {
      const programMeta = profile.programs[p]!;
      seedLog("info", `creating program ${programMeta.title}`, {
        tenantId: creator.id,
        email: profile.email,
        personaName: profile.personaName,
        programIndex: p + 1
      });
      await prisma.program.create({
        data: {
          tenantId: creator.id,
          title: programMeta.title,
          description: programMeta.description,
          sessions: {
            create: Array.from({ length: SESSIONS_PER_PROGRAM }, (_, s) => ({
              tenantId: creator.id,
              title: `${SESSION_PHASE_LABELS[s]} — ${programMeta.title}`,
              durationSeconds: 600 + s * 120,
              position: s,
              instructorName: instructors[s % instructors.length],
              tags: TAG_ROTATIONS[s % TAG_ROTATIONS.length],
              mediaUrl: null,
              mediaType: null
            }))
          }
        }
      });
    }

    seedLog("info", `tenant complete ${profile.personaName}`, {
      tenantId: creator.id,
      email: profile.email,
      personaName: profile.personaName
    });
  }

  seedLog("info", "seed done");
  seedLog("info", "seed credentials (local only)", {
    accounts: seededAccounts.map((a) => ({
      personaName: a.personaName,
      email: a.email
    })),
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
