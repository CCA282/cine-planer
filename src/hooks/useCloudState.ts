import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '../lib/authContext'
import { supabase } from '../lib/supabase'

const WRITE_DEBOUNCE_MS = 500

/** Cloud-backed key/value state (table `user_data`, RLS'd to `auth.uid()`).
 * Signed out: `value` stays `initial` and `update` is a no-op — one-shot use, nothing persists.
 * Signed in: loads the row on mount/sign-in, `update` upserts it (debounced). */
export function useCloudState<T>(key: string, initial: T) {
  const { user } = useAuth()
  const [value, setValue] = useState<T>(initial)
  const writeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!user) {
      setValue(initial)
      return
    }
    let cancelled = false
    supabase
      .from('user_data')
      .select('value')
      .eq('key', key)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) setValue((data?.value as T | undefined) ?? initial)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, key])

  const update = useCallback(
    (next: T | ((prev: T) => T)) => {
      if (!user) return
      setValue((prev) => {
        const resolved = typeof next === 'function' ? (next as (prev: T) => T)(prev) : next
        if (writeTimer.current) clearTimeout(writeTimer.current)
        writeTimer.current = setTimeout(() => {
          supabase.from('user_data').upsert({ user_id: user.id, key, value: resolved }).then()
        }, WRITE_DEBOUNCE_MS)
        return resolved
      })
    },
    [user, key],
  )

  return { value, update, enabled: !!user } as const
}
