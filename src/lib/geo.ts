import type { Cinema, CinemaWithDistance } from './types'

const EARTH_RADIUS_KM = 6371

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a))
}

export function sortByDistance(cinemas: Cinema[], lat: number, lng: number): CinemaWithDistance[] {
  return cinemas
    .map((c) => ({ ...c, distanceKm: haversineKm(lat, lng, c.lat, c.lng) }))
    .sort((a, b) => a.distanceKm - b.distanceKm)
}

export interface GeoPosition {
  lat: number
  lng: number
}

export function getCurrentPosition(): Promise<GeoPosition> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error("La géolocalisation n'est pas disponible sur cet appareil."))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 5 * 60_000 },
    )
  })
}
