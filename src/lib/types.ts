export interface Cinema {
  slug: string
  name: string
  city: string
  address: string
  zip: string
  lat: number
  lng: number
}

export interface CinemaWithDistance extends Cinema {
  distanceKm: number
}

export type FilmVersion = 'vf' | 'vost' | 'vfst' | 'vo'

export interface Film {
  slug: string
  title: string
  posterUrl: string | null
  backgroundUrl: string | null
  genres: string[]
  directors: string[]
  cast: string
  duration: number | null
  releaseDate: string | null
  contentRating: string | null
  isComingSoon: boolean
}

/** Availability of one film at one cinema for a given day (real Pathé data). */
export interface DayAvailability {
  filmSlug: string
  cinemaSlug: string
  date: string
  bookable: boolean
  versions: FilmVersion[]
}

export type TimingPreference = 'large' | 'standard' | 'tight'
export type TravelPreference = 'none' | 'minimal' | 'ok'
export type TransportMode = 'bike' | 'transit' | 'car'

export interface UserPreferences {
  timing: TimingPreference
  travel: TravelPreference
  transportMode: TransportMode | null
}

/** A single real showtime instance of a film at a cinema, sourced from Pathé's per-show
 * showtimes endpoint (see getRealShowtimes in patheClient.ts). */
export interface Session {
  id: string
  cinemaSlug: string
  filmSlug: string
  date: string
  /** Start time, minutes since midnight of `date`. */
  start: number
  /** Real end time (credits done), minutes since midnight of `date` — can exceed 1440 when the
   * session ends after midnight. */
  end: number
  version: FilmVersion
}

export interface PlanItem {
  session: Session
  /** Minutes since midnight the viewer must arrive to catch the actual film content. */
  effectiveStart: number
  /** Minutes since midnight the film truly ends (credits). */
  effectiveEnd: number
  travelFromPrevious: {
    fromCinemaSlug: string
    minutes: number
    mode: TransportMode | null
  } | null
}

export interface Plan {
  id: string
  date: string
  items: PlanItem[]
  cinemaSlugs: string[]
  filmCount: number
  /** Lower is better: total idle/travel minutes between sessions. */
  slackMinutes: number
}

export interface SeenFilm {
  filmSlug: string
  title: string
  seenAt: string
}

export interface ClosedPlanning {
  id: string
  date: string
  closedAt: string
  plan: Plan
}

export interface ActivePlanning {
  id: string
  date: string
  createdAt: string
  plan: Plan
}
