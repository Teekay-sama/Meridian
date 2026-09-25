import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Meridian — Forex Research",
  description: "Explore forex trend-pullback setups with transparent rules and synthetic sample data.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
