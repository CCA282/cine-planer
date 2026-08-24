import { useEffect, useState } from 'react'
import { getRealShowtimes } from '../lib/patheClient'
import type { Session } from '../lib/types'
import type { AvailableFilm } from './useCinemaProgram'

export interface SessionError {
  filmTitle: string
  cinemaSlug: string
  message: string
}

interface State {
  loading: boolean
  sessions: Session[]
  errors: SessionError[]
}

/** Real showtimes for every selected film across the cinemas it plays at, on `date`. A
 * (film, cinema) pair whose showtimes fail to load is skipped and reported in `errors` — the
 * others still populate `sessions` normally. */
export function useSessions(filmSlugs: string[], available: AvailableFilm[], date: string): State {
  const [state, setState] = useState<State>({ loading: true, sessions: [], errors: [] })

  useEffect(() => {
    if (filmSlugs.length === 0) {
      setState({ loading: false, sessions: [], errors: [] })
      return
    }
    let cancelled = false
    setState((s) => ({ ...s, loading: true }))
    ;(async () => {
      const sessions: Session[] = []
      const errors: SessionError[] = []
      for (const slug of filmSlugs) {
        const entry = available.find((a) => a.film.slug === slug)
        if (!entry) continue
        for (const cinemaSlug of entry.cinemaSlugs) {
          try {
            sessions.push(...(await getRealShowtimes(slug, cinemaSlug, date)))
          } catch (err) {
            errors.push({ filmTitle: entry.film.title, cinemaSlug, message: err instanceof Error ? err.message : 'erreur inconnue' })
          }
        }
      }
      if (!cancelled) setState({ loading: false, sessions, errors })
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filmSlugs.join(','), available, date])

  return state
}
