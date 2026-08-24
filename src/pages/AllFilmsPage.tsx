import { useEffect, useMemo, useState } from 'react'
import { PosterImage } from '../components/PosterImage'
import { useSeenFilms } from '../hooks/useSeenFilms'
import { listFilmCatalog } from '../lib/patheClient'
import type { Film } from '../lib/types'

/** Films sorti il y a plus de ce délai sont masqués (sauf ceux à venir). */
const HISTORY_MONTHS = 12

export function AllFilmsPage() {
  const [catalog, setCatalog] = useState<Film[] | null>(null)
  const [query, setQuery] = useState('')
  const [showComingSoon, setShowComingSoon] = useState(false)
  const [seenOnly, setSeenOnly] = useState(false)
  const { isSeen, markSeen, unmarkSeen } = useSeenFilms()

  useEffect(() => {
    let cancelled = false
    listFilmCatalog().then((films) => {
      if (!cancelled) setCatalog(films)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const { comingSoon, released } = useMemo(() => {
    if (!catalog) return { comingSoon: [] as Film[], released: [] as Film[] }

    const cutoff = new Date()
    cutoff.setMonth(cutoff.getMonth() - HISTORY_MONTHS)

    const q = query.trim().toLowerCase()
    let filtered = q ? catalog.filter((f) => f.title.toLowerCase().includes(q)) : catalog
    if (seenOnly) filtered = filtered.filter((f) => isSeen(f.slug))

    const byRecentFirst = (a: Film, b: Film) => (b.releaseDate ?? '').localeCompare(a.releaseDate ?? '')

    const comingSoon = showComingSoon ? filtered.filter((f) => f.isComingSoon).sort(byRecentFirst) : []
    const released = filtered
      .filter((f) => !f.isComingSoon && (!f.releaseDate || new Date(f.releaseDate) >= cutoff))
      .sort(byRecentFirst)

    return { comingSoon, released }
  }, [catalog, query, showComingSoon, seenOnly, isSeen])

  const visible = [...comingSoon, ...released]

  function toggle(film: Film) {
    if (isSeen(film.slug)) unmarkSeen(film.slug)
    else markSeen(film.slug, film.title)
  }

  return (
    <div className="pb-4">
      <h2 className="mb-1 text-xl font-bold">Tous les films</h2>
      <p className="mb-4 text-sm text-neutral-400">Coche les films que tu as déjà vus pour qu'ils soient écartés de tes prochains plannings.</p>

      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Rechercher un film…"
        className="mb-3 w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2.5 text-sm placeholder:text-neutral-500 focus:border-amber-500 focus:outline-none"
      />

      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setShowComingSoon((v) => !v)}
          className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
            showComingSoon ? 'border-amber-500 bg-amber-500/10 text-amber-400' : 'border-neutral-800 text-neutral-400'
          }`}
        >
          À venir
        </button>
        <button
          onClick={() => setSeenOnly((v) => !v)}
          className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
            seenOnly ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' : 'border-neutral-800 text-neutral-400'
          }`}
        >
          Déjà vus
        </button>
      </div>

      {!catalog && <p className="py-8 text-center text-sm text-neutral-500">Chargement du catalogue…</p>}
      {catalog && visible.length === 0 && <p className="py-8 text-center text-sm text-neutral-500">Aucun film ne correspond à ta recherche.</p>}

      {comingSoon.length > 0 && (
        <>
          <h3 className="mb-2 text-sm font-semibold text-amber-400">À venir</h3>
          <FilmGrid films={comingSoon} isSeen={isSeen} onToggle={toggle} />
        </>
      )}

      {released.length > 0 && (
        <>
          {comingSoon.length > 0 && <h3 className="mb-2 mt-5 text-sm font-semibold text-neutral-300">Déjà sortis</h3>}
          <FilmGrid films={released} isSeen={isSeen} onToggle={toggle} />
        </>
      )}
    </div>
  )
}

function FilmGrid({ films, isSeen, onToggle }: { films: Film[]; isSeen: (slug: string) => boolean; onToggle: (film: Film) => void }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {films.map((film) => {
        const seen = isSeen(film.slug)
        return (
          <button
            key={film.slug}
            onClick={() => onToggle(film)}
            className={`overflow-hidden rounded-xl border text-left ${seen ? 'border-emerald-500' : 'border-neutral-800'}`}
          >
            <div className="relative">
              <PosterImage src={film.posterUrl} alt={film.title} className="aspect-[2/3] w-full" />
              <span
                className={`absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full text-sm ${
                  seen ? 'bg-emerald-500 text-neutral-950' : 'bg-neutral-950/80 text-neutral-400'
                }`}
              >
                {seen ? '✓' : ''}
              </span>
            </div>
            <div className="bg-neutral-900 p-2">
              <p className="line-clamp-2 text-xs font-semibold">{film.title}</p>
              <p className="mt-0.5 text-[10px] text-neutral-500">{film.duration ? `${film.duration} min` : ''}</p>
            </div>
          </button>
        )
      })}
    </div>
  )
}
