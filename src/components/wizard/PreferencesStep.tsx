import { Button } from '../Button'
import type { TimingPreference, TransportMode, TravelPreference, UserPreferences } from '../../lib/types'
import { StepActionBar } from './StepActionBar'
import { StepHeader } from './StepHeader'

const TIMING_OPTIONS: { value: TimingPreference; label: string; hint: string }[] = [
  { value: 'large', label: 'Large', hint: 'Tu arrives en avance, tu profites des bandes-annonces.' },
  { value: 'standard', label: 'Standard', hint: 'Un rythme confortable, sans traîner.' },
  { value: 'tight', label: 'Serré', hint: 'Tu zappes les bandes-annonces pour enchaîner un max de films.' },
]

const TRAVEL_OPTIONS: { value: TravelPreference; label: string; hint: string }[] = [
  { value: 'none', label: 'Pas de trajet', hint: 'Un seul cinéma par planning.' },
  { value: 'minimal', label: 'Le moins possible', hint: 'On limite les changements de cinéma.' },
  { value: 'ok', label: 'Trajet pas gênant', hint: 'On peut changer de cinéma librement.' },
]

const TRANSPORT_OPTIONS: { value: TransportMode; label: string }[] = [
  { value: 'bike', label: '🚲 Vélo' },
  { value: 'transit', label: '🚌 Transports' },
  { value: 'car', label: '🚗 Voiture' },
]

export function PreferencesStep({
  prefs,
  onChange,
  multiCinema,
  onBack,
  onNext,
  onAbort,
  nextDisabled,
  nextLabel = 'Générer les plannings',
}: {
  prefs: UserPreferences
  onChange: (prefs: UserPreferences) => void
  multiCinema: boolean
  onBack: () => void
  onNext: () => void
  onAbort: () => void
  nextDisabled?: boolean
  nextLabel?: string
}) {
  const needsTransportMode = multiCinema && prefs.travel !== 'none'

  return (
    <div>
      <div className="sticky top-0 z-10 -mx-4 bg-neutral-950 px-4 pb-2.5 pt-4">
        <StepHeader step={3} total={4} title="Tes préférences" subtitle="Ça, on s'en souvient pour la prochaine fois." onAbort={onAbort} />
      </div>

      <div className="mb-5">
        <p className="mb-2 text-sm font-semibold">Rythme des séances</p>
        <div className="space-y-2">
          {TIMING_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onChange({ ...prefs, timing: opt.value })}
              className={`w-full rounded-xl border px-3 py-2.5 text-left ${
                prefs.timing === opt.value ? 'border-amber-500 bg-amber-500/10' : 'border-neutral-800 bg-neutral-900'
              }`}
            >
              <p className="text-sm font-semibold">{opt.label}</p>
              <p className="text-xs text-neutral-400">{opt.hint}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="mb-5">
        <p className="mb-2 text-sm font-semibold">Trajets entre cinémas</p>
        <div className="space-y-2">
          {TRAVEL_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onChange({ ...prefs, travel: opt.value, transportMode: opt.value === 'none' ? null : prefs.transportMode })}
              className={`w-full rounded-xl border px-3 py-2.5 text-left ${
                prefs.travel === opt.value ? 'border-amber-500 bg-amber-500/10' : 'border-neutral-800 bg-neutral-900'
              }`}
            >
              <p className="text-sm font-semibold">{opt.label}</p>
              <p className="text-xs text-neutral-400">{opt.hint}</p>
            </button>
          ))}
        </div>
      </div>

      {needsTransportMode && (
        <div className="mb-5">
          <p className="mb-2 text-sm font-semibold">Mode de transport</p>
          <div className="grid grid-cols-3 gap-2">
            {TRANSPORT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => onChange({ ...prefs, transportMode: opt.value })}
                className={`rounded-xl border px-2 py-2.5 text-sm font-medium ${
                  prefs.transportMode === opt.value ? 'border-amber-500 bg-amber-500/10' : 'border-neutral-800 bg-neutral-900'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <StepActionBar>
        <Button variant="secondary" onClick={onBack} className="flex-1">
          Retour
        </Button>
        <Button onClick={onNext} disabled={nextDisabled || (needsTransportMode && !prefs.transportMode)} className="flex-1">
          {nextLabel}
        </Button>
      </StepActionBar>
    </div>
  )
}
