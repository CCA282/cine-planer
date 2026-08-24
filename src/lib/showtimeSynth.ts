import { pickN, seededRandom } from './rng'
import type { Film, FilmVersion, Session } from './types'

/**
 * Pathé does not expose a public, CORS-enabled endpoint returning exact session clock times
 * (only day-level "is this film bookable that day" data was found — see README "Sources de
 * données"). To keep the planner usable, exact showtimes are synthesized deterministically from
 * real film metadata (duration, catalog) so results stay realistic and stable across reloads,
 * but they are NOT the real Pathé schedule. Swap `getSessionsForFilm` for a real API call if/when
 * Pathé exposes one, everything downstream (scheduler, UI) is unaffected.
 */

const DAY_OPEN_MIN = 10 * 60 // 10:00
const DAY_LAST_START_MIN = 22 * 60 + 30 // 22:30
const SLOT_GRID = [0, 5, 10, 15, 20, 30, 35, 40, 45, 50, 55]
const CLEANING_GAP_MIN = 25

export const TRAILER_BUFFER_MIN = 15

const VERSION_POOL: FilmVersion[] = ['vf', 'vost']

export function filmsPlayingAtCinema(cinemaSlug: string, catalog: Film[], date: string): Film[] {
  const eligible = catalog.filter((f) => !f.isComingSoon && (!f.releaseDate || f.releaseDate <= date))
  const rand = seededRandom(`program:${cinemaSlug}`)
  const count = Math.min(eligible.length, 24 + Math.floor(rand() * 12))
  return pickN(eligible, count, rand)
}

export function versionsForFilmAtCinema(cinemaSlug: string, filmSlug: string): FilmVersion[] {
  const rand = seededRandom(`versions:${cinemaSlug}:${filmSlug}`)
  return rand() < 0.35 ? VERSION_POOL : ['vf']
}

export function getSessionsForFilm(
  cinemaSlug: string,
  film: Film,
  date: string,
): Session[] {
  const duration = film.duration ?? 110
  const rand = seededRandom(`sessions:${cinemaSlug}:${film.slug}:${date}`)
  const sessionCount = 2 + Math.floor(rand() * 4) // 2..5 per day
  const versions = versionsForFilmAtCinema(cinemaSlug, film.slug)

  const starts = new Set<number>()
  let cursor = DAY_OPEN_MIN + Math.floor(rand() * 60)
  for (let i = 0; i < sessionCount && cursor <= DAY_LAST_START_MIN; i++) {
    const slot = SLOT_GRID[Math.floor(rand() * SLOT_GRID.length)]
    const hour = Math.floor(cursor / 60)
    const rounded = hour * 60 + slot
    const start = rounded >= cursor ? rounded : rounded + 60
    if (start <= DAY_LAST_START_MIN) starts.add(start)
    cursor = start + duration + TRAILER_BUFFER_MIN + CLEANING_GAP_MIN
  }

  return [...starts]
    .sort((a, b) => a - b)
    .map((start, i) => ({
      id: `${cinemaSlug}:${film.slug}:${date}:${start}`,
      cinemaSlug,
      filmSlug: film.slug,
      date,
      start,
      version: versions[i % versions.length],
      synthetic: true as const,
    }))
}

export function minutesToLabel(min: number): string {
  const h = Math.floor(min / 60) % 24
  const m = min % 60
  return `${String(h).padStart(2, '0')}h${String(m).padStart(2, '0')}`
}
