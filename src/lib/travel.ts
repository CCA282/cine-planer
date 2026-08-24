import { haversineKm } from './geo'
import type { Cinema, TransportMode } from './types'

/**
 * No routing API is used (front-end only, no key/quota to manage): travel time is estimated from
 * straight-line distance with a road-detour factor and mode-specific effective speed. This is an
 * approximation, clearly presented as such in the UI — good enough to decide "is switching cinemas
 * realistic between these two sessions", not turn-by-turn accurate.
 */
const DETOUR_FACTOR = 1.3

const MODE_CONFIG: Record<TransportMode, { speedKmh: number; overheadMin: number }> = {
  bike: { speedKmh: 15, overheadMin: 3 },
  transit: { speedKmh: 18, overheadMin: 8 },
  car: { speedKmh: 22, overheadMin: 6 },
}

export function estimateTravelMinutes(from: Cinema, to: Cinema, mode: TransportMode): number {
  if (from.slug === to.slug) return 0
  const distanceKm = haversineKm(from.lat, from.lng, to.lat, to.lng) * DETOUR_FACTOR
  const { speedKmh, overheadMin } = MODE_CONFIG[mode]
  return Math.round((distanceKm / speedKmh) * 60 + overheadMin)
}

export const TRANSPORT_LABELS: Record<TransportMode, string> = {
  bike: 'Vélo',
  transit: 'Transports en commun',
  car: 'Voiture',
}
