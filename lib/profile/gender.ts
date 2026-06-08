export const GENDER_OPTIONS = [
  { value: "man", label: "Man" },
  { value: "woman", label: "Woman" },
] as const;

export type Gender = (typeof GENDER_OPTIONS)[number]["value"];
export type GenderPreference = Gender;

export function genderLabel(value: string | null | undefined) {
  return GENDER_OPTIONS.find((g) => g.value === value)?.label ?? "—";
}

export function oppositeGender(gender: Gender): Gender {
  return gender === "man" ? "woman" : "man";
}

/** Heterosexual matching preference derived from the member's gender. */
export function heterosexualPreference(gender: Gender): GenderPreference[] {
  return [oppositeGender(gender)];
}

export function genderPreferenceLabels(
  prefs: string[] | undefined,
  gender?: string | null,
) {
  if (gender === "man" || gender === "woman") {
    return gender === "man" ? "Women" : "Men";
  }
  if (!prefs?.length) return "—";
  return prefs
    .map((p) => (p === "man" ? "Men" : p === "woman" ? "Women" : p))
    .join(", ");
}

export function genderPreferencesFromLookingFor(
  lookingFor: Record<string, unknown> | null | undefined,
  gender?: string | null,
): GenderPreference[] {
  if (gender === "man" || gender === "woman") {
    return heterosexualPreference(gender);
  }
  const raw = lookingFor?.genderPreference;
  if (!Array.isArray(raw)) return [];
  return raw.filter((v): v is GenderPreference => v === "man" || v === "woman");
}

/** Strict heterosexual pairing: man ↔ woman only. */
export function areGendersCompatible(
  a: {
    gender?: string | null;
    lookingFor?: Record<string, unknown> | null;
  },
  b: {
    gender?: string | null;
    lookingFor?: Record<string, unknown> | null;
  },
) {
  if (!a.gender || !b.gender) return false;
  return (
    (a.gender === "man" && b.gender === "woman") ||
    (a.gender === "woman" && b.gender === "man")
  );
}
