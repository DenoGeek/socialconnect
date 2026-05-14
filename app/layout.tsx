import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Evermore — The Relationship Nervous System",
  description:
    "A closed-loop relationship ecosystem. From Discovery (Evermore) to Covenant (Agano).",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body data-app="evermore">{children}</body>
    </html>
  );
}
