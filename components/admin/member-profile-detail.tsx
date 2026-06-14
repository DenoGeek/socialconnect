import {
  optionLabel,
  optionLabels,
  FAMILIAL_STATUS,
  CHILDREN_CUSTODY,
  EDUCATION_LEVELS,
  PRIMARY_INDUSTRIES,
  FAMILY_PLANNING,
  DESIRED_FUTURE_CHILDREN,
  ALTAR_TIMELINE,
  RELOCATION_OPENNESS,
  SPIRITUAL_RHYTHMS_HOME,
  DOCTRINAL_ALIGNMENT,
  HOUSEHOLD_LEADERSHIP,
  PROFESSIONAL_RHYTHMS,
  FINANCIAL_STEWARDSHIP,
  ENVIRONMENT_PREFERENCE,
  CORE_FAITH_IDENTITY,
} from "@/lib/profile/create-profile";
import {
  genderLabel,
  genderPreferenceLabels,
  genderPreferencesFromLookingFor,
} from "@/lib/profile/gender";
import { getProfileProgressLabel } from "@/lib/profile/onboarding-status";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Profile, User } from "@/db/schema/identity";

function childrenSummary(profile?: Profile | null) {
  if (profile?.childrenCount == null) return "—";
  if (profile.childrenCount === 0) return "None";
  const custody = optionLabel(CHILDREN_CUSTODY, profile.childrenCustody);
  return custody === "—"
    ? String(profile.childrenCount)
    : `${profile.childrenCount} · ${custody}`;
}

export function MemberProfileDetail({
  user,
  profile,
}: {
  user: Pick<User, "name" | "email" | "pathway" | "vettingStatus" | "mode">;
  profile: Profile | null;
}) {
  return (
    <div className="space-y-6">
      <Card>
        <CardTitle>Profile progress</CardTitle>
        <div className="mt-3 flex flex-wrap gap-2 text-sm">
          <Badge tone={profile?.onboardingCompletedAt ? "mint" : "amber"}>
            {getProfileProgressLabel(profile)}
          </Badge>
          <Badge tone="neutral">Vetting: {user.vettingStatus}</Badge>
          {user.pathway && (
            <Badge tone={user.pathway === "zahari" ? "amber" : "mint"}>
              {user.pathway}
            </Badge>
          )}
        </div>
      </Card>

      {!profile ? (
        <Card>
          <p className="text-sm text-plum-900/60">No profile created yet.</p>
        </Card>
      ) : (
        <>
          <Card>
            <CardTitle>Community Alias</CardTitle>
            <p className="mt-3 text-display text-2xl text-plum-900">
              {profile.personaAlias ?? "—"}
            </p>
            {profile.personaCategory && (
              <p className="text-xs text-plum-900/50 mt-1">
                {profile.personaCategory}
              </p>
            )}
          </Card>

          <Card>
            <CardTitle>Identity</CardTitle>
            <dl className="grid grid-cols-2 gap-y-3 text-sm mt-3">
              <dt className="text-plum-900/50">Name</dt>
              <dd className="text-plum-900">
                {[profile.firstName, profile.lastName].filter(Boolean).join(" ") ||
                  user.name}
              </dd>
              <dt className="text-plum-900/50">Email</dt>
              <dd className="text-plum-900">{user.email}</dd>
              <dt className="text-plum-900/50">Gender</dt>
              <dd className="text-plum-900">{genderLabel(profile.gender)}</dd>
              <dt className="text-plum-900/50">Interested in</dt>
              <dd className="text-plum-900">
                {genderPreferenceLabels(
                  genderPreferencesFromLookingFor(
                    profile.lookingFor,
                    profile.gender,
                  ),
                  profile.gender,
                )}
              </dd>
              <dt className="text-plum-900/50">Year of birth</dt>
              <dd className="text-plum-900">
                {profile.birthYear
                  ? `${profile.birthYear} (age ${new Date().getFullYear() - profile.birthYear})`
                  : "—"}
              </dd>
              <dt className="text-plum-900/50">Current country</dt>
              <dd className="text-plum-900">{profile.country ?? "—"}</dd>
              <dt className="text-plum-900/50">Current city</dt>
              <dd className="text-plum-900">{profile.city ?? "—"}</dd>
              <dt className="text-plum-900/50">Country of heritage</dt>
              <dd className="text-plum-900">
                {profile.countryOfHeritage ?? "—"}
              </dd>
              <dt className="text-plum-900/50">Familial status</dt>
              <dd className="text-plum-900">
                {optionLabel(FAMILIAL_STATUS, profile.familialStatus)}
              </dd>
              <dt className="text-plum-900/50">Children</dt>
              <dd className="text-plum-900">{childrenSummary(profile)}</dd>
              <dt className="text-plum-900/50">Family planning vision</dt>
              <dd className="text-plum-900">
                {optionLabel(FAMILY_PLANNING, profile.familyPlanningVision)}
              </dd>
              {profile.desiredFutureChildren && (
                <>
                  <dt className="text-plum-900/50">Desired future children</dt>
                  <dd className="text-plum-900">
                    {optionLabel(
                      DESIRED_FUTURE_CHILDREN,
                      profile.desiredFutureChildren,
                    )}
                  </dd>
                </>
              )}
              <dt className="text-plum-900/50">Highest education</dt>
              <dd className="text-plum-900">
                {optionLabel(EDUCATION_LEVELS, profile.educationLevel)}
              </dd>
              <dt className="text-plum-900/50">Profession</dt>
              <dd className="text-plum-900">{profile.profession ?? "—"}</dd>
              <dt className="text-plum-900/50">Primary industry</dt>
              <dd className="text-plum-900">
                {optionLabel(PRIMARY_INDUSTRIES, profile.primaryIndustry)}
              </dd>
              <dt className="text-plum-900/50">Phone</dt>
              <dd className="text-plum-900">{profile.phone ?? "—"}</dd>
              <dt className="text-plum-900/50">Mode</dt>
              <dd className="text-plum-900 capitalize">{user.mode}</dd>
            </dl>
          </Card>

          <Card>
            <CardTitle>Relationship Intent</CardTitle>
            <dl className="grid grid-cols-2 gap-y-3 text-sm mt-3">
              <dt className="text-plum-900/50">Timeline to the altar</dt>
              <dd className="text-plum-900">
                {optionLabel(ALTAR_TIMELINE, profile.altarTimeline)}
              </dd>
              <dt className="text-plum-900/50">Open to relocating</dt>
              <dd className="text-plum-900">
                {optionLabel(RELOCATION_OPENNESS, profile.relocationOpenness)}
              </dd>
              <dt className="text-plum-900/50">Spiritual rhythms in the home</dt>
              <dd className="text-plum-900">
                {optionLabel(
                  SPIRITUAL_RHYTHMS_HOME,
                  profile.spiritualRhythmsHome?.[0],
                )}
              </dd>
              <dt className="text-plum-900/50">Doctrinal alignment</dt>
              <dd className="text-plum-900">
                {optionLabel(DOCTRINAL_ALIGNMENT, profile.doctrinalAlignment)}
              </dd>
              <dt className="text-plum-900/50">Household leadership</dt>
              <dd className="text-plum-900">
                {optionLabel(HOUSEHOLD_LEADERSHIP, profile.householdLeadership)}
              </dd>
              <dt className="text-plum-900/50">Professional rhythm</dt>
              <dd className="text-plum-900">
                {optionLabel(PROFESSIONAL_RHYTHMS, profile.professionalRhythm)}
              </dd>
              <dt className="text-plum-900/50">Financial stewardship</dt>
              <dd className="text-plum-900">
                {optionLabels(
                  FINANCIAL_STEWARDSHIP,
                  profile.financialStewardship,
                )}
              </dd>
              <dt className="text-plum-900/50">Environment</dt>
              <dd className="text-plum-900">
                {optionLabel(
                  ENVIRONMENT_PREFERENCE,
                  profile.environmentPreference,
                )}
              </dd>
            </dl>
          </Card>

          <Card>
            <CardTitle>Interests &amp; Lifestyle</CardTitle>
            <dl className="grid grid-cols-2 gap-y-3 text-sm mt-3">
              <dt className="text-plum-900/50">Core faith identity</dt>
              <dd className="text-plum-900">
                {optionLabel(CORE_FAITH_IDENTITY, profile.coreFaithIdentity)}
              </dd>
            </dl>
            <div className="mt-3 flex flex-wrap gap-2">
              {(profile.interests ?? []).length === 0 ? (
                <p className="text-sm text-plum-900/60">None selected.</p>
              ) : (
                profile.interests.map((i) => (
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
        </>
      )}
    </div>
  );
}
