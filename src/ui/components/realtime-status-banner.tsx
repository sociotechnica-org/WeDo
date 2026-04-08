type RealtimeStatusBannerProps = {
  message: string;
};

export function RealtimeStatusBanner({
  message,
}: RealtimeStatusBannerProps) {
  return (
    <section
      aria-live="polite"
      className="paper-panel rounded-[1.8rem] border border-[rgba(128,102,80,0.12)] px-5 py-4"
      role="status"
    >
      <p className="scribe-label text-[0.62rem] uppercase tracking-[0.34em] text-[var(--color-ink-soft)]">
        Live updates paused
      </p>
      <p className="hand-link mt-3 text-[1.15rem] leading-7 text-[var(--color-ink-soft)]">
        {message}
      </p>
    </section>
  );
}
