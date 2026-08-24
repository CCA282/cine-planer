import { useEffect, useState } from 'react'
import { listCinemaProgram, listFilmCatalog } from '../lib/patheClient'
import type { Cinema, Film } from '../lib/types'

export interface AvailableFilm {
  film: Film
  cinemaSlugs: string[]
}

interface State {
  loading: boolean
  error: string | null
  catalog: Film[]
  available: AvailableFilm[]
}

/** Fetches the film catalog plus, for each given cinema, which of those films play on `date`.
 * Single source of truth shared by the film-selection step and the scheduler (avoids the two
 * disagreeing on what's actually playable). */
export function useCinemaProgram(cinemas: Cinema[], date: string): State {
  const [state, setState] = useState<State>({ loading: true, error: null, catalog: [], available: [] })

  useEffect(() => {
    if (cinemas.length === 0) {
      setState({ loading: false, error: null, catalog: [], available: [] })
      return
    }
    let cancelled = false
    setState((s) => ({ ...s, loading: true, error: null }))
    ;(async () => {
      try {
        const catalog = await listFilmCatalog()
        const byFilm = new Map<string, AvailableFilm>()
        for (const cinema of cinemas) {
          const program = await listCinemaProgram(cinema.slug, date, catalog)
          for (const entry of program) {
            if (!entry.bookable) continue
            const film = catalog.find((f) => f.slug === entry.filmSlug)
            if (!film) continue
            const existing = byFilm.get(film.slug)
            if (existing) existing.cinemaSlugs.push(cinema.slug)
            else byFilm.set(film.slug, { film, cinemaSlugs: [cinema.slug] })
          }
        }
        if (!cancelled) {
          setState({
            loading: false,
            error: null,
            catalog,
            available: [...byFilm.values()].sort((a, b) => a.film.title.localeCompare(b.film.title)),
          })
        }
      } catch {
        if (!cancelled) setState({ loading: false, error: 'Impossible de charger le programme. Réessaie plus tard.', catalog: [], available: [] })
      }
    })()
    return () => {
      cancelled = true
    }
  }, [cinemas, date])

  return state
}
