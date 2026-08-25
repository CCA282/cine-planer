import { useCallback } from 'react'
import type { SeenFilm } from '../lib/types'
import { useCloudState } from './useCloudState'

const KEY = 'cine-planner:seen-films'

/** Signed out: `enabled` is false, marking a film seen is a no-op (one-shot planning). */
export function useSeenFilms() {
  const { value: seenFilms, update: setSeenFilms, enabled } = useCloudState<SeenFilm[]>(KEY, [])

  const isSeen = useCallback((filmSlug: string) => seenFilms.some((f) => f.filmSlug === filmSlug), [seenFilms])

  const markSeen = useCallback(
    (filmSlug: string, title: string) => {
      setSeenFilms((prev) => (prev.some((f) => f.filmSlug === filmSlug) ? prev : [...prev, { filmSlug, title, seenAt: new Date().toISOString() }]))
    },
    [setSeenFilms],
  )

  const markManySeen = useCallback(
    (films: { filmSlug: string; title: string }[]) => {
      setSeenFilms((prev) => {
        const existing = new Set(prev.map((f) => f.filmSlug))
        const additions = films.filter((f) => !existing.has(f.filmSlug)).map((f) => ({ ...f, seenAt: new Date().toISOString() }))
        return additions.length ? [...prev, ...additions] : prev
      })
    },
    [setSeenFilms],
  )

  const unmarkSeen = useCallback(
    (filmSlug: string) => {
      setSeenFilms((prev) => prev.filter((f) => f.filmSlug !== filmSlug))
    },
    [setSeenFilms],
  )

  return { seenFilms, isSeen, markSeen, markManySeen, unmarkSeen, enabled }
}
