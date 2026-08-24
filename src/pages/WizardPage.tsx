import { useEffect, useMemo, useState } from 'react'
import { Button } from '../components/Button'
import { PlanSummary, PlanTimeline } from '../components/PlanTimeline'
import { CinemaStep } from '../components/wizard/CinemaStep'
import { FilmStep } from '../components/wizard/FilmStep'
import { PreferencesStep } from '../components/wizard/PreferencesStep'
import { ResultsStep } from '../components/wizard/ResultsStep'
import { StepActionBar } from '../components/wizard/StepActionBar'
import { useActivePlannings } from '../hooks/useActivePlannings'
import { useCinemaProgram } from '../hooks/useCinemaProgram'
import { usePlanHistory } from '../hooks/usePlanHistory'
import { useSavedPreferences } from '../hooks/useSavedPreferences'
import { useSeenFilms } from '../hooks/useSeenFilms'
import { useCompactChrome } from '../lib/chromeContext'
import { defaultStartTimeForDate, todayISO } from '../lib/date'
import { listCinemas } from '../lib/patheClient'
import type { Plan, UserPreferences } from '../lib/types'

type Step = 1 | 2 | 3 | 4 | 5

const ALL_CINEMAS = listCinemas()

export function WizardPage() {
  const [saved, setSaved] = useSavedPreferences()
  const { isSeen, markManySeen } = useSeenFilms()
  const { closePlan } = usePlanHistory()
  const { addActive, removeActive } = useActivePlannings()

  const [step, setStep] = useState<Step>(1)
  const [date, setDate] = useState(todayISO())
  const [startTimeMin, setStartTimeMin] = useState(() => defaultStartTimeForDate(todayISO()))
  const [cinemaSlugs, setCinemaSlugs] = useState<string[]>(saved.cinemaSlugs)
  const [filmSlugs, setFilmSlugs] = useState<string[]>([])
  const [prefs, setPrefs] = useState<UserPreferences>({ timing: saved.timing, travel: saved.travel, transportMode: saved.transportMode })
  const [confirmedPlan, setConfirmedPlan] = useState<Plan | null>(null)
  const [closed, setClosed] = useState(false)

  useCompactChrome(!confirmedPlan && step !== 1)

  const cinemas = useMemo(
    () => ALL_CINEMAS.filter((c) => cinemaSlugs.includes(c.slug)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cinemaSlugs.join(',')],
  )
  const cinemaMap = useMemo(() => new Map(ALL_CINEMAS.map((c) => [c.slug, c])), [])

  const program = useCinemaProgram(cinemas, date)

  useEffect(() => {
    setSaved({ cinemaSlugs, timing: prefs.timing, travel: prefs.travel, transportMode: prefs.transportMode })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cinemaSlugs.join(','), prefs.timing, prefs.travel, prefs.transportMode])

  function restart() {
    setStep(1)
    setFilmSlugs([])
    setConfirmedPlan(null)
    setClosed(false)
  }

  function handleDateChange(newDate: string) {
    setDate(newDate)
    setStartTimeMin(defaultStartTimeForDate(newDate))
  }

  function handleConfirm(plan: Plan) {
    setConfirmedPlan(plan)
    addActive(plan)
  }

  function handleClose() {
    if (!confirmedPlan) return
    markManySeen(
      confirmedPlan.items.map((i) => ({
        filmSlug: i.session.filmSlug,
        title: program.catalog.find((f) => f.slug === i.session.filmSlug)?.title ?? i.session.filmSlug,
      })),
    )
    closePlan(confirmedPlan)
    removeActive(confirmedPlan.id)
    setClosed(true)
  }

  if (confirmedPlan) {
    return (
      <div>
        <h2 className="mb-1 text-xl font-bold">{closed ? 'Planning clôturé 🎉' : 'Ton planning'}</h2>
        <p className="mb-4 text-sm text-neutral-400">{confirmedPlan.date}</p>
        <div className="mb-4">
          <PlanSummary plan={confirmedPlan} />
        </div>
        <div className="mb-6">
          <PlanTimeline plan={confirmedPlan} cinemas={cinemaMap} films={new Map(program.catalog.map((f) => [f.slug, f]))} />
        </div>
        {!closed ? (
          <StepActionBar>
            <Button variant="secondary" onClick={restart} className="flex-1">
              Nouveau planning
            </Button>
            <Button onClick={handleClose} className="flex-1">
              Clôturer ce planning
            </Button>
          </StepActionBar>
        ) : (
          <div>
            <p className="mb-4 rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
              Les films de ce planning sont marqués comme vus et le planning est enregistré dans l'historique.
            </p>
            <StepActionBar>
              <Button onClick={restart} className="w-full">
                Nouveau planning
              </Button>
            </StepActionBar>
          </div>
        )}
      </div>
    )
  }

  if (step === 1) {
    return (
      <CinemaStep
        date={date}
        onDateChange={handleDateChange}
        startTimeMin={startTimeMin}
        onStartTimeChange={setStartTimeMin}
        selected={cinemaSlugs}
        onChangeSelected={setCinemaSlugs}
        onNext={() => setStep(2)}
      />
    )
  }

  if (step === 2) {
    return (
      <FilmStep
        loading={program.loading}
        error={program.error}
        available={program.available}
        selected={filmSlugs}
        onChangeSelected={setFilmSlugs}
        isSeen={isSeen}
        onBack={() => setStep(1)}
        onNext={() => setStep(3)}
      />
    )
  }

  if (step === 3) {
    return (
      <PreferencesStep
        prefs={prefs}
        onChange={setPrefs}
        multiCinema={cinemas.length > 1}
        onBack={() => setStep(2)}
        onNext={() => setStep(4)}
      />
    )
  }

  return (
    <ResultsStep
      date={date}
      startTimeMin={startTimeMin}
      cinemas={cinemas}
      available={program.available}
      filmSlugs={filmSlugs}
      prefs={prefs}
      onBack={() => setStep(3)}
      onConfirm={handleConfirm}
    />
  )
}
