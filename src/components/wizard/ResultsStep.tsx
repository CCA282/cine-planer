import { useMemo, useState } from 'react'
import { Button } from '../Button'
import { PlanSummary, PlanTimeline } from '../PlanTimeline'
import type { AvailableFilm } from '../../hooks/useCinemaProgram'
import { useSessions } from '../../hooks/useSessions'
import { generatePlans } from '../../lib/scheduler'
import type { Cinema, Plan, UserPreferences } from '../../lib/types'
import { ApiErrorBanner } from './ApiErrorBanner'
import { StepActionBar } from './StepActionBar'
import { StepHeader } from './StepHeader'

export function ResultsStep({
  date,
  startTimeMin,
  cinemas,
  available,
  filmSlugs,
  prefs,
  onBack,
  onConfirm,
}: {
  date: string
  startTimeMin: number
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

  const { loading: sessionsLoading, sessions, errors } = useSessions(filmSlugs, available, date)

  const plans = useMemo(() => {
    const filtered = sessions.filter((s) => s.start >= startTimeMin)
    return generatePlans(filtered, cinemaMap, filmMap, filmSlugs, prefs, date)
  }, [sessions, filmSlugs, prefs, date, startTimeMin, cinemaMap, filmMap])

  const selectedPlan = plans.find((p) => p.id === selectedPlanId) ?? null

  return (
    <div>
      <StepHeader step={4} total={4} title="Tes plannings possibles" subtitle="Choisis la combinaison qui te convient." />

      {errors.map((e, i) => (
        <ApiErrorBanner
          key={i}
          message={`Horaires indisponibles pour "${e.filmTitle}" à ${cinemaMap.get(e.cinemaSlug)?.name ?? e.cinemaSlug} : ${e.message}`}
        />
      ))}

      {sessionsLoading && <p className="py-8 text-center text-sm text-neutral-500">Recherche des horaires…</p>}

      {!sessionsLoading && plans.length === 0 && (
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

      <StepActionBar>
        <Button variant="secondary" onClick={onBack} className="flex-1">
          Retour
        </Button>
        <Button onClick={() => selectedPlan && onConfirm(selectedPlan)} disabled={!selectedPlan} className="flex-1">
          Valider ce planning
        </Button>
      </StepActionBar>
    </div>
  )
}
