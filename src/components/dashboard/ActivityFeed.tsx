"use client";

type EventRow = {
  id: string;
  source: string;
  action: string;
  summary: string;
  occurredAt: string;
};

export function ActivityFeed({ events }: { events: EventRow[] }) {
  if (!events.length) return null;

  return (
    <section className="animate-rise-delay-2">
      <h2 className="mb-4 font-[family-name:var(--font-display)] text-xl font-bold text-fog">
        Observer feed
      </h2>
      <ul className="space-y-0 border-t border-white/15">
        {events.map((e) => (
          <li
            key={e.id}
            className="grid grid-cols-[auto_1fr_auto] gap-4 border-b border-white/10 py-3 text-sm"
          >
            <span className="uppercase tracking-wider text-leaf/80">{e.source}</span>
            <span className="text-mist">{e.summary}</span>
            <time className="whitespace-nowrap text-mist/50">
              {new Date(e.occurredAt).toLocaleString(undefined, {
                weekday: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </time>
          </li>
        ))}
      </ul>
    </section>
  );
}
