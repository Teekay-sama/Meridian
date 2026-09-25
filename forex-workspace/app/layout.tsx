import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Meridian Trading Assistant",
  description: "Learn forex strategies with clear explanations, annotated charts, and synthetic teaching examples.",
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
