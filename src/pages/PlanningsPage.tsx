import { useMemo, useState } from 'react'
import { Button } from '../components/Button'
import { PlanSummary, PlanTimeline } from '../components/PlanTimeline'
import filmsSeed from '../data/films.json'
import { useActivePlannings } from '../hooks/useActivePlannings'
import { usePlanHistory } from '../hooks/usePlanHistory'
import { useSeenFilms } from '../hooks/useSeenFilms'
import { formatDateLabel } from '../lib/date'
import { listCinemas } from '../lib/patheClient'
import type { Film } from '../lib/types'

const CINEMA_MAP = new Map(listCinemas().map((c) => [c.slug, c]))
const FILM_MAP = new Map((filmsSeed as Film[]).map((f) => [f.slug, f]))

export function PlanningsPage() {
  const { active, removeActive, enabled } = useActivePlannings()
  const { history, closePlan } = usePlanHistory()
  const { markManySeen } = useSeenFilms()
  const [openId, setOpenId] = useState<string | null>(null)

  const sortedActive = useMemo(() => [...active].sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [active])
  const sortedHistory = useMemo(() => [...history].sort((a, b) => b.closedAt.localeCompare(a.closedAt)), [history])

  function handleClose(id: string) {
    const item = active.find((a) => a.id === id)
    if (!item) return
    markManySeen(item.plan.items.map((i) => ({ filmSlug: i.session.filmSlug, title: FILM_MAP.get(i.session.filmSlug)?.title ?? i.session.filmSlug })))
    closePlan(item.plan)
    removeActive(id)
  }

  return (
    <div className="pb-4">
      <h2 className="mb-1 text-xl font-bold">Mes plannings</h2>
      <p className="mb-4 text-sm text-neutral-400">Tes plannings en cours et clôturés.</p>

      {!enabled && (
        <p className="mb-4 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
          Connecte-toi (en haut) pour voir et sauvegarder tes plannings — sans compte, la planification reste en one-shot.
        </p>
      )}

      <h3 className="mb-2 text-sm font-semibold text-neutral-300">En cours</h3>
      {sortedActive.length === 0 && <p className="mb-6 py-4 text-center text-sm text-neutral-500">Aucun planning en cours.</p>}
      <ul className="mb-8 space-y-3">
        {sortedActive.map((item) => {
          const isOpen = openId === item.id
          return (
            <li key={item.id} className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-3">
              <button className="mb-2 flex w-full items-center justify-between" onClick={() => setOpenId(isOpen ? null : item.id)}>
                <div className="text-left">
                  <p className="text-sm font-semibold">{formatDateLabel(item.plan.date)}</p>
                  <p className="text-xs text-neutral-500">Créé le {new Date(item.createdAt).toLocaleDateString('fr-FR')}</p>
                </div>
                <PlanSummary plan={item.plan} />
              </button>
              {isOpen && (
                <div className="mb-3">
                  <PlanTimeline plan={item.plan} cinemas={CINEMA_MAP} films={FILM_MAP} />
                </div>
              )}
              <Button variant="secondary" onClick={() => handleClose(item.id)} className="w-full">
                Clôturer ce planning
              </Button>
            </li>
          )
        })}
      </ul>

      <h3 className="mb-2 text-sm font-semibold text-neutral-300">Terminés</h3>
      {sortedHistory.length === 0 && <p className="py-8 text-center text-sm text-neutral-500">Aucun planning clôturé pour l'instant.</p>}
      <ul className="space-y-3">
        {sortedHistory.map((closedPlanning) => {
          const isOpen = openId === closedPlanning.id
          return (
            <li key={closedPlanning.id} className="rounded-xl border border-neutral-800 bg-neutral-900 p-3">
              <button className="flex w-full items-center justify-between" onClick={() => setOpenId(isOpen ? null : closedPlanning.id)}>
                <div className="text-left">
                  <p className="text-sm font-semibold">{formatDateLabel(closedPlanning.plan.date)}</p>
                  <p className="text-xs text-neutral-500">Clôturé le {new Date(closedPlanning.closedAt).toLocaleDateString('fr-FR')}</p>
                </div>
                <PlanSummary plan={closedPlanning.plan} />
              </button>
              {isOpen && (
                <div className="mt-3">
                  <PlanTimeline plan={closedPlanning.plan} cinemas={CINEMA_MAP} films={FILM_MAP} />
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
