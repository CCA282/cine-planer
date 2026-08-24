import { useEffect, useMemo, useState } from 'react'
import { PosterImage } from '../components/PosterImage'
import { useSeenFilms } from '../hooks/useSeenFilms'
import { listFilmCatalog } from '../lib/patheClient'
import type { Film } from '../lib/types'

export function AllFilmsPage() {
  const [catalog, setCatalog] = useState<Film[] | null>(null)
  const [query, setQuery] = useState('')
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

  const visible = useMemo(() => {
    if (!catalog) return []
    const q = query.trim().toLowerCase()
    const filtered = q ? catalog.filter((f) => f.title.toLowerCase().includes(q)) : catalog
    return [...filtered].sort((a, b) => a.title.localeCompare(b.title))
  }, [catalog, query])

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
        className="mb-4 w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2.5 text-sm placeholder:text-neutral-500 focus:border-amber-500 focus:outline-none"
      />

      {!catalog && <p className="py-8 text-center text-sm text-neutral-500">Chargement du catalogue…</p>}
      {catalog && visible.length === 0 && <p className="py-8 text-center text-sm text-neutral-500">Aucun film ne correspond à ta recherche.</p>}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {visible.map((film) => {
          const seen = isSeen(film.slug)
          return (
            <button
              key={film.slug}
              onClick={() => toggle(film)}
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
    </div>
  )
}
