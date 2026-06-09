import { AppLink } from "@/components/nav/app-link";
import { eq, count } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";
import { Card, CardTitle, CardSubtitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getAlias } from "@/lib/alias/assign";
import {
  genderLabel,
  genderPreferenceLabels,
  genderPreferencesFromLookingFor,
} from "@/lib/profile/gender";
import {
  optionLabel,
  optionLabels,
  FAMILIAL_STATUS,
  CHILDREN_CUSTODY,
  EDUCATION_LEVELS,
  PRIMARY_INDUSTRIES,
  ALTAR_TIMELINE,
  RELOCATION_OPENNESS,
  FAMILY_PLANNING,
  SPIRITUAL_RHYTHMS_HOME,
  DOCTRINAL_ALIGNMENT,
  PROFESSIONAL_RHYTHMS,
  FINANCIAL_STEWARDSHIP,
  ENVIRONMENT_PREFERENCE,
  HOSPITALITY_FLOW,
  FAMILY_STATUS_COMPATIBILITY,
  HOUSEHOLD_BLUEPRINT,
  CORE_FAITH_IDENTITY,
  HOUSEHOLD_LEADERSHIP,
  DOCTRINAL_FLEXIBILITY,
} from "@/lib/profile/create-profile";
import {
  getOpenMatchCardEvents,
  hasSubmittedMatchCard,
} from "@/lib/matching/open-match-cards";
import { UpgradeToZahariBanner } from "@/components/membership/upgrade-to-zahari";

export default async function ProfilePage() {
  const user = await requireUser();
  const [profile] = await db
    .select()
    .from(schema.profiles)
    .where(eq(schema.profiles.userId, user.id))
    .limit(1);
  const alias = await getAlias(user.id, null);

  const onboardingDone = profile?.onboardingCompletedAt != null;
  const isAmari = user.pathway === "amari";

  const [{ value: ticketCount }] = isAmari
    ? await db
        .select({ value: count() })
        .from(schema.ticketPurchases)
        .where(eq(schema.ticketPurchases.userId, user.id))
    : [{ value: 0 }];

  const submittedMatchCard = isAmari
    ? await hasSubmittedMatchCard(user.id)
    : false;
  const openMatchCards = isAmari
    ? await getOpenMatchCardEvents(user.id)
    : [];

  const journeySteps = isAmari
    ? [
        { label: "Pathway secured", done: user.vettingStatus === "approved" },
        { label: "Profile live", done: onboardingDone },
        { label: "Attend a gathering", done: Number(ticketCount) > 0 },
        {
          label: "Submit Match Card",
          done: submittedMatchCard,
          hint: submittedMatchCard
            ? undefined
            : openMatchCards.length > 0
              ? "Window open now"
              : "After your next event",
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-display text-3xl text-plum-900">
          Welcome, {user.name.split(" ")[0]}
        </h1>
        <p className="text-sm text-plum-900/60">
          Your private profile. Visible only to the Concierge and your matches.
        </p>
      </div>

      {isAmari && openMatchCards.length > 0 && (
        <Card className="bg-mint-soft border border-mint">
          <CardTitle>Match Card open</CardTitle>
          <CardSubtitle>
            Submit impressions for attendees who resonated with you.
          </CardSubtitle>
          <ul className="mt-3 space-y-2 text-sm">
            {openMatchCards.map(({ event, closesAt }) => (
              <li key={event.id}>
                <AppLink
                  href={`/matches/impressions/${event.slug}`}
                  className="underline text-plum-900"
                >
                  {event.title}
                </AppLink>
                <span className="text-plum-900/50 text-xs ml-2">
                  closes{" "}
                  {closesAt.toLocaleString("en-GB", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {isAmari && journeySteps.length > 0 && (
        <Card>
          <CardTitle>Your Amari journey</CardTitle>
          <ol className="mt-3 space-y-2 text-sm">
            {journeySteps.map((s) => (
              <li key={s.label} className="flex items-center gap-2">
                <span
                  className={`h-2 w-2 rounded-full ${s.done ? "bg-mint" : "bg-plum-900/20"}`}
                />
                <span className={s.done ? "text-plum-900" : "text-plum-900/60"}>
                  {s.label}
                  {"hint" in s && s.hint ? ` (${s.hint})` : ""}
                </span>
              </li>
            ))}
          </ol>
        </Card>
      )}

      {user.tier === "elite" && user.pathway === "amari" && (
        <UpgradeToZahariBanner />
      )}

      {user.pathway === "zahari" && (
        <Card>
          <CardTitle>Zahari · Private Circle</CardTitle>
          <CardSubtitle>
            Your profile is invisible in community directories. Work with your
            matchmaker via the concierge portal.
          </CardSubtitle>
          <AppLink href="/concierge" className="block mt-3 underline text-sm text-plum-700 hover:text-plum-900">
            Open concierge →
          </AppLink>
        </Card>
      )}

      {!onboardingDone && (
        <Card className="bg-amber-soft border border-amber">
          <CardTitle>Complete your profile</CardTitle>
          <CardSubtitle>
            Step {profile?.onboardingProgress ?? 0}: Map your identity, intent,
            lifestyle, and theology so the matching engine can read you.
          </CardSubtitle>
          <AppLink href="/profile/onboarding">
            <Button className="mt-4">Continue your profile</Button>
          </AppLink>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardTitle>Your Alias</CardTitle>
          <CardSubtitle>
            Your event identity. Real name hidden until a mutual match.
          </CardSubtitle>
          <p className="mt-4 text-display text-2xl text-plum-900">
            {alias?.alias.name ?? "Unassigned — purchase an event ticket."}
          </p>
        </Card>

        <Card>
          <CardTitle>Community Alias</CardTitle>
          <CardSubtitle>
            Your private persona. Not visible until mutual alignment is confirmed.
          </CardSubtitle>
          <p className="mt-4 text-display text-2xl text-plum-900">
            {profile?.personaAlias ?? "—"}
          </p>
          {profile?.personaCategory && (
            <p className="text-xs text-plum-900/50 mt-1">
              {profile.personaCategory}
            </p>
          )}
        </Card>
      </div>

      <Card>
        <CardTitle>Identity</CardTitle>
        <dl className="grid grid-cols-2 gap-y-3 text-sm mt-3">
          <dt className="text-plum-900/50">Name</dt>
          <dd className="text-plum-900">
            {[profile?.firstName, profile?.lastName].filter(Boolean).join(" ") ||
              user.name}
          </dd>
          <dt className="text-plum-900/50">Gender</dt>
          <dd className="text-plum-900">{genderLabel(profile?.gender)}</dd>
          <dt className="text-plum-900/50">Interested in</dt>
          <dd className="text-plum-900">
            {genderPreferenceLabels(
              genderPreferencesFromLookingFor(profile?.lookingFor, profile?.gender),
              profile?.gender,
            )}
          </dd>
          <dt className="text-plum-900/50">Year of birth</dt>
          <dd className="text-plum-900">
            {profile?.birthYear
              ? `${profile.birthYear} (age ${new Date().getFullYear() - profile.birthYear})`
              : "—"}
          </dd>
          <dt className="text-plum-900/50">Current location</dt>
          <dd className="text-plum-900">{profile?.city ?? "—"}</dd>
          <dt className="text-plum-900/50">Country of heritage</dt>
          <dd className="text-plum-900">{profile?.countryOfHeritage ?? "—"}</dd>
          <dt className="text-plum-900/50">Familial status</dt>
          <dd className="text-plum-900">
            {optionLabel(FAMILIAL_STATUS, profile?.familialStatus)}
          </dd>
          <dt className="text-plum-900/50">Children</dt>
          <dd className="text-plum-900">{childrenSummary(profile)}</dd>
          <dt className="text-plum-900/50">Highest education</dt>
          <dd className="text-plum-900">
            {optionLabel(EDUCATION_LEVELS, profile?.educationLevel)}
          </dd>
          <dt className="text-plum-900/50">Profession</dt>
          <dd className="text-plum-900">{profile?.profession ?? "—"}</dd>
          <dt className="text-plum-900/50">Primary industry</dt>
          <dd className="text-plum-900">
            {optionLabel(PRIMARY_INDUSTRIES, profile?.primaryIndustry)}
          </dd>
          <dt className="text-plum-900/50">Phone</dt>
          <dd className="text-plum-900">{profile?.phone ?? "—"}</dd>
          <dt className="text-plum-900/50">Pathway</dt>
          <dd className="text-plum-900 capitalize">
            {user.pathway ?? "—"}
            {user.pathway === "amari" && (
              <>
                {" · "}
                <AppLink href="/events" className="underline text-sm">
                  Pulse Hub
                </AppLink>
              </>
            )}
          </dd>
          <dt className="text-plum-900/50">Mode</dt>
          <dd className="text-plum-900 capitalize">{user.mode}</dd>
        </dl>
      </Card>

      <Card>
        <CardTitle>Relationship Intent</CardTitle>
        <dl className="grid grid-cols-2 gap-y-3 text-sm mt-3">
          <dt className="text-plum-900/50">Timeline to the altar</dt>
          <dd className="text-plum-900">
            {optionLabel(ALTAR_TIMELINE, profile?.altarTimeline)}
          </dd>
          <dt className="text-plum-900/50">Open to relocating</dt>
          <dd className="text-plum-900">
            {optionLabel(RELOCATION_OPENNESS, profile?.relocationOpenness)}
          </dd>
          <dt className="text-plum-900/50">Family planning</dt>
          <dd className="text-plum-900">
            {optionLabel(FAMILY_PLANNING, profile?.familyPlanningVision)}
          </dd>
          <dt className="text-plum-900/50">Spiritual rhythms</dt>
          <dd className="text-plum-900">
            {optionLabels(SPIRITUAL_RHYTHMS_HOME, profile?.spiritualRhythmsHome)}
          </dd>
          <dt className="text-plum-900/50">Doctrinal alignment</dt>
          <dd className="text-plum-900">
            {optionLabel(DOCTRINAL_ALIGNMENT, profile?.doctrinalAlignment)}
          </dd>
          <dt className="text-plum-900/50">Professional rhythm</dt>
          <dd className="text-plum-900">
            {optionLabel(PROFESSIONAL_RHYTHMS, profile?.professionalRhythm)}
          </dd>
          <dt className="text-plum-900/50">Financial stewardship</dt>
          <dd className="text-plum-900">
            {optionLabels(FINANCIAL_STEWARDSHIP, profile?.financialStewardship)}
          </dd>
          <dt className="text-plum-900/50">Environment</dt>
          <dd className="text-plum-900">
            {optionLabel(ENVIRONMENT_PREFERENCE, profile?.environmentPreference)}
          </dd>
          <dt className="text-plum-900/50">Hospitality</dt>
          <dd className="text-plum-900">
            {optionLabel(HOSPITALITY_FLOW, profile?.hospitalityFlow)}
          </dd>
          <dt className="text-plum-900/50">Family compatibility</dt>
          <dd className="text-plum-900">
            {optionLabel(
              FAMILY_STATUS_COMPATIBILITY,
              profile?.familyStatusCompatibility,
            )}
          </dd>
          <dt className="text-plum-900/50">Household blueprint</dt>
          <dd className="text-plum-900">
            {optionLabel(HOUSEHOLD_BLUEPRINT, profile?.householdBlueprint)}
          </dd>
        </dl>
      </Card>

      <Card>
        <CardTitle>Interests &amp; Lifestyle</CardTitle>
        <div className="mt-3 flex flex-wrap gap-2">
          {(profile?.interests ?? []).length === 0 ? (
            <p className="text-sm text-plum-900/60">None selected yet.</p>
          ) : (
            (profile?.interests ?? []).map((i) => (
              <span
                key={i}
                className="rounded-full bg-plum-900/5 px-3 py-1 text-sm text-plum-900"
              >
                {i}
              </span>
            ))
          )}
        </div>
      </Card>

      <Card>
        <CardTitle>Theological Alignment</CardTitle>
        <dl className="grid grid-cols-2 gap-y-3 text-sm mt-3">
          <dt className="text-plum-900/50">Core faith identity</dt>
          <dd className="text-plum-900">
            {optionLabel(CORE_FAITH_IDENTITY, profile?.coreFaithIdentity)}
          </dd>
          <dt className="text-plum-900/50">Household leadership</dt>
          <dd className="text-plum-900">
            {optionLabel(HOUSEHOLD_LEADERSHIP, profile?.householdLeadership)}
          </dd>
          <dt className="text-plum-900/50">Doctrinal non-negotiable</dt>
          <dd className="text-plum-900">
            {optionLabel(DOCTRINAL_FLEXIBILITY, profile?.doctrinalFlexibility)}
          </dd>
        </dl>
        <div className="mt-6 flex gap-3">
          <AppLink href="/profile/onboarding">
            <Button variant="outline">Edit profile</Button>
          </AppLink>
          <AppLink href="/profile/mode">
            <Button variant="ghost">Switch mode</Button>
          </AppLink>
        </div>
      </Card>
    </div>
  );
}

function childrenSummary(profile?: {
  childrenCount?: number | null;
  childrenCustody?: string | null;
}) {
  if (profile?.childrenCount == null) return "—";
  if (profile.childrenCount === 0) return "None";
  const custody = optionLabel(CHILDREN_CUSTODY, profile.childrenCustody);
  return custody === "—"
    ? String(profile.childrenCount)
    : `${profile.childrenCount} · ${custody}`;
}
