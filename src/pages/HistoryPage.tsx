import { useMemo, useState } from 'react'
import { PlanSummary, PlanTimeline } from '../components/PlanTimeline'
import { usePlanHistory } from '../hooks/usePlanHistory'
import { listCinemas } from '../lib/patheClient'
import filmsSeed from '../data/films.json'
import type { Film } from '../lib/types'

const CINEMA_MAP = new Map(listCinemas().map((c) => [c.slug, c]))
const FILM_MAP = new Map((filmsSeed as Film[]).map((f) => [f.slug, f]))

export function HistoryPage() {
  const { history } = usePlanHistory()
  const [openId, setOpenId] = useState<string | null>(null)

  const sorted = useMemo(() => [...history].sort((a, b) => b.closedAt.localeCompare(a.closedAt)), [history])

  return (
    <div>
      <h2 className="mb-1 text-xl font-bold">Historique</h2>
      <p className="mb-4 text-sm text-neutral-400">Tes plannings clôturés.</p>

      {sorted.length === 0 && <p className="py-8 text-center text-sm text-neutral-500">Aucun planning clôturé pour l'instant.</p>}

      <ul className="space-y-3">
        {sorted.map((closedPlanning) => {
          const isOpen = openId === closedPlanning.id
          return (
            <li key={closedPlanning.id} className="rounded-xl border border-neutral-800 bg-neutral-900 p-3">
              <button className="flex w-full items-center justify-between" onClick={() => setOpenId(isOpen ? null : closedPlanning.id)}>
                <div className="text-left">
                  <p className="text-sm font-semibold">{closedPlanning.plan.date}</p>
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
