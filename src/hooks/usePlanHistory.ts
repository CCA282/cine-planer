import { useCallback } from 'react'
import type { ClosedPlanning, Plan } from '../lib/types'
import { useLocalStorageState } from './useLocalStorageState'

const KEY = 'cine-planner:closed-plannings'

export function usePlanHistory() {
  const [history, setHistory] = useLocalStorageState<ClosedPlanning[]>(KEY, [])

  const closePlan = useCallback(
    (plan: Plan) => {
      const closed: ClosedPlanning = { id: `${plan.id}:${Date.now()}`, date: plan.date, closedAt: new Date().toISOString(), plan }
      setHistory((prev) => [closed, ...prev])
      return closed
    },
    [setHistory],
  )

  return { history, closePlan }
}
