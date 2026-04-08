import { useId } from 'react';

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
  const ringRadius = size === 'focused' ? 37 : 24;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const safeTotal = totalCount > 0 ? totalCount : 1;
  const ratio =
    totalCount > 0
      ? Math.min(Math.max(completedCount / safeTotal, 0), 1)
      : 0;
  const strokeDashoffset = ringCircumference * (1 - ratio);
  const isComplete = totalCount > 0 && completedCount === totalCount;
  const frameSize = size === 'focused' ? 116 : 78;
  const svgSize = size === 'focused' ? 116 : 78;
  const trackStrokeWidth = size === 'focused' ? 6 : 4.5;
  const bloomStrokeWidth = size === 'focused' ? 12 : 8;
  const ringStrokeWidth = size === 'focused' ? 7.5 : 5.5;
  const outerInset = size === 'focused' ? '20px' : '14px';
  const innerInset = size === 'focused' ? '34px' : '23px';
  const gradientId = useId();
  const bloomId = useId();
  const glowColor = isComplete
    ? 'rgba(158, 174, 118, 0.92)'
    : 'rgba(93, 151, 206, 0.94)';

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
        <defs>
          <linearGradient id={gradientId} x1="8%" x2="92%" y1="12%" y2="88%">
            <stop offset="0%" stopColor="rgba(160, 198, 231, 0.96)" />
            <stop offset="65%" stopColor={isComplete ? glowColor : tint} />
            <stop offset="100%" stopColor="rgba(76, 126, 179, 0.96)" />
          </linearGradient>
          <linearGradient id={bloomId} x1="0%" x2="100%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(255, 255, 255, 0.44)" />
            <stop offset="100%" stopColor="rgba(93, 151, 206, 0.12)" />
          </linearGradient>
        </defs>
        <circle
          cx={svgSize / 2}
          cy={svgSize / 2}
          fill="none"
          r={ringRadius}
          stroke="rgba(107, 90, 75, 0.22)"
          strokeWidth={trackStrokeWidth}
        />
        <circle
          cx={svgSize / 2}
          cy={svgSize / 2}
          fill="none"
          r={ringRadius}
          stroke={`url(#${bloomId})`}
          strokeDasharray={ringCircumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          strokeWidth={bloomStrokeWidth}
        />
        <circle
          cx={svgSize / 2}
          cy={svgSize / 2}
          fill="none"
          r={ringRadius}
          stroke={`url(#${gradientId})`}
          strokeDasharray={ringCircumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          strokeWidth={ringStrokeWidth}
        />
      </svg>
      <div
        aria-hidden="true"
        className="absolute rounded-full border border-[rgba(107,90,75,0.12)] bg-[rgba(252,247,240,0.94)] shadow-[inset_0_1px_0_rgba(255,255,255,0.64)]"
        style={{ inset: outerInset }}
      />
      <div
        aria-hidden="true"
        className="absolute rounded-full shadow-[inset_0_0_0_1px_rgba(107,90,75,0.08)]"
        style={{
          inset: innerInset,
          background: isComplete
            ? 'radial-gradient(circle at 34% 34%, rgba(246, 252, 235, 0.98), rgba(194, 209, 155, 0.58) 44%, rgba(255,248,240,0.94) 78%)'
            : `radial-gradient(circle at 34% 34%, rgba(255, 255, 255, 0.96), ${innerTint} 42%, rgba(255,248,240,0.94) 78%)`,
        }}
      />
    </div>
  );
}
