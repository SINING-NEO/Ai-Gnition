"use client";

import { Mail, CalendarDays, Table2, Globe, Hand } from "lucide-react";

type EventRow = {
  id: string;
  source: string;
  action: string;
  summary: string;
  occurredAt: string;
};

const SOURCE_ICON = {
  email: { Icon: Mail, color: "var(--blue)" },
  calendar: { Icon: CalendarDays, color: "var(--violet)" },
  sheets: { Icon: Table2, color: "var(--green)" },
  browser: { Icon: Globe, color: "var(--cyan)" },
  manual: { Icon: Hand, color: "var(--orange)" },
} as const;

export function ActivityFeed({ events }: { events: EventRow[] }) {
  if (!events.length) return null;

  return (
    <section className="animate-rise-delay-2">
      <h2 className="font-display mb-4 text-2xl font-medium">Observer feed</h2>
      <ul className="card divide-y divide-line/60 px-2">
        {events.map((e) => {
          const { Icon, color } =
            SOURCE_ICON[e.source as keyof typeof SOURCE_ICON] ?? SOURCE_ICON.manual;
          return (
            <li key={e.id} className="flex items-center gap-4 px-3 py-3.5">
              <span className="icon-dot h-10 w-10">
                <Icon className="h-4 w-4" style={{ color }} />
              </span>
              <span className="min-w-0 flex-1 truncate text-sm">{e.summary}</span>
              <time className="whitespace-nowrap text-xs text-muted">
                {new Date(e.occurredAt).toLocaleString(undefined, {
                  weekday: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </time>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
