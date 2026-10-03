import { Activity, Repeat, Workflow, Play } from "lucide-react";

type Stats = {
  eventCount: number;
  patternCount: number;
  workflowCount: number;
  runCount: number;
};

export function StatTiles({ stats }: { stats: Stats }) {
  const tiles = [
    { label: "Observed", value: stats.eventCount, unit: "events", Icon: Activity, color: "var(--orange)" },
    { label: "Patterns", value: stats.patternCount, unit: "loops", Icon: Repeat, color: "var(--lime)" },
    { label: "Workflows", value: stats.workflowCount, unit: "built", Icon: Workflow, color: "var(--violet)" },
    { label: "Runs", value: stats.runCount, unit: "done", Icon: Play, color: "var(--green)" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {tiles.map(({ label, value, unit, Icon, color }) => (
        <div key={label} className="tile flex items-start justify-between p-4">
          <div>
            <p className="text-sm font-medium">{label}</p>
            <p className="mt-2 text-lg font-semibold">
              {value} <span className="text-sm font-normal text-muted">{unit}</span>
            </p>
          </div>
          <Icon className="h-5 w-5" style={{ color }} strokeWidth={2.2} />
        </div>
      ))}
    </div>
  );
}
