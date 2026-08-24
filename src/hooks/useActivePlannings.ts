import { useCallback } from 'react'
import type { ActivePlanning, Plan } from '../lib/types'
import { useLocalStorageState } from './useLocalStorageState'

const KEY = 'cine-planer:active-plannings'

export function useActivePlannings() {
  const [active, setActive] = useLocalStorageState<ActivePlanning[]>(KEY, [])

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

  return { active, addActive, removeActive }
}
