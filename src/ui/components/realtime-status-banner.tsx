type RealtimeStatusBannerProps = {
  message: string;
};

export function RealtimeStatusBanner({
  message,
}: RealtimeStatusBannerProps) {
  return (
    <section
      aria-live="polite"
      className="paper-panel rounded-[1.6rem] border border-[rgba(128,102,80,0.12)] px-5 py-4 shadow-[0_12px_26px_rgba(82,65,48,0.05)]"
      role="status"
    >
      <p className="scribe-label text-[0.62rem] uppercase tracking-[0.34em] text-[var(--color-ink-soft)]">
        Live updates paused
      </p>
      <p className="mt-2 text-[0.98rem] leading-6 text-[var(--color-ink-soft)]">
        {message}
      </p>
    </section>
  );
}
