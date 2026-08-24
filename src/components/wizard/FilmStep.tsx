import { useMemo, useState } from 'react'
import { Badge } from '../Badge'
import { Button } from '../Button'
import { PosterImage } from '../PosterImage'
import type { AvailableFilm } from '../../hooks/useCinemaProgram'
import { ApiErrorBanner } from './ApiErrorBanner'
import { StepActionBar } from './StepActionBar'
import { StepHeader } from './StepHeader'

export function FilmStep({
  loading,
  error,
  available,
  selected,
  onChangeSelected,
  isSeen,
  onBack,
  onNext,
  onAbort,
}: {
  loading: boolean
  error: string | null
  available: AvailableFilm[]
  selected: string[]
  onChangeSelected: (slugs: string[]) => void
  isSeen: (slug: string) => boolean
  onBack: () => void
  onNext: () => void
  onAbort: () => void
}) {
  const [showSeen, setShowSeen] = useState(false)
  const [query, setQuery] = useState('')

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    // A search always searches everything, seen or not — the checkbox only controls what shows
    // up when browsing without a query. Either way, seen films sort to the end.
    const filtered = available.filter((a) => (Boolean(q) || showSeen || !isSeen(a.film.slug)) && (!q || a.film.title.toLowerCase().includes(q)))
    return [...filtered].sort((a, b) => Number(isSeen(a.film.slug)) - Number(isSeen(b.film.slug)))
  }, [available, showSeen, isSeen, query])

  function toggle(slug: string) {
    onChangeSelected(selected.includes(slug) ? selected.filter((s) => s !== slug) : [...selected, slug])
  }

  return (
    <div>
      <div className="sticky top-0 z-10 -mx-4 -mt-4 bg-neutral-950 px-4 pb-2.5 pt-4">
        <StepHeader step={2} total={4} title="Quels films ?" subtitle="Sélectionne les films que tu veux voir ce jour-là." onAbort={onAbort} />

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un film…"
          className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2.5 text-sm placeholder:text-neutral-500 focus:border-amber-500 focus:outline-none"
        />
      </div>

      <label className="mt-3 flex items-center gap-2 text-sm text-neutral-400">
        <input type="checkbox" checked={showSeen} onChange={(e) => setShowSeen(e.target.checked)} className="accent-amber-500" />
        Afficher aussi les films déjà vus
      </label>

      {loading && <p className="py-8 text-center text-sm text-neutral-500">Chargement du programme…</p>}
      {error && <ApiErrorBanner message={error} />}

      {!loading && !error && visible.length === 0 && (
        <p className="py-8 text-center text-sm text-neutral-500">Aucun film disponible dans les cinémas choisis pour cette date.</p>
      )}

      <div className="mb-6 mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {visible.map(({ film, cinemaSlugs }) => {
          const isSelected = selected.includes(film.slug)
          return (
            <button
              key={film.slug}
              onClick={() => toggle(film.slug)}
              className={`overflow-hidden rounded-xl border text-left ${isSelected ? 'border-amber-500' : 'border-neutral-800'}`}
            >
              <div className="relative">
                <PosterImage src={film.posterUrl} alt={film.title} className="aspect-[2/3] w-full" />
                {isSelected && (
                  <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-sm text-neutral-950">
                    ✓
                  </span>
                )}
                {isSeen(film.slug) && (
                  <span className="absolute left-2 top-2 rounded-full bg-neutral-950/80 px-2 py-0.5 text-[10px] font-medium text-neutral-300">
                    Déjà vu
                  </span>
                )}
              </div>
              <div className="bg-neutral-900 p-2">
                <p className="line-clamp-2 text-xs font-semibold">{film.title}</p>
                <p className="mt-0.5 text-[10px] text-neutral-500">{film.duration ? `${film.duration} min` : ''}</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {cinemaSlugs.length > 1 && <Badge tone="info">{cinemaSlugs.length} cinémas</Badge>}
                  {film.genres.slice(0, 1).map((g) => (
                    <Badge key={g}>{g}</Badge>
                  ))}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      <StepActionBar>
        <Button variant="secondary" onClick={onBack} className="flex-1">
          Retour
        </Button>
        <Button onClick={onNext} disabled={selected.length === 0} className="flex-1">
          Continuer ({selected.length})
        </Button>
      </StepActionBar>
    </div>
  )
}
