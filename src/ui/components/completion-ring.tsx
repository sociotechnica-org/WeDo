type CompletionRingProps = {
  completedCount: number;
  totalCount: number;
  tint: string;
  innerTint: string;
  size?: 'compact' | 'focused';
};

export function CompletionRing({
  completedCount,
  totalCount,
  tint,
  innerTint,
  size = 'compact',
}: CompletionRingProps) {
  const ringRadius = size === 'focused' ? 38 : 24;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const safeTotal = totalCount > 0 ? totalCount : 1;
  const ratio =
    totalCount > 0
      ? Math.min(Math.max(completedCount / safeTotal, 0), 1)
      : 0;
  const strokeDashoffset = ringCircumference * (1 - ratio);
  const isComplete = totalCount > 0 && completedCount === totalCount;
  const frameSize = size === 'focused' ? 104 : 72;
  const svgSize = size === 'focused' ? 104 : 64;
  const trackStrokeWidth = size === 'focused' ? 8 : 6;
  const ringStrokeWidth = size === 'focused' ? 9 : 7;
  const outerInset = size === 'focused' ? '18px' : '11px';
  const innerInset = size === 'focused' ? '34px' : '21px';

  return (
    <div
      aria-label={`${completedCount} of ${totalCount} tasks complete`}
      className="watercolor-ring relative grid place-items-center rounded-full"
      style={{
        height: `${frameSize}px`,
        width: `${frameSize}px`,
      }}
    >
      <svg
        aria-hidden="true"
        className="-rotate-90 overflow-visible"
        height={svgSize}
        viewBox={`0 0 ${svgSize} ${svgSize}`}
        width={svgSize}
      >
        <circle
          cx={svgSize / 2}
          cy={svgSize / 2}
          fill="none"
          r={ringRadius}
          stroke="rgba(108, 95, 84, 0.16)"
          strokeWidth={trackStrokeWidth}
        />
        <circle
          cx={svgSize / 2}
          cy={svgSize / 2}
          fill="none"
          r={ringRadius}
          stroke={isComplete ? 'rgba(150, 159, 110, 0.78)' : tint}
          strokeDasharray={ringCircumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          strokeWidth={ringStrokeWidth}
        />
      </svg>
      <div
        aria-hidden="true"
        className="absolute rounded-full border border-[rgba(87,72,58,0.10)] bg-[rgba(252,247,240,0.95)]"
        style={{ inset: outerInset }}
      />
      <div
        aria-hidden="true"
        className="absolute rounded-full shadow-[inset_0_0_0_1px_rgba(87,72,58,0.08)]"
        style={{
          inset: innerInset,
          background: isComplete
            ? 'radial-gradient(circle, rgba(194, 202, 164, 0.34), rgba(255,248,240,0.96) 72%)'
            : `radial-gradient(circle, ${innerTint}, rgba(255,248,240,0.96) 72%)`,
        }}
      />
    </div>
  );
}
