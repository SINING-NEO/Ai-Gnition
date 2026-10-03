import type { Metadata } from "next";
import { Syne, Figtree } from "next/font/google";
import { AppShell } from "@/components/layout/AppShell";
import "./globals.css";

const display = Syne({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const body = Figtree({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "OneLastThing — Ai-Gnition",
  description:
    "Notices your repetitive work, proposes automations, and a team of AI agents builds them — with your approval.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} h-full`}>
      <body className="min-h-full antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
