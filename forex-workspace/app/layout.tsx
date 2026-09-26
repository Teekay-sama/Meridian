import type { Metadata } from "next";
import "./globals.css";
import LegalFooter from "./legal-footer";

export const metadata: Metadata = {
  title: "Meridian Trading Assistant",
  description: "Explore forex market data, strategy checklists, and AI chart screenshot reviews.",
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
      <body className="antialiased">{children}<LegalFooter /></body>
    </html>
  );
}
