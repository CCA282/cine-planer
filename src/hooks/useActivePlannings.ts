import { useCallback } from 'react'
import type { ActivePlanning, Plan } from '../lib/types'
import { useCloudState } from './useCloudState'

const KEY = 'cine-planner:active-plannings'

/** Signed out: `enabled` is false, tracking an active planning is a no-op (one-shot planning). */
export function useActivePlannings() {
  const { value: active, update: setActive, enabled } = useCloudState<ActivePlanning[]>(KEY, [])

  const addActive = useCallback(
    (plan: Plan) => {
      setActive((prev) => [{ id: plan.id, date: plan.date, createdAt: new Date().toISOString(), plan }, ...prev.filter((a) => a.id !== plan.id)])
    },
    [setActive],
  )

  const removeActive = useCallback(
    (id: string) => {
      setActive((prev) => prev.filter((a) => a.id !== id))
    },
    [setActive],
  )

  return { active, addActive, removeActive, enabled }
}
