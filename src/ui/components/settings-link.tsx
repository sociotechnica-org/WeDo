import { Link } from 'react-router-dom';

type SettingsLinkProps = {
  to: string;
};

function GearIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <circle cx="12" cy="12" r="3.2" />
      <path d="M19.2 13.6a7.6 7.6 0 0 0 .05-3.1l2.05-1.55-2-3.42-2.45.98a7.5 7.5 0 0 0-2.65-1.54L13.85 2h-3.7L9.8 4.97A7.5 7.5 0 0 0 7.15 6.5L4.7 5.53l-2 3.42 2.05 1.55a7.6 7.6 0 0 0 .05 3.1L2.8 15.15l2 3.42 2.35-.95a7.7 7.7 0 0 0 2.72 1.58l.28 2.8h3.7l.28-2.8a7.7 7.7 0 0 0 2.72-1.58l2.35.95 2-3.42-2-1.55Z" />
    </svg>
  );
}

export function SettingsLink({ to }: SettingsLinkProps) {
  return (
    <Link
      aria-label="Settings"
      className="stationery-link h-12 w-12 rounded-[1.25rem] p-0 text-[var(--color-ink)]"
      title="Settings"
      to={to}
    >
      <GearIcon />
    </Link>
  );
}
