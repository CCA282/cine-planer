import { useMemo, useState } from 'react'
import { Button } from '../Button'
import { addDays, formatDateLabel, minutesToTimeInputValue, timeInputValueToMinutes, todayISO } from '../../lib/date'
import { getCurrentPosition, sortByDistance } from '../../lib/geo'
import { listCinemas } from '../../lib/patheClient'
import type { Cinema, CinemaWithDistance } from '../../lib/types'
import { StepActionBar } from './StepActionBar'
import { StepHeader } from './StepHeader'

const ALL_CINEMAS = listCinemas()
const DATE_OPTIONS = Array.from({ length: 7 }, (_, i) => addDays(todayISO(), i))

type GeoStatus = 'idle' | 'loading' | 'granted' | 'denied'

export function CinemaStep({
  date,
  onDateChange,
  startTimeMin,
  onStartTimeChange,
  selected,
  onChangeSelected,
  onNext,
  onAbort,
}: {
  date: string
  onDateChange: (date: string) => void
  startTimeMin: number
  onStartTimeChange: (minutes: number) => void
  selected: string[]
  onChangeSelected: (slugs: string[]) => void
  onNext: () => void
  onAbort: () => void
}) {
  const [geoStatus, setGeoStatus] = useState<GeoStatus>('idle')
  const [geoError, setGeoError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [sorted, setSorted] = useState<CinemaWithDistance[] | null>(null)

  async function requestLocation() {
    setGeoStatus('loading')
    setGeoError(null)
    try {
      const pos = await getCurrentPosition()
      setSorted(sortByDistance(ALL_CINEMAS, pos.lat, pos.lng))
      setGeoStatus('granted')
    } catch (err) {
      setGeoStatus('denied')
      setGeoError(err instanceof Error ? err.message : 'Position indisponible.')
    }
  }

  const displayList = useMemo(() => {
    const base = sorted ?? ALL_CINEMAS.map((c) => ({ ...c, distanceKm: NaN }))
    const filtered = query.trim()
      ? base.filter((c) => `${c.name} ${c.city}`.toLowerCase().includes(query.trim().toLowerCase()))
      : base
    return filtered.slice(0, sorted ? 12 : filtered.length)
  }, [sorted, query])

  function toggle(slug: string) {
    onChangeSelected(selected.includes(slug) ? selected.filter((s) => s !== slug) : [...selected, slug])
  }

  const selectedCinemas = selected.map((slug) => ALL_CINEMAS.find((c) => c.slug === slug)).filter((c): c is Cinema => Boolean(c))

  return (
    <div>
      <div className="sticky top-0 z-10 -mx-4 bg-neutral-950 px-4 pb-2.5 pt-4">
        <StepHeader step={1} total={4} title="Où et quand ?" subtitle="Choisis la date et un ou plusieurs cinémas Pathé." onAbort={onAbort} />

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher une ville ou un cinéma…"
          className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2.5 text-sm placeholder:text-neutral-500 focus:border-amber-500 focus:outline-none"
        />
      </div>

      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {DATE_OPTIONS.map((d) => (
          <button
            key={d}
            onClick={() => onDateChange(d)}
            className={`shrink-0 rounded-xl px-3 py-2 text-sm font-medium ${
              d === date ? 'bg-amber-500 text-neutral-950' : 'bg-neutral-800 text-neutral-300'
            }`}
          >
            {d === todayISO() ? "Aujourd'hui" : formatDateLabel(d).split(' ').slice(0, 2).join(' ')}
          </button>
        ))}
      </div>

      <label className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2.5">
        <span className="text-sm font-medium text-neutral-300">
          À partir de quelle heure ?{date === todayISO() && <span className="text-neutral-500"> (pré-rempli avec l'heure actuelle)</span>}
        </span>
        <input
          type="time"
          value={minutesToTimeInputValue(startTimeMin)}
          onChange={(e) => onStartTimeChange(timeInputValueToMinutes(e.target.value))}
          className="rounded-lg border border-neutral-700 bg-neutral-950 px-2 py-1 text-sm text-neutral-100 focus:border-amber-500 focus:outline-none"
        />
      </label>

      {selectedCinemas.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {selectedCinemas.map((cinema) => (
            <button
              key={cinema.slug}
              onClick={() => toggle(cinema.slug)}
              className="flex items-center gap-1.5 rounded-full bg-amber-500/15 py-1 pl-3 pr-2 text-xs font-medium text-amber-400"
            >
              {cinema.name}
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-amber-500/20 text-[10px] leading-none">×</span>
            </button>
          ))}
        </div>
      )}

      {geoStatus !== 'granted' && (
        <div className="mt-3 rounded-xl border border-neutral-800 bg-neutral-900 p-3">
          <Button variant="primary" onClick={requestLocation} disabled={geoStatus === 'loading'} className="w-full">
            {geoStatus === 'loading' ? 'Localisation…' : '📍 Utiliser ma position'}
          </Button>
          {geoStatus === 'denied' && <p className="mt-2 text-xs text-red-400">{geoError} Cherche ton cinéma manuellement ci-dessous.</p>}
        </div>
      )}

      <ul className="mb-6 mt-3 space-y-2">
        {displayList.map((cinema) => {
          const isSelected = selected.includes(cinema.slug)
          return (
            <li key={cinema.slug}>
              <button
                onClick={() => toggle(cinema.slug)}
                className={`flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-3 text-left ${
                  isSelected ? 'border-amber-500 bg-amber-500/10' : 'border-neutral-800 bg-neutral-900'
                }`}
              >
                <div>
                  <p className="text-sm font-semibold">{cinema.name}</p>
                  <p className="text-xs text-neutral-400">
                    {cinema.address}, {cinema.city}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  {!Number.isNaN(cinema.distanceKm) && <span className="text-xs text-neutral-400">{cinema.distanceKm.toFixed(1)} km</span>}
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full border text-xs ${
                      isSelected ? 'border-amber-500 bg-amber-500 text-neutral-950' : 'border-neutral-600'
                    }`}
                  >
                    {isSelected ? '✓' : ''}
                  </span>
                </div>
              </button>
            </li>
          )
        })}
      </ul>

      <StepActionBar>
        <Button onClick={onNext} disabled={selected.length === 0} className="w-full">
          Continuer ({selected.length} cinéma{selected.length > 1 ? 's' : ''})
        </Button>
      </StepActionBar>
    </div>
  )
}
