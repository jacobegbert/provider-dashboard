/**
 * Seed script: Create the 75 HARD protocol
 * Run: node seed-75hard.mjs
 */
import "dotenv/config";
import mysql from "mysql2/promise";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

async function main() {
  const conn = await mysql.createConnection(DATABASE_URL);

  // Check if 75 HARD already exists
  const [existing] = await conn.execute(
    "SELECT id FROM protocols WHERE name = '75 HARD' AND createdBy = 1 LIMIT 1"
  );
  if (existing.length > 0) {
    console.log("75 HARD protocol already exists (id:", existing[0].id, ")");
    await conn.end();
    return;
  }

  // Create the protocol
  const milestones = JSON.stringify([
    { day: 1, label: "Day 1 — Commit and Begin" },
    { day: 7, label: "Week 1 Complete — Habits Forming" },
    { day: 14, label: "Week 2 — Momentum Building" },
    { day: 21, label: "3 Weeks — Habit Solidified" },
    { day: 30, label: "30 Days — One Third Done" },
    { day: 45, label: "Halfway Point — Stay Strong" },
    { day: 60, label: "60 Days — Final Stretch Approaching" },
    { day: 75, label: "75 HARD Complete — You Did It!" },
  ]);

  const [protocolResult] = await conn.execute(
    `INSERT INTO protocols (createdBy, name, description, category, durationDays, isTemplate, milestones)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      1, // createdBy (owner/admin user ID)
      "75 HARD",
      "The 75 HARD challenge is a transformative mental toughness program created by Andy Frisella. For 75 consecutive days, you must complete ALL five daily tasks with zero compromises. If you miss any task on any day, you start over from Day 1. This is not a fitness program — it is a mental toughness program that uses physical discipline as the vehicle for growth.",
      "lifestyle",
      75,
      1, // isTemplate = true
      milestones,
    ]
  );

  const protocolId = protocolResult.insertId;
  console.log("Created 75 HARD protocol with id:", protocolId);

  // Define the 5 daily tasks + reading + progress photo
  const steps = [
    {
      sortOrder: 1,
      title: "Workout #1 — Outdoor (45 minutes)",
      description:
        "Complete a 45-minute workout OUTDOORS, regardless of weather. This can be walking, running, cycling, hiking, calisthenics, or any physical activity. One of your two daily workouts MUST be outside. Push through discomfort — that's where mental toughness is built.",
      frequency: "daily",
      timeOfDay: "morning",
    },
    {
      sortOrder: 2,
      title: "Workout #2 — Any Location (45 minutes)",
      description:
        "Complete a second 45-minute workout. This can be indoors or outdoors (gym, home workout, yoga, swimming, etc.). The two workouts must be separated — no combining into one 90-minute session. Each workout must be a full 45 minutes of intentional physical activity.",
      frequency: "daily",
      timeOfDay: "afternoon",
    },
    {
      sortOrder: 3,
      title: "Follow a Diet — No Alcohol, No Cheat Meals",
      description:
        "Follow a structured nutrition plan with ZERO alcohol and ZERO cheat meals for all 75 days. Choose a diet that aligns with your health goals (keto, paleo, whole30, macro counting, clean eating, etc.) and stick to it with complete discipline. No exceptions, no \"just one bite.\" This is about mental discipline, not the specific diet.",
      frequency: "daily",
      timeOfDay: "any",
    },
    {
      sortOrder: 4,
      title: "Drink 1 Gallon of Water",
      description:
        "Drink one full gallon (128 oz / 3.8 liters) of water every day. Start early in the day and spread intake throughout. This builds the habit of consistent hydration and teaches you to plan ahead. Other beverages do not count toward this total — it must be plain water.",
      frequency: "daily",
      timeOfDay: "any",
      dosageAmount: "1",
      dosageUnit: "gallon",
    },
    {
      sortOrder: 5,
      title: "Read 10 Pages of a Non-Fiction Book",
      description:
        "Read at least 10 pages of a non-fiction, self-improvement, or educational book every day. Audiobooks do NOT count — you must physically read. This develops focus, discipline, and continuous learning. Choose books on personal development, business, health, psychology, or any topic that helps you grow.",
      frequency: "daily",
      timeOfDay: "evening",
      dosageAmount: "10",
      dosageUnit: "pages",
    },
    {
      sortOrder: 6,
      title: "Take a Progress Photo",
      description:
        "Take a progress photo every single day. Same angle, same lighting if possible. This is not about vanity — it's about accountability and documenting your transformation. You'll be amazed at the changes you see over 75 days. Take the photo even on days you don't feel like it.",
      frequency: "daily",
      timeOfDay: "morning",
    },
  ];

  for (const step of steps) {
    await conn.execute(
      `INSERT INTO protocol_steps (protocolId, sortOrder, title, description, frequency, timeOfDay, dosageAmount, dosageUnit)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        protocolId,
        step.sortOrder,
        step.title,
        step.description,
        step.frequency,
        step.timeOfDay,
        step.dosageAmount || null,
        step.dosageUnit || null,
      ]
    );
  }

  console.log(`Created ${steps.length} steps for 75 HARD protocol`);
  await conn.end();
  console.log("Done!");
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
