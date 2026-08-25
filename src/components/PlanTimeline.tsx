import { minutesToLabel } from '../lib/date'
import type { Cinema, Film, Plan } from '../lib/types'
import { Badge } from './Badge'
import { PosterImage } from './PosterImage'

const TRANSPORT_ICON: Record<string, string> = { walk: '🚶', bike: '🚲', transit: '🚌', car: '🚗' }

export function PlanTimeline({ plan, cinemas, films }: { plan: Plan; cinemas: Map<string, Cinema>; films: Map<string, Film> }) {
  return (
    <ol className="space-y-3">
      {plan.items.map((item, i) => {
        const film = films.get(item.session.filmSlug)
        const cinema = cinemas.get(item.session.cinemaSlug)
        return (
          <li key={item.session.id}>
            {item.travelFromPrevious && (
              <div className="mb-3 flex items-center gap-2 pl-2 text-xs text-neutral-500">
                <span>{TRANSPORT_ICON[item.travelFromPrevious.mode ?? '']}</span>
                <span>
                  ~{item.travelFromPrevious.minutes} min vers {cinemas.get(item.session.cinemaSlug)?.name}
                </span>
              </div>
            )}
            <div className="flex gap-3 rounded-xl border border-neutral-800 bg-neutral-900 p-2.5">
              <PosterImage src={film?.posterUrl ?? null} alt={film?.title ?? ''} className="h-20 w-14 shrink-0 rounded-lg" />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="truncate text-sm font-semibold">{film?.title}</p>
                  <span className="shrink-0 text-xs font-medium text-amber-400">{minutesToLabel(item.session.start)}</span>
                </div>
                <p className="text-xs text-neutral-400">{cinema?.name}</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <Badge tone="neutral">{item.session.version.toUpperCase()}</Badge>
                  <span className="text-[11px] text-neutral-500">
                    fin ≈ {minutesToLabel(item.effectiveEnd)} · {film?.duration ?? '?'} min
                  </span>
                </div>
              </div>
              <span className="shrink-0 self-center text-xs font-semibold text-neutral-600">#{i + 1}</span>
            </div>
          </li>
        )
      })}
    </ol>
  )
}

export function PlanSummary({ plan }: { plan: Plan }) {
  return (
    <div className="flex flex-wrap gap-2 text-xs text-neutral-400">
      <Badge tone="success">{plan.filmCount} film{plan.filmCount > 1 ? 's' : ''}</Badge>
      <Badge tone={plan.cinemaSlugs.length > 1 ? 'info' : 'neutral'}>
        {plan.cinemaSlugs.length} cinéma{plan.cinemaSlugs.length > 1 ? 's' : ''}
      </Badge>
      <Badge>{plan.slackMinutes} min de battement</Badge>
    </div>
  )
}
