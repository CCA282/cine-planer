import cinemasSeed from '../data/cinemas.json'
import filmsSeed from '../data/films.json'
import { cached } from './storage'
import type { Cinema, DayAvailability, Film, FilmVersion } from './types'
import { filmsPlayingAtCinema, versionsForFilmAtCinema } from './showtimeSynth'

/** Base URL of the Cloudflare Worker CORS relay (see worker/). Unset = offline/seed mode. */
const PROXY_BASE = (import.meta.env.VITE_API_PROXY_URL as string | undefined)?.replace(/\/$/, '')

export const isLiveModeConfigured = Boolean(PROXY_BASE)

async function proxyFetch<T>(path: string): Promise<T> {
  if (!PROXY_BASE) throw new Error('no proxy configured')
  const res = await fetch(`${PROXY_BASE}${path}`)
  if (!res.ok) throw new Error(`proxy error ${res.status} on ${path}`)
  return res.json() as Promise<T>
}

/** 78 Pathé cinemas bundled from a snapshot of the (undocumented) /api/cinemas endpoint. */
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

/** Full film catalog: live from Pathé (via proxy, 6h cache) when configured, bundled seed otherwise. */
export async function listFilmCatalog(): Promise<Film[]> {
  if (!PROXY_BASE) return filmsSeed as Film[]
  try {
    return await cached('film-catalog', 6 * 60 * 60_000, async () => {
      const data = await proxyFetch<{ shows: RawShow[] }>('/api/shows')
      return data.shows.filter((s) => s.isMovie && s.duration).map(normalizeShow)
    })
  } catch {
    return filmsSeed as Film[]
  }
}

interface RawCinemaShowsResponse {
  shows: Record<
    string,
    {
      days: Record<string, { bookable: boolean; versions: FilmVersion[] }>
    }
  >
}

/** Which films play at a given cinema on a given date, with real per-day bookability when the
 * proxy is configured (exact showtime clocks are still synthetic, see showtimeSynth.ts). */
export async function listCinemaProgram(
  cinemaSlug: string,
  date: string,
  catalog: Film[],
): Promise<DayAvailability[]> {
  if (PROXY_BASE) {
    try {
      const data = await cached(`cinema-program-raw:${cinemaSlug}`, 2 * 60 * 60_000, () =>
        proxyFetch<RawCinemaShowsResponse>(`/api/cinema/${cinemaSlug}/shows`),
      )
      const out: DayAvailability[] = []
      for (const [filmSlug, show] of Object.entries(data.shows)) {
        const day = show.days[date]
        if (!day) continue
        out.push({ filmSlug, cinemaSlug, date, bookable: day.bookable, versions: day.versions })
      }
      return out
    } catch {
      // fall through to synthesized program
    }
  }

  return filmsPlayingAtCinema(cinemaSlug, catalog, date).map((f) => ({
    filmSlug: f.slug,
    cinemaSlug,
    date,
    bookable: true,
    versions: versionsForFilmAtCinema(cinemaSlug, f.slug),
  }))
}
