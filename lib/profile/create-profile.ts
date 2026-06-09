/**
 * Create Profile workflow — option sets transcribed verbatim from
 * "IRL App Copy.md" (Steps 1–4). Slugs are stable storage keys; labels and
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

// ── Step 2: Relationship Intent ───────────────────────────────────────────────

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

export const RELOCATION_OPENNESS: Option[] = [
  { value: "global", label: "Yes, globally" },
  { value: "regional", label: "Yes, regionally / within the continent" },
  { value: "rooted", label: "No, I am rooted in my current city" },
];

export const FAMILY_PLANNING: Option[] = [
  { value: "desires_children_soon", label: "Desires children in the near future" },
  {
    value: "open_focus_foundation",
    label: "Open to children, but focusing on the marital foundation first",
  },
  {
    value: "family_complete_blended",
    label: "My family is already complete/open to blended family dynamics",
  },
];

export const SPIRITUAL_RHYTHMS_HOME: Option[] = [
  {
    value: "daily_prayer_fasting",
    label:
      "Daily family prayer, devotion, and consistent fasting rhythms are essential to me.",
  },
  {
    value: "weekly_service_fellowship",
    label:
      "Active, weekly service and fellowship in a local church body are essential to me.",
  },
  {
    value: "personal_walk",
    label:
      "A quiet, deeply personal walk with God that focuses on individual study and reflection.",
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
      "I prefer a traditional division of financial stewardship and household management.",
  },
  {
    value: "kingdom_giving",
    label:
      "Active Kingdom giving, tithing, and institutional philanthropy must be a joint priority.",
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

export const HOSPITALITY_FLOW: Option[] = [
  {
    value: "hearth_hospitality",
    label:
      "The Hearth & Hospitality: I want a home that is an open sanctuary, frequently hosting close friends, family, and fellowship gatherings.",
  },
  {
    value: "private_sanctuary",
    label:
      "The Private Sanctuary: I protect a quiet, highly private domestic space reserved almost exclusively for the immediate family.",
  },
];

export const FAMILY_STATUS_COMPATIBILITY: Option[] = [
  {
    value: "open_to_children",
    label:
      "I am open to a partner who already has children (blended family dynamics).",
  },
  {
    value: "no_previous_children",
    label: "I am only looking for a partner with no previous children.",
  },
];

export const HOUSEHOLD_BLUEPRINT: Option[] = [
  {
    value: "traditional_structured",
    label:
      "I value a highly structured, traditional family dynamic with clear, distinct roles for husband and wife.",
  },
  {
    value: "collaborative_egalitarian",
    label:
      "I value a fully collaborative, egalitarian approach to managing the home and career.",
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
          "GFDF Diet",
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
  {
    pillar: "IV. Spiritual Rhythms",
    groups: [
      {
        heading: "Christian Rhythms",
        items: [
          "Studying scripture",
          "Reading Christian books",
          "Dedicating time to prayer",
          "Devotion",
          "Fasting",
          "Faith-focused gatherings",
          "Worship events",
          "Church ministry",
        ],
      },
    ],
  },
];

// ── Step 4: Theological Alignment ─────────────────────────────────────────────

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

export const HOUSEHOLD_LEADERSHIP: Option[] = [
  {
    value: "complementarian",
    label: "Traditional Complementarian",
    description:
      "I believe God calls the husband to be the spiritual head, provider, and protector of the home, while the wife lovingly supports, nurtures, and co-leads the household.",
  },
  {
    value: "egalitarian",
    label: "Collaborative Egalitarian",
    description:
      "I believe God calls husbands and wives to share spiritual authority and leadership equally, co-managing all decisions, career paths, and household responsibilities side-by-side.",
  },
];

export const DOCTRINAL_FLEXIBILITY: Option[] = [
  {
    value: "strict_alignment",
    label: "Strict Alignment",
    description:
      "I need a partner who shares my exact theological views, church background, and doctrinal interpretations.",
  },
  {
    value: "grounded_unity",
    label: "Grounded Unity",
    description:
      "I am comfortable with minor theological differences, provided we agree on the essentials (the Gospel, the authority of Scripture, and Jesus as Lord).",
  },
];
