/**
 * Create Profile workflow — option sets transcribed verbatim from
 * "IRL App Copy 2.md" (Steps 1–4). Slugs are stable storage keys; labels and
 * descriptions match the source document exactly.
 */

export type Option = { value: string; label: string; description?: string };

/** Resolve a stored slug to its human label for display. */
export function optionLabel(options: Option[], value?: string | null): string {
  if (!value) return "—";
  return options.find((o) => o.value === value)?.label ?? value;
}

/** Resolve a list of stored slugs to a comma-separated label string. */
export function optionLabels(
  options: Option[],
  values?: string[] | null,
): string {
  if (!values || values.length === 0) return "—";
  return values
    .map((v) => options.find((o) => o.value === v)?.label ?? v)
    .join(", ");
}

// ── Step 1: Identity ─────────────────────────────────────────────────────────

/** Doc presents Female / Male; stored against the existing gender enum. */
export const GENDER_CHOICES: Array<{ value: "woman" | "man"; label: string }> = [
  { value: "woman", label: "Female" },
  { value: "man", label: "Male" },
];

export const FAMILIAL_STATUS: Option[] = [
  { value: "single", label: "Single (Never Married)" },
  { value: "divorced", label: "Divorced" },
  { value: "widowed", label: "Widowed" },
];

export const DIVORCE_CERTIFICATION =
  "I certify that my divorce is legally finalised with a decree absolute, and I am emotionally and ecclesiastically cleared to enter a holy covenant marriage today.";

export const CHILDREN_CUSTODY: Option[] = [
  {
    value: "joint",
    label: "Joint",
    description:
      "I co-parent with an ex-spouse under a structured, cooperative arrangement.",
  },
  {
    value: "primary_solo",
    label: "Primary / Solo Custody",
    description:
      "My children reside primarily with me, and a future partner will be fully stepping into their daily household upbringing.",
  },
];

export const EDUCATION_LEVELS: Option[] = [
  { value: "doctoral", label: "Doctoral" },
  { value: "executive_masters", label: "Executive Master's" },
  { value: "masters", label: "Master's Degree" },
  { value: "specialised_postgrad", label: "Specialised Post-Graduate" },
  { value: "bachelors", label: "Bachelor's Degree" },
];

export const PRIMARY_INDUSTRIES: Option[] = [
  { value: "fintech", label: "Fintech & Financial Services" },
  { value: "energy", label: "Energy, Utilities & Infrastructure" },
  { value: "technology", label: "Technology & Digital Ecosystems" },
  {
    value: "real_estate",
    label: "Real Estate, Property Development & Architecture",
  },
  { value: "corporate_law", label: "Corporate Law, Advisory & Global Strategy" },
  { value: "medicine", label: "Medicine, Healthcare & Bio-Tech" },
  { value: "public_policy", label: "Institutional Leadership & Public Policy" },
];

export const PERSONA_CATEGORIES: Array<{ category: string; personas: string[] }> = [
  {
    category: "Leadership & Visionary Personas",
    personas: [
      "The Steward",
      "The Visionary",
      "The Guardian",
      "The Builder",
      "Sojourner",
      "The Pioneer",
    ],
  },
  {
    category: "Character & Spiritual Postures",
    personas: [
      "The Sentinel",
      "The Sojourner",
      "The Cultivator",
      "The Envoy",
      "The Anchor",
      "The Voyager",
    ],
  },
  {
    category: "Enterprise & Legacy Builders",
    personas: ["The Architect", "The Catalyst", "The Trailblazer"],
  },
  {
    category: "The Earth & Wellness Cultivators",
    personas: ["The Forester", "The Provider", "The Harmonizer", "The Shepherd"],
  },
];

// ── Step 2: Relationship & Intent ───────────────────────────────────────────

export const RELATIONSHIP_INTENT_WARNING =
  "Agano Evermore is a sanctuary built exclusively for those ready to transition from singlehood into holy matrimony.";

export const ALTAR_TIMELINE: Option[] = [
  {
    value: "covenant_foundations",
    label: "Covenant Foundations",
    description:
      "I am explicitly seeking marriage, but my immediate step is building a deep foundation of shared values through real-world fellowship before entering a formal, exclusive courtship.",
  },
  {
    value: "covenant_ready",
    label: "Covenant Ready",
    description:
      "I have immediate clarity. I am ready to enter formal courtship and begin the structured pre-marital preparation cohorts within the next 12 to 24 months.",
  },
];

export const COVENANT_FOUNDATIONS_SAFEGUARD =
  "The Time-Wasting Safeguard: By selecting this track, I commit to a deliberate, non-casual and intentional exploration that will transition into a definitive decision regarding a formal courtship within 3 to 6 months. I am not here to engage in open-ended or modern casual dating.";

export const RELOCATION_OPENNESS: Option[] = [
  { value: "global", label: "Yes, globally" },
  { value: "regional", label: "Yes, regionally / within the continent" },
  { value: "rooted", label: "No, I am rooted in my current city" },
];

export const SPIRITUAL_RHYTHMS_HOME_PROMPT =
  "How do you envision cultivating and protecting the spiritual atmosphere of your future home as a couple? Select the anchor that best describes your required corporate rhythm.";

export const SPIRITUAL_RHYTHMS_HOME: Option[] = [
  {
    value: "daily_prayer_corporate",
    label:
      "Daily prayer together, shared devotionals, and consistent corporate fasting rhythms are absolute, non-negotiable pillars for my future home.",
  },
  {
    value: "rooted_in_ministry",
    label:
      "Rooted in ministry; active, weekly service, leadership, and visible fellowship within a local church body are the primary ways we must express our faith together.",
  },
  {
    value: "quiet_intellectual_devotion",
    label:
      "Centred on intellectual and quiet devotion, I value a home characterised by deep individual scripture study, personal reflection, and quiet walks with God, rather than highly rigid or public religious structures.",
  },
];

export const DOCTRINAL_ALIGNMENT: Option[] = [
  {
    value: "identical_views",
    label: "We must share identical theological/doctrinal views.",
  },
  {
    value: "slight_differences",
    label:
      "I am comfortable with slight theological differences, as long as Christ is our absolute centre.",
  },
];

export const HOUSEHOLD_LEADERSHIP: Option[] = [
  {
    value: "egalitarian_peers",
    label:
      "I believe God calls husbands and wives to share spiritual authority and leadership. All major decisions, career paths, financial management, and household responsibilities are co-managed side-by-side as true peers, without gender-based hierarchy.",
  },
  {
    value: "biblical_complementarian",
    label:
      "I believe in a biblical order where the husband is called to the highest standard of sacrificial, Christ-like leadership, protection, and ultimate accountability for the home, while the wife holds a powerful role of wise counsel, honour, and active co-management, not suppressed.",
  },
  {
    value: "strict_traditional_hierarchy",
    label:
      "I believe in a strict, traditional hierarchy where the husband holds absolute governing authority and final decision-making power over all aspects, and the wife's primary assignment is the quiet cultivation of the domestic sphere.",
  },
];

export const PROFESSIONAL_RHYTHMS: Option[] = [
  {
    value: "executive_demands",
    label:
      "I need a partner who understands the high demands, travel, and hours of an executive or entrepreneurial life.",
  },
  {
    value: "work_life_boundaries",
    label:
      "I prioritise strict work-life boundaries and need a partner who values a slower, highly present home life.",
  },
];

export const FINANCIAL_STEWARDSHIP: Option[] = [
  {
    value: "shared_empire",
    label:
      "I want to build a shared financial empire (co-investing, building businesses, or joint ventures).",
  },
  {
    value: "traditional_division",
    label:
      "I prefer a traditional division of financial stewardship and household management. One partner focuses on economic security/expansion, while the other focuses on household management.",
  },
  {
    value: "structural_independence",
    label:
      "I value structural independence. While we completely support a shared household budget and shared family goals, we maintain distinct professional careers and independently managed asset portfolios.",
  },
];

export const ENVIRONMENT_PREFERENCE: Option[] = [
  {
    value: "city_centric",
    label:
      "I am rooted in vibrant, city-centric lifestyle spaces (near business hubs and tech ecosystems).",
  },
  {
    value: "countryside_coastal",
    label:
      "I prefer or plan to transition to a quieter, countryside or coastal estate rhythm.",
  },
];

// ── Step 3: Interests & Lifestyle Alignment ───────────────────────────────────

export type InterestPillar = {
  pillar: string;
  groups: Array<{ heading: string; items: string[] }>;
};

export const INTEREST_PILLARS: InterestPillar[] = [
  {
    pillar: "I. Lifestyle & Culture",
    groups: [
      {
        heading: "Property Design & Architecture",
        items: ["Real estate", "Interior design & Styling", "DIY Home Projects"],
      },
      {
        heading: "Art & Literature",
        items: ["Visiting galleries", "Reading books", "Appreciating creative design"],
      },
      {
        heading: "Fine Dining & Culinary Experiences",
        items: [
          "Trying new restaurants",
          "Farm-to-table food",
          "Trying new recipes at home",
        ],
      },
      {
        heading: "Nature & Outdoor Adventure",
        items: ["Hiking", "Coastal getaways", "Exploring nature"],
      },
      {
        heading: "Travel & Global Exploration",
        items: [
          "International trips & global discovery",
          "Local road trips & hidden gems",
          "Weekend getaways & staycations",
          "Boutique hotels & unique stays",
          "Nature retreats & scenic escapes",
        ],
      },
    ],
  },
  {
    pillar: "II. Health & Wellness",
    groups: [
      {
        heading: "Healthy Living & Clean Nutrition",
        items: [
          "Whole foods & clean nutrition",
          "Mindful fasting & wellness routines",
          "Plant-based & botanical infusions",
          "GFDF (Gluten-free Dairy-free) Diet",
        ],
      },
      {
        heading: "Fitness & Active Training",
        items: ["Gym workouts", "Running", "Sports"],
      },
      {
        heading: "Cooking & Hosting at Home",
        items: [
          "Hosting intimate dinners",
          "Loving home life",
          "Cooking & home-cooked meals",
          "Home fellowship",
        ],
      },
      {
        heading: "Farming & Land Development",
        items: ["Farming", "Gardening", "Land ownership", "Country living"],
      },
    ],
  },
  {
    pillar: "III. Impact",
    groups: [
      {
        heading: "Mentorship & Continuous Learning",
        items: [
          "Mentorship/ Mentoring",
          "Attending masterclasses & seminars",
          "Self-improvement & personal growth",
          "Professional & spiritual development",
        ],
      },
      {
        heading: "Charity & Church Support",
        items: [
          "Philanthropy & giving back",
          "Community & volunteering programs",
          "Supporting ministry work",
          "Charity initiatives",
        ],
      },
    ],
  },
];

export const CHRISTIAN_RHYTHMS: string[] = [
  "Studying scripture",
  "Reading Christian books",
  "Dedicating time to prayer",
  "Devotion",
  "Fasting",
  "Faith-focused gatherings",
  "Worship events",
  "Church ministry",
];

export const CORE_FAITH_IDENTITY: Option[] = [
  {
    value: "pentecostal",
    label: "Pentecostal / Charismatic",
    description: "e.g. CITAM, Mavuno Church, Deliverance Church, Winners Chapel",
  },
  {
    value: "non_denominational",
    label: "Non-Denominational / Evangelical",
    description: "e.g. Nairobi Chapel, Karura Community Church",
  },
  { value: "anglican", label: "Anglican", description: "e.g. ACK, Episcopalian" },
  {
    value: "presbyterian",
    label: "Presbyterian / Reformed",
    description: "e.g. PCEA, Christian Reformed",
  },
  {
    value: "baptist",
    label: "Baptist",
    description: "e.g. Baptist Convention of Kenya",
  },
  { value: "methodist_lutheran", label: "Methodist / Lutheran" },
  { value: "sda", label: "Seventh-day Adventist (SDA)" },
  { value: "catholic", label: "Catholic" },
  { value: "other", label: "Other Bible-Based Christian" },
];

// ── Step 4: Choose Your Journey ───────────────────────────────────────────────

export const JOURNEY_INTRO =
  "Your profile is safe with us. No one can browse your name or look up your job. You are completely anonymous.";

export const AMARI_PATH = {
  title: "The Amari Path",
  meaning: 'Amari ~ "Promised by God"',
  description:
    "Dive into a vibrant community of intentional, like-minded believers, attend beautiful curated gatherings, and get support through your relationship journey once matched up.",
  benefits: [
    "Real-World Curated Gatherings",
    "Exclusive Ecosystem Member Discounts",
    "Relationship & Marriage Preparation Cohorts",
    "Hearth & Marrow Stays (Connection Boxes)",
    "Lifetime Support Ecosystem (Christian therapists, counsellors, and marital/parental classes)",
  ],
  cost: "Absolutely free!",
};

export const ZAHARI_PATH = {
  title: "The Zahari Path",
  meaning: 'Zahari ~ "God Has Remembered"',
  description:
    "This path is hands-on and deeply personal, designed for high-profile leaders and executives who are not in a position to attend social mixers. You will have access to our human matching team to do all the heavy lifting.",
  benefits: [
    "100% Social Shielding & Total Privacy",
    "The Private Matching Concierge Package",
    "Hand-Curated Introductions",
    "Bespoke Date Concierge Services",
    "All-Inclusive Amari Access",
    "Priority access to The Master Table (exclusive married retreats, destination trips, and premium date nights)",
  ],
  investment:
    "Zahari is a premium, deeply personal service. We don't accept payments upfront. Your journey begins with a relaxed, private 20-minute video chat with one of our lead matchmakers so we can truly understand where you are. Payment options will be shared only after we ensure we are a perfect fit for what you need.",
};
