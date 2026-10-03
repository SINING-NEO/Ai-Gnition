export function ProgressRing({
  value,
  size = 132,
  stroke = 12,
  label,
}: {
  value: number;
  size?: number;
  stroke?: number;
  label?: string;
}) {
  const pct = Math.max(0, Math.min(100, value));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  const angle = (pct / 100) * 2 * Math.PI - Math.PI / 2;
  const knobX = size / 2 + r * Math.cos(angle);
  const knobY = size / 2 + r * Math.sin(angle);

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-0">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--line)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--green)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className="ring-progress"
          style={{ ["--ring-full" as string]: c }}
        />
        {pct > 0 && (
          <circle
            cx={knobX}
            cy={knobY}
            r={stroke / 2 - 2}
            fill="var(--surface)"
            stroke="var(--green)"
            strokeWidth={2}
          />
        )}
      </svg>
      <span className="font-display absolute inset-0 flex items-center justify-center text-2xl font-medium">
        {label ?? `${Math.round(pct)}%`}
      </span>
    </div>
  );
}
