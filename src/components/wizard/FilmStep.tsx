import { useMemo, useState } from 'react'
import { Badge } from '../Badge'
import { Button } from '../Button'
import { PosterImage } from '../PosterImage'
import { isLiveModeConfigured } from '../../lib/patheClient'
import type { AvailableFilm } from '../../hooks/useCinemaProgram'
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
}: {
  loading: boolean
  error: string | null
  available: AvailableFilm[]
  selected: string[]
  onChangeSelected: (slugs: string[]) => void
  isSeen: (slug: string) => boolean
  onBack: () => void
  onNext: () => void
}) {
  const [showSeen, setShowSeen] = useState(false)

  const visible = useMemo(() => available.filter((a) => showSeen || !isSeen(a.film.slug)), [available, showSeen, isSeen])

  function toggle(slug: string) {
    onChangeSelected(selected.includes(slug) ? selected.filter((s) => s !== slug) : [...selected, slug])
  }

  return (
    <div>
      <StepHeader step={2} total={4} title="Quels films ?" subtitle="Sélectionne les films que tu veux voir ce jour-là." />

      {!isLiveModeConfigured && (
        <p className="mb-3 rounded-lg bg-sky-500/10 px-3 py-2 text-xs text-sky-300">
          Mode démo : catalogue Pathé réel, mais programme et horaires par cinéma simulés (aucun relais API configuré — voir README).
        </p>
      )}

      <label className="mb-3 flex items-center gap-2 text-sm text-neutral-400">
        <input type="checkbox" checked={showSeen} onChange={(e) => setShowSeen(e.target.checked)} className="accent-amber-500" />
        Afficher aussi les films déjà vus
      </label>

      {loading && <p className="py-8 text-center text-sm text-neutral-500">Chargement du programme…</p>}
      {error && <p className="py-4 text-sm text-red-400">{error}</p>}

      {!loading && !error && visible.length === 0 && (
        <p className="py-8 text-center text-sm text-neutral-500">Aucun film disponible dans les cinémas choisis pour cette date.</p>
      )}

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
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

      <div className="flex gap-2">
        <Button variant="secondary" onClick={onBack} className="flex-1">
          Retour
        </Button>
        <Button onClick={onNext} disabled={selected.length === 0} className="flex-1">
          Continuer ({selected.length})
        </Button>
      </div>
    </div>
  )
}
