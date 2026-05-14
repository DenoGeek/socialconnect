// scripts/seed.ts
//
// Hydrates the DB with the bare minimum data needed for a usable dev/demo
// instance: alias pool, psychometric questions, sample events with tickets,
// sample properties, sample programs, sample partners + deals, professionals.
//
// Run with: pnpm db:seed

import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../db/schema";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}
const client = postgres(url, { max: 1, prepare: false });
const db = drizzle(client, { schema, casing: "snake_case" });

const ALIAS_POOL = [
  "The Alchemist", "The Voyager", "The Cartographer", "The Architect",
  "The Curator", "The Composer", "The Sculptor", "The Pilgrim",
  "The Storyteller", "The Astronomer", "The Gardener", "The Navigator",
  "The Lighthouse", "The Beekeeper", "The Linguist", "The Tinkerer",
  "The Lantern", "The Falconer", "The Wayfarer", "The Vintner",
  "The Cellist", "The Cobbler", "The Apothecary", "The Mapmaker",
  "The Tide-Reader", "The Quiet One", "The Builder", "The Skywatcher",
  "The Florist", "The Wanderer",
];

const PSYCH_QUESTIONS: Array<{
  step: number;
  prompt: string;
  questionType: string;
  options?: string[] | null;
  scaleMin?: number;
  scaleMax?: number;
  category: string;
  weight: number;
}> = [
  {
    step: 0,
    prompt: "Which weekend best describes the real you?",
    questionType: "single",
    options: [
      "Quiet hike + journaling",
      "Brunch with five friends",
      "Volunteering at church",
      "Studio session / hobby project",
      "Reading + a long walk",
    ],
    category: "lifestyle",
    weight: 3,
  },
  {
    step: 1,
    prompt: "How important is shared faith?",
    questionType: "scale",
    scaleMin: 1,
    scaleMax: 5,
    category: "faith",
    weight: 5,
  },
  {
    step: 2,
    prompt: "Where do you want to be in 5 years?",
    questionType: "single",
    options: [
      "Married, building a home",
      "Married, traveling for work",
      "Still discerning",
      "Married with kids",
      "Career-focused, dating intentionally",
    ],
    category: "vision",
    weight: 5,
  },
  {
    step: 3,
    prompt: "Which of these are non-negotiables for you?",
    questionType: "multi",
    options: [
      "Same faith",
      "Wants kids",
      "Lives in Nairobi",
      "Open to relocation",
      "Financially independent",
    ],
    category: "values",
    weight: 4,
  },
  {
    step: 4,
    prompt: "How do you handle conflict?",
    questionType: "single",
    options: [
      "Tackle it immediately, head-on",
      "Need time to think first",
      "Talk it out with a friend or coach",
      "Avoid until it becomes pressing",
    ],
    category: "emotional",
    weight: 4,
  },
];

const SAMPLE_PARTNERS = [
  {
    name: "Tigoni Tea Spa",
    category: "spa",
    city: "Tigoni",
    region: "Highlands",
  },
  {
    name: "The Larder Karen",
    category: "restaurant",
    city: "Nairobi",
    region: "Karen",
  },
  {
    name: "Chef Aleya — Private Chef",
    category: "private_chef",
    city: "Nairobi",
    region: "Westlands",
  },
];

async function main() {
  console.log("Seeding alias pool…");
  for (const name of ALIAS_POOL) {
    await db.insert(schema.aliasPool).values({ name }).onConflictDoNothing();
  }

  console.log("Seeding psychometric questions…");
  // Idempotent-ish: only add if empty.
  const existing = await db.select().from(schema.psychometricQuestions);
  if (existing.length === 0) {
    for (const q of PSYCH_QUESTIONS) {
      await db.insert(schema.psychometricQuestions).values(q);
    }
  }

  console.log("Seeding sample event…");
  const eventSlug = `ridge-cabin-${Date.now()}`;
  const [evt] = await db
    .insert(schema.events)
    .values({
      slug: eventSlug,
      title: "Ridge Cabin Retreat — The Highlands",
      subtitle: "A weekend of quiet discovery for the intentional",
      description:
        "Two days at the Limuru ridge with curated dinners, golf-cart shuffles, and silent speed dating. No agendas — just the right people in the same room.",
      venue: "Ridge Cabin, Limuru",
      city: "Limuru",
      region: "Highlands",
      heroImageUrl:
        "https://images.unsplash.com/photo-1499678329028-101435549a4e?w=1600",
      gallery: [
        "https://images.unsplash.com/photo-1499678329028-101435549a4e?w=1200",
        "https://images.unsplash.com/photo-1502230831726-fe5549140034?w=1200",
        "https://images.unsplash.com/photo-1542144612-1b3641ec3459?w=1200",
      ],
      itinerary: [
        { time: "Fri 17:00", label: "Arrival + golden-hour walk" },
        { time: "Fri 19:30", label: "Master table dinner" },
        { time: "Sat 09:00", label: "Tea picking at Tigoni" },
        { time: "Sat 14:00", label: "Cooking class + blind responses" },
        { time: "Sat 19:00", label: "Silent speed dating" },
        { time: "Sun 10:00", label: "Reflection brunch + impressions form" },
      ],
      startsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      endsAt: new Date(Date.now() + 16 * 24 * 60 * 60 * 1000),
      capacity: 36,
      eliteOnly: false,
      status: "published",
    })
    .returning();

  await db.insert(schema.eventTickets).values([
    {
      eventId: evt.id,
      tier: "one_day",
      label: "Saturday only",
      priceKsh: "12000",
      priceUsd: "95",
      capacity: 12,
    },
    {
      eventId: evt.id,
      tier: "two_day",
      label: "Full retreat (Fri–Sun)",
      priceKsh: "28000",
      priceUsd: "220",
      capacity: 24,
    },
  ]);

  await db.insert(schema.eventPrompts).values([
    {
      eventId: evt.id,
      kind: "icebreaker",
      prompt: "If you weren't doing what you're doing, what would you be doing?",
      ordering: 0,
    },
    {
      eventId: evt.id,
      kind: "blind_response",
      prompt: "Which dish from the cooking class describes you — and why?",
      ordering: 1,
    },
  ]);

  console.log("Seeding sample hearth property…");
  const [host] = await db
    .insert(schema.hosts)
    .values({
      legalName: "Evermore Holdings Ltd",
      email: "hosts@evermore.co.ke",
      approved: true,
      certifiedAt: new Date(),
    })
    .returning();

  await db
    .insert(schema.hearthProperties)
    .values({
      slug: `tigoni-modern-rustic-${Date.now()}`,
      hostId: host.id,
      title: "Tigoni Modern-Rustic Cabin",
      propertyType: "modern_rustic",
      description:
        "Outdoor tub, garden bath, and a private chef on call. Sleeps two; built for couples on the Agano journey.",
      region: "Highlands",
      city: "Tigoni",
      gallery: [
        "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=1200",
      ],
      amenities: ["Outdoor tub", "Private chef", "Fireplace", "Reading nook"],
      nightlyRateKsh: "15000",
      nightlyRateUsd: "120",
      aganoCertified: true,
      connectionBoxIncluded: true,
      minNights: 2,
      maxOccupancy: 2,
      landmarkTags: ["near tea farm", "near golf"],
    });

  console.log("Seeding sample program + lessons…");
  const [program] = await db
    .insert(schema.programs)
    .values({
      kind: "agano_ascent",
      title: "Agano Ascent — 10 Week Pre-marital",
      description:
        "Ten weeks designed for couples preparing for covenant. Faith, money, conflict, and legacy.",
      durationWeeks: 10,
    })
    .returning();
  for (let w = 1; w <= 10; w++) {
    await db.insert(schema.programLessons).values({
      programId: program.id,
      week: w,
      title: `Week ${w} — ${
        [
          "Origin stories",
          "Faith foundations",
          "Money & vision",
          "Conflict patterns",
          "Family of origin",
          "Sexual intimacy",
          "Career & ambition",
          "Community & church",
          "Trauma & healing",
          "Vows & legacy",
        ][w - 1]
      }`,
      body: "Practical exercises, reflections, and one shared meal.",
    });
  }

  console.log("Seeding partners + deals…");
  for (const p of SAMPLE_PARTNERS) {
    const [partner] = await db
      .insert(schema.datePartners)
      .values(p)
      .returning();
    await db.insert(schema.dateVaultDeals).values({
      partnerId: partner.id,
      title: `${p.name} — Member Experience`,
      description: `An evening at ${p.name} reserved for Evermore members.`,
      discountCode: "EVM-MEMBER",
      discountPct: 20,
      originalPriceKsh: "7500",
      memberPriceKsh: "6000",
      vibeTags:
        p.category === "spa"
          ? ["nature", "quiet"]
          : p.category === "restaurant"
            ? ["food", "creative"]
            : ["intimate", "creative"],
      spendingTier: "standard",
    });
  }

  console.log("Seeding professional…");
  await db.insert(schema.professionals).values({
    fullName: "Dr. Anne Wairimu",
    email: "anne@vetted.local",
    specialties: ["Communication", "Pre-marital"],
    bio: "Licensed therapist focused on Christian couples in the Nairobi corridor.",
    teleHealthEnabled: true,
    city: "Nairobi",
    rate: 6500,
  });

  console.log("Seed complete.");
  await client.end({ timeout: 5 });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
