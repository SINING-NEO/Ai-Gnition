"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Patterns" },
  { href: "/chat", label: "Ask" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="relative flex min-h-full flex-col">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-64 opacity-40"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%232a9d8f' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
        }}
      />
      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5 md:px-8">
        <Link href="/" className="group flex items-baseline gap-2">
          <span className="font-[family-name:var(--font-display)] text-2xl font-extrabold tracking-tight text-fog md:text-3xl">
            OneLastThing
          </span>
          <span className="hidden text-xs uppercase tracking-[0.2em] text-mist/70 sm:inline">
            Ai-Gnition
          </span>
        </Link>
        <nav className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1 backdrop-blur">
          {links.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "rounded-full px-4 py-1.5 text-sm font-medium transition",
                  active
                    ? "bg-ember text-white"
                    : "text-mist hover:bg-white/10 hover:text-fog",
                )}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="relative z-10 mx-auto w-full max-w-6xl flex-1 px-5 pb-16 md:px-8">
        {children}
      </main>
    </div>
  );
}
