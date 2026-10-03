export function Squiggle({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 200 24"
      fill="none"
      preserveAspectRatio="none"
      className={`squiggle ${className}`}
    >
      <path
        d="M4 14 C 40 6, 90 4, 196 10 M18 19 C 70 13, 120 12, 170 16"
        stroke="var(--lime)"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Highlight({
  children,
  tone = "lime",
}: {
  children: React.ReactNode;
  tone?: "lime" | "violet";
}) {
  return (
    <span className="relative inline-block whitespace-nowrap">
      <span className={tone === "lime" ? "text-lime" : "text-violet"}>{children}</span>
      {tone === "lime" && (
        <Squiggle className="absolute -bottom-3 left-0 h-4 w-full" />
      )}
    </span>
  );
}
