"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Patterns" },
  { href: "/chat", label: "Ask" },
];

function LogoMark() {
  return (
    <span className="icon-dot h-10 w-10 bg-surface">
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
        <path
          d="M12 3c1.5 3 4.5 5 4.5 9.2A4.5 4.5 0 0 1 12 17a4.5 4.5 0 0 1-4.5-4.6c0-1.8.9-3 1.9-4 .2 1.6 1 2.6 2.1 2.9C11 9 11 6 12 3Z"
          fill="var(--lime)"
        />
        <path
          d="M8.5 19.5h7"
          stroke="var(--lime)"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-full flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-6 md:px-8">
        <Link href="/" className="flex items-center gap-3">
          <LogoMark />
          <span className="font-display text-xl font-medium tracking-tight">
            OneLastThing
          </span>
        </Link>
        <nav className="flex items-center gap-1 rounded-2xl bg-surface p-1">
          {links.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "rounded-xl px-4 py-2 text-sm font-medium transition",
                  active ? "bg-lime text-bg" : "text-muted hover:text-text",
                )}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-5 pb-20 md:px-8">
        {children}
      </main>
    </div>
  );
}
