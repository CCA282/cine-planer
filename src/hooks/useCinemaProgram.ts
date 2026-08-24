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
 * disagreeing on what's actually playable). A cinema whose programme fails to load is skipped
 * and reported in `error` — the others still populate `available` normally. */
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
        const cinemaErrors: string[] = []
        for (const cinema of cinemas) {
          try {
            const program = await listCinemaProgram(cinema.slug, date)
            for (const entry of program) {
              if (!entry.bookable) continue
              const film = catalog.find((f) => f.slug === entry.filmSlug)
              if (!film) continue
              const existing = byFilm.get(film.slug)
              if (existing) existing.cinemaSlugs.push(cinema.slug)
              else byFilm.set(film.slug, { film, cinemaSlugs: [cinema.slug] })
            }
          } catch (err) {
            cinemaErrors.push(`${cinema.name} : ${err instanceof Error ? err.message : 'erreur inconnue'}`)
          }
        }
        if (!cancelled) {
          setState({
            loading: false,
            error: cinemaErrors.length > 0 ? `Programme indisponible pour ${cinemaErrors.join(' · ')}` : null,
            catalog,
            available: [...byFilm.values()].sort((a, b) => a.film.title.localeCompare(b.film.title)),
          })
        }
      } catch (err) {
        if (!cancelled) {
          setState({
            loading: false,
            error: err instanceof Error ? err.message : "Impossible de contacter l'API Pathé.",
            catalog: [],
            available: [],
          })
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [cinemas, date])

  return state
}
