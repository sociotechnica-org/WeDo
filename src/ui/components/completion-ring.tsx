type CompletionRingProps = {
  ratio: number;
  wash: string;
};

export function CompletionRing({ ratio, wash }: CompletionRingProps) {
  const percentage = Math.round(ratio * 100);
  const style = {
    background: `conic-gradient(${wash} 0deg ${ratio * 360}deg, rgba(125, 111, 95, 0.12) ${ratio * 360}deg 360deg)`,
  };

  return (
    <div
      aria-label={`${percentage}% complete`}
      className="watercolor-ring relative grid size-16 place-items-center rounded-full p-1 shadow-[0_16px_38px_rgba(82,65,48,0.12)]"
      style={style}
    >
      <div className="grid size-full place-items-center rounded-full bg-[rgba(247,241,231,0.92)] text-center text-sm tracking-[0.18em] text-[var(--color-ink-soft)]">
        {percentage}
      </div>
    </div>
  );
}
