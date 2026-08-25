import { useCallback } from 'react'
import type { ClosedPlanning, Plan } from '../lib/types'
import { useCloudState } from './useCloudState'

const KEY = 'cine-planner:closed-plannings'

/** Signed out: `enabled` is false, closing a plan is a no-op (one-shot planning). */
export function usePlanHistory() {
  const { value: history, update: setHistory, enabled } = useCloudState<ClosedPlanning[]>(KEY, [])

  const closePlan = useCallback(
    (plan: Plan) => {
      const closed: ClosedPlanning = { id: `${plan.id}:${Date.now()}`, date: plan.date, closedAt: new Date().toISOString(), plan }
      setHistory((prev) => [closed, ...prev])
      return closed
    },
    [setHistory],
  )

  return { history, closePlan, enabled }
}
