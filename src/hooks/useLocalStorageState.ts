import { useCallback, useState } from 'react'
import { storage } from '../lib/storage'

export function useLocalStorageState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => storage.read(key, initial))

  const update = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved = typeof next === 'function' ? (next as (prev: T) => T)(prev) : next
        storage.write(key, resolved)
        return resolved
      })
    },
    [key],
  )

  return [value, update] as const
}
