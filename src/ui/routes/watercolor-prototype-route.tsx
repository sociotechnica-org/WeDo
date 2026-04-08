import { Link } from 'react-router-dom';
import { WatercolorPrototype } from '@/ui/components/watercolor-prototype';
import { RealtimeStatusBanner } from '@/ui/components/realtime-status-banner';
import { buildDayHref } from '@/ui/lib/day-navigation';
import { useReadyBoardSnapshot } from '@/ui/routes/use-ready-board';

export function WatercolorPrototypeRoute() {
  const { board, householdName, realtime, todayDate } =
    useReadyBoardSnapshot();

  return (
    <main className="prototype-canvas min-h-screen px-4 py-5 sm:px-6 md:px-8 md:py-8 lg:px-10 lg:py-10">
      <div className="mx-auto flex max-w-[112rem] flex-col gap-5">
        <div className="flex items-center justify-between gap-4">
          <Link
            className="stationery-link px-5 py-2.5 text-[1.06rem] text-[var(--color-ink)]"
            to={buildDayHref('/', board.day.date, todayDate)}
          >
            Back to dashboard
          </Link>

          <p className="prototype-route__tagline">
            Standalone art-direction route for issue 17
          </p>
        </div>

        {realtime.status === 'degraded' ? (
          <RealtimeStatusBanner message={realtime.message} />
        ) : null}

        <WatercolorPrototype board={board} householdName={householdName} />
      </div>
    </main>
  );
}
