export function formatKes(amount: number): string {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatEventDate(starts: Date, ends: Date): string {
  const sameDay = starts.toDateString() === ends.toDateString();
  if (sameDay) {
    return `${starts.toLocaleDateString("en-KE", {
      weekday: "short",
      month: "short",
      day: "numeric",
    })} · ${starts.toLocaleTimeString("en-KE", {
      hour: "numeric",
      minute: "2-digit",
    })}`;
  }
  return `${starts.toLocaleDateString("en-KE", {
    month: "short",
    day: "numeric",
  })} – ${ends.toLocaleDateString("en-KE", {
    month: "short",
    day: "numeric",
  })}`;
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
