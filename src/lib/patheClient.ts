import cinemasSeed from '../data/cinemas.json'
import { cached } from './storage'
import type { Cinema, DayAvailability, Film, FilmVersion, Session } from './types'

/** Base URL of the Cloudflare Worker CORS relay (see worker/). Required — there is no offline
 * fallback: every function below either returns real Pathé data or throws a descriptive error. */
const PROXY_BASE = (import.meta.env.VITE_API_PROXY_URL as string | undefined)?.replace(/\/$/, '')

function requireProxyBase(): string {
  if (!PROXY_BASE) throw new Error('Aucun relais API configuré (VITE_API_PROXY_URL manquant) — voir README.')
  return PROXY_BASE
}

/** Pathé's upstream WAF has been observed rejecting a fraction of requests inconsistently (same
 * request succeeds or 403s depending on which backend node answers), so a single retry recovers
 * most of them without meaningfully slowing down the happy path. */
async function proxyFetch<T>(path: string): Promise<T> {
  const base = requireProxyBase()
  let lastError: unknown
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(`${base}${path}`)
      if (!res.ok) throw new Error(`L'API Pathé a répondu ${res.status} sur ${path}.`)
      return (await res.json()) as T
    } catch (err) {
      lastError = err
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Erreur réseau vers le relais API.')
}

/** 78 Pathé cinemas bundled from a snapshot of the (undocumented) /api/cinemas endpoint. Static
 * reference data (names/addresses/coordinates rarely change) — not a programme or showtime, so
 * it isn't refreshed live. */
export function listCinemas(): Cinema[] {
  return cinemasSeed as Cinema[]
}

interface RawShow {
  slug: string
  title: string
  posterPath?: { md?: string; lg?: string }
  backgroundPath?: { md?: string }
  genres?: string[]
  directors?: string[]
  hubbleCasting?: string
  duration?: number | null
  releaseAt?: { FR_FR?: string }
  contentRating?: { description?: string }
  isComingSoon?: boolean
  isMovie?: boolean
}

function normalizeShow(s: RawShow): Film {
  return {
    slug: s.slug,
    title: s.title,
    posterUrl: s.posterPath?.md ?? s.posterPath?.lg ?? null,
    backgroundUrl: s.backgroundPath?.md ?? null,
    genres: s.genres ?? [],
    directors: s.directors ?? [],
    cast: s.hubbleCasting ?? '',
    duration: s.duration ?? null,
    releaseDate: s.releaseAt?.FR_FR ?? null,
    contentRating: s.contentRating?.description ?? null,
    isComingSoon: s.isComingSoon ?? false,
  }
}

/** Full film catalog, live from Pathé (via proxy, 6h cache). Throws if the relay isn't
 * configured or unreachable — callers must surface the error, never fabricate a catalog. */
export async function listFilmCatalog(): Promise<Film[]> {
  return cached('film-catalog', 6 * 60 * 60_000, async () => {
    const data = await proxyFetch<{ shows: RawShow[] }>('/api/shows')
    return data.shows.filter((s) => s.isMovie && s.duration).map(normalizeShow)
  })
}

interface RawCinemaShowsResponse {
  shows: Record<
    string,
    {
      days: Record<string, { bookable: boolean; versions: FilmVersion[] }>
    }
  >
}

/** Which films play at a given cinema on a given date, live from Pathé (2h cache). Throws if the
 * relay isn't configured or unreachable. */
export async function listCinemaProgram(cinemaSlug: string, date: string): Promise<DayAvailability[]> {
  const data = await cached(`cinema-program-raw:${cinemaSlug}`, 2 * 60 * 60_000, () =>
    proxyFetch<RawCinemaShowsResponse>(`/api/cinema/${cinemaSlug}/shows`),
  )
  const items: DayAvailability[] = []
  for (const [filmSlug, show] of Object.entries(data.shows)) {
    const day = show.days[date]
    if (!day) continue
    items.push({ filmSlug, cinemaSlug, date, bookable: day.bookable, versions: day.versions })
  }
  return items
}

interface RawShowtime {
  time: string
  endTime: string
  version: string
  status: string
}

const KNOWN_VERSIONS: string[] = ['vf', 'vost', 'vfst', 'vo']

function normalizeVersion(v: string): FilmVersion {
  return (KNOWN_VERSIONS.includes(v) ? v : 'vf') as FilmVersion
}

/** "2026-08-24 18:45:00" → minutes since midnight of `referenceDate`, adding a day (1440) when the
 * datetime rolls past midnight relative to it (e.g. a session's real end time). */
function dateTimeToMinutes(dateTimeStr: string, referenceDate: string): number {
  const [datePart, timePart] = dateTimeStr.split(' ')
  const [h, m] = timePart.split(':').map(Number)
  return datePart === referenceDate ? h * 60 + m : h * 60 + m + 24 * 60
}

/** Real showtimes (exact start/end clock) for one film at one cinema on one date, live from
 * Pathé's per-show endpoint (2h cache). Throws if the relay isn't configured or unreachable. An
 * empty array means the fetch succeeded and Pathé genuinely has no sessions for that
 * combination. */
export async function getRealShowtimes(filmSlug: string, cinemaSlug: string, date: string): Promise<Session[]> {
  const raw = await cached(`showtimes:${cinemaSlug}:${filmSlug}:${date}`, 2 * 60 * 60_000, () =>
    proxyFetch<RawShowtime[]>(`/api/show/${filmSlug}/showtimes/${cinemaSlug}/${date}?language=fr`),
  )
  return raw
    .filter((s) => s.status !== 'soldout')
    .map((s, i) => ({
      id: `${cinemaSlug}:${filmSlug}:${date}:${i}`,
      cinemaSlug,
      filmSlug,
      date,
      start: dateTimeToMinutes(s.time, date),
      end: dateTimeToMinutes(s.endTime, date),
      version: normalizeVersion(s.version),
    }))
}
