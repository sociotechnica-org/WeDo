type CompletionRingProps = {
  completedCount: number;
  totalCount: number;
  tint: string;
  innerTint: string;
};

const ringRadius = 24;
const ringCircumference = 2 * Math.PI * ringRadius;

export function CompletionRing({
  completedCount,
  totalCount,
  tint,
  innerTint,
}: CompletionRingProps) {
  const safeTotal = totalCount > 0 ? totalCount : 1;
  const ratio =
    totalCount > 0
      ? Math.min(Math.max(completedCount / safeTotal, 0), 1)
      : 0;
  const strokeDashoffset = ringCircumference * (1 - ratio);
  const isComplete = totalCount > 0 && completedCount === totalCount;

  return (
    <div
      aria-label={`${completedCount} of ${totalCount} tasks complete`}
      className="watercolor-ring relative grid size-[4.5rem] place-items-center rounded-full"
    >
      <svg
        aria-hidden="true"
        className="-rotate-90 overflow-visible"
        height="64"
        viewBox="0 0 64 64"
        width="64"
      >
        <circle
          cx="32"
          cy="32"
          fill="none"
          r={ringRadius}
          stroke="rgba(108, 95, 84, 0.16)"
          strokeWidth="6"
        />
        <circle
          cx="32"
          cy="32"
          fill="none"
          r={ringRadius}
          stroke={isComplete ? 'rgba(150, 159, 110, 0.78)' : tint}
          strokeDasharray={ringCircumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          strokeWidth="7"
        />
      </svg>
      <div
        aria-hidden="true"
        className="absolute inset-[11px] rounded-full border border-[rgba(87,72,58,0.10)] bg-[rgba(252,247,240,0.95)]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-[21px] rounded-full shadow-[inset_0_0_0_1px_rgba(87,72,58,0.08)]"
        style={{
          background: isComplete
            ? 'radial-gradient(circle, rgba(194, 202, 164, 0.34), rgba(255,248,240,0.96) 72%)'
            : `radial-gradient(circle, ${innerTint}, rgba(255,248,240,0.96) 72%)`,
        }}
      />
    </div>
  );
}
