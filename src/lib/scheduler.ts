import { TRAILER_BUFFER_MIN } from './showtimeSynth'
import { estimateTravelMinutes } from './travel'
import type { Cinema, Film, Plan, PlanItem, Session, TimingPreference, TravelPreference, TransportMode, UserPreferences } from './types'

/**
 * Buffers derived from the user's timing preference. `arrivalOffset` is how many minutes after
 * the announced session start the viewer actually needs to be seated (0 = arrive for trailers,
 * TRAILER_BUFFER_MIN = skip them). `minGap*` is the minimum breathing room required after a film
 * truly ends before the next session's arrival time.
 */
const TIMING_CONFIG: Record<TimingPreference, { arrivalOffset: number; minGapSameCinema: number; minGapCrossCinema: number }> = {
  large: { arrivalOffset: 0, minGapSameCinema: 20, minGapCrossCinema: 15 },
  standard: { arrivalOffset: 0, minGapSameCinema: 10, minGapCrossCinema: 10 },
  tight: { arrivalOffset: TRAILER_BUFFER_MIN, minGapSameCinema: 0, minGapCrossCinema: 5 },
}

const MAX_EXACT_FILMS = 14

interface Effective {
  session: Session
  effectiveStart: number
  effectiveEnd: number
}

function computeEffective(session: Session, film: Film, timing: TimingPreference): Effective {
  const cfg = TIMING_CONFIG[timing]
  const duration = film.duration ?? 110
  return {
    session,
    effectiveStart: session.start + cfg.arrivalOffset,
    effectiveEnd: session.start + TRAILER_BUFFER_MIN + duration,
  }
}

interface DpState {
  lastCinemaSlug: string | null
  effectiveEnd: number
  slackMinutes: number
  chain: PlanItem[]
}

function betterState(a: DpState, b: DpState): DpState {
  if (a.effectiveEnd !== b.effectiveEnd) return a.effectiveEnd < b.effectiveEnd ? a : b
  return a.slackMinutes <= b.slackMinutes ? a : b
}

/**
 * Generates candidate day-plans maximizing distinct films seen, respecting timing buffers and
 * (when travel is allowed) inter-cinema travel time. Exact search via bitmask DP over selected
 * films (small by construction: a person picks a handful of films for one day).
 */
export function generatePlans(
  sessions: Session[],
  cinemas: Map<string, Cinema>,
  films: Map<string, Film>,
  filmSlugs: string[],
  prefs: UserPreferences,
  date: string,
  maxPlans = 5,
): Plan[] {
  const cfg = TIMING_CONFIG[prefs.timing]
  const targetFilms = filmSlugs.slice(0, MAX_EXACT_FILMS)
  const sessionsByFilm = targetFilms.map((slug) => {
    const film = films.get(slug)
    if (!film) return []
    return sessions
      .filter((s) => s.filmSlug === slug)
      .map((s) => computeEffective(s, film, prefs.timing))
      .sort((a, b) => a.effectiveStart - b.effectiveStart)
  })

  const k = targetFilms.length
  const totalMasks = 1 << k
  // dp[mask] : lastCinemaSlug ('' = none yet) -> best state
  const dp: Array<Map<string, DpState>> = Array.from({ length: totalMasks }, () => new Map())
  dp[0].set('', { lastCinemaSlug: null, effectiveEnd: -Infinity, slackMinutes: 0, chain: [] })

  const requiredGap = (fromCinema: string, toCinema: string, mode: TransportMode | null, travel: TravelPreference): number | null => {
    if (fromCinema === toCinema) return cfg.minGapSameCinema
    if (travel === 'none') return null
    const from = cinemas.get(fromCinema)
    const to = cinemas.get(toCinema)
    if (!from || !to || !mode) return null
    return estimateTravelMinutes(from, to, mode) + cfg.minGapCrossCinema
  }

  for (let mask = 0; mask < totalMasks; mask++) {
    const states = dp[mask]
    if (states.size === 0) continue
    for (const state of states.values()) {
      for (let filmIdx = 0; filmIdx < k; filmIdx++) {
        if (mask & (1 << filmIdx)) continue
        const candidates = sessionsByFilm[filmIdx]
        for (const eff of candidates) {
          const fromCinema = state.lastCinemaSlug
          let travelMinutes = 0
          let gapOk: boolean
          if (fromCinema === null) {
            gapOk = true
          } else {
            const gapAvailable = eff.effectiveStart - state.effectiveEnd
            const required = requiredGap(fromCinema, eff.session.cinemaSlug, prefs.transportMode, prefs.travel)
            if (required === null) continue
            gapOk = gapAvailable >= required
            if (gapOk && fromCinema !== eff.session.cinemaSlug) {
              const from = cinemas.get(fromCinema)!
              const to = cinemas.get(eff.session.cinemaSlug)!
              travelMinutes = estimateTravelMinutes(from, to, prefs.transportMode!)
            }
          }
          if (!gapOk) continue

          const idleMinutes = fromCinema === null ? 0 : eff.effectiveStart - state.effectiveEnd - travelMinutes
          const item: PlanItem = {
            session: eff.session,
            effectiveStart: eff.effectiveStart,
            effectiveEnd: eff.effectiveEnd,
            travelFromPrevious:
              fromCinema && fromCinema !== eff.session.cinemaSlug
                ? { fromCinemaSlug: fromCinema, minutes: travelMinutes, mode: prefs.transportMode }
                : null,
          }
          const newMask = mask | (1 << filmIdx)
          const newState: DpState = {
            lastCinemaSlug: eff.session.cinemaSlug,
            effectiveEnd: eff.effectiveEnd,
            slackMinutes: state.slackMinutes + Math.max(0, idleMinutes),
            chain: [...state.chain, item],
          }
          const existing = dp[newMask].get(eff.session.cinemaSlug)
          dp[newMask].set(eff.session.cinemaSlug, existing ? betterState(existing, newState) : newState)
        }
      }
    }
  }

  let bestPopcount = 0
  for (let mask = 1; mask < totalMasks; mask++) {
    if (dp[mask].size === 0) continue
    const pc = popcount(mask)
    if (pc > bestPopcount) bestPopcount = pc
  }

  const results: Plan[] = []
  for (let mask = 1; mask < totalMasks; mask++) {
    if (dp[mask].size === 0) continue
    if (popcount(mask) < Math.max(1, bestPopcount - 1)) continue
    for (const state of dp[mask].values()) {
      results.push(chainToPlan(state.chain, date, state.slackMinutes))
    }
  }

  results.sort((a, b) => {
    if (a.filmCount !== b.filmCount) return b.filmCount - a.filmCount
    if (prefs.travel === 'minimal' && a.cinemaSlugs.length !== b.cinemaSlugs.length) {
      return a.cinemaSlugs.length - b.cinemaSlugs.length
    }
    return a.slackMinutes - b.slackMinutes
  })

  return dedupePlans(results).slice(0, maxPlans)
}

function popcount(mask: number): number {
  let count = 0
  let m = mask
  while (m) {
    count += m & 1
    m >>= 1
  }
  return count
}

function chainToPlan(chain: PlanItem[], date: string, slackMinutes: number): Plan {
  const cinemaSlugs = [...new Set(chain.map((i) => i.session.cinemaSlug))]
  const sortedChain = [...chain].sort((a, b) => a.session.start - b.session.start)
  return {
    id: sortedChain.map((i) => i.session.id).join('|'),
    date,
    items: sortedChain,
    cinemaSlugs,
    filmCount: chain.length,
    slackMinutes,
  }
}

function dedupePlans(plans: Plan[]): Plan[] {
  const seen = new Set<string>()
  const out: Plan[] = []
  for (const plan of plans) {
    if (seen.has(plan.id)) continue
    seen.add(plan.id)
    out.push(plan)
  }
  return out
}
