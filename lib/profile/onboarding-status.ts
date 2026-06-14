const SECTION_LABELS = [
  "Identity",
  "Relationship Intent",
  "Interests",
  "Choose Journey",
] as const;

export function getProfileProgressLabel(
  profile: {
    onboardingCompletedAt: Date | null;
    onboardingProgress: number;
  } | null,
): string {
  if (!profile) return "Not started";
  if (profile.onboardingCompletedAt) return "Complete";
  const step = Math.max(
    0,
    Math.min(profile.onboardingProgress, SECTION_LABELS.length - 1),
  );
  return SECTION_LABELS[step] ?? "In progress";
}
