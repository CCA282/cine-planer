import { useMemo, useState } from 'react'
import { Button } from '../Button'
import { PlanSummary, PlanTimeline } from '../PlanTimeline'
import type { AvailableFilm } from '../../hooks/useCinemaProgram'
import { generatePlans } from '../../lib/scheduler'
import { getSessionsForFilm } from '../../lib/showtimeSynth'
import type { Cinema, Plan, Session, UserPreferences } from '../../lib/types'
import { StepHeader } from './StepHeader'

export function ResultsStep({
  date,
  cinemas,
  available,
  filmSlugs,
  prefs,
  onBack,
  onConfirm,
}: {
  date: string
  cinemas: Cinema[]
  available: AvailableFilm[]
  filmSlugs: string[]
  prefs: UserPreferences
  onBack: () => void
  onConfirm: (plan: Plan) => void
}) {
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)

  const cinemaMap = useMemo(() => new Map(cinemas.map((c) => [c.slug, c])), [cinemas])
  const filmMap = useMemo(() => new Map(available.map((a) => [a.film.slug, a.film])), [available])

  const plans = useMemo(() => {
    const sessions: Session[] = []
    for (const slug of filmSlugs) {
      const entry = available.find((a) => a.film.slug === slug)
      if (!entry) continue
      for (const cinemaSlug of entry.cinemaSlugs) {
        sessions.push(...getSessionsForFilm(cinemaSlug, entry.film, date))
      }
    }
    return generatePlans(sessions, cinemaMap, filmMap, filmSlugs, prefs, date)
  }, [available, filmSlugs, prefs, date, cinemaMap, filmMap])

  const selectedPlan = plans.find((p) => p.id === selectedPlanId) ?? null

  return (
    <div>
      <StepHeader step={4} total={4} title="Tes plannings possibles" subtitle="Choisis la combinaison qui te convient." />

      {plans.length === 0 && (
        <p className="py-8 text-center text-sm text-neutral-500">
          Aucune combinaison ne fonctionne avec ces contraintes. Essaie un rythme plus serré, plus de trajet, ou moins de films.
        </p>
      )}

      <div className="mb-6 space-y-3">
        {plans.map((plan, i) => {
          const isSelected = plan.id === selectedPlanId
          return (
            <div
              key={plan.id}
              onClick={() => setSelectedPlanId(plan.id)}
              className={`cursor-pointer rounded-2xl border p-3 ${isSelected ? 'border-amber-500 bg-amber-500/5' : 'border-neutral-800 bg-neutral-900'}`}
            >
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-bold">Option {i + 1}</p>
                <PlanSummary plan={plan} />
              </div>
              <PlanTimeline plan={plan} cinemas={cinemaMap} films={filmMap} />
            </div>
          )
        })}
      </div>

      <div className="flex gap-2">
        <Button variant="secondary" onClick={onBack} className="flex-1">
          Retour
        </Button>
        <Button onClick={() => selectedPlan && onConfirm(selectedPlan)} disabled={!selectedPlan} className="flex-1">
          Valider ce planning
        </Button>
      </div>
    </div>
  )
}
