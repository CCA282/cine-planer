import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

const ChromeContext = createContext<{ compact: boolean; setCompact: (v: boolean) => void } | null>(null)

export function ChromeProvider({ children }: { children: ReactNode }) {
  const [compact, setCompact] = useState(false)
  return <ChromeContext.Provider value={{ compact, setCompact }}>{children}</ChromeContext.Provider>
}

/** Hides the app header and bottom tab bar (see Layout) while `active` is true — for flows like
 * the wizard steps where a single sticky action bar should be the only fixed chrome. */
export function useCompactChrome(active: boolean) {
  const ctx = useContext(ChromeContext)
  if (!ctx) throw new Error('useCompactChrome must be used within ChromeProvider')
  const { setCompact } = ctx
  useEffect(() => {
    if (!active) return
    setCompact(true)
    return () => setCompact(false)
  }, [active, setCompact])
}

export function useChromeCompact() {
  const ctx = useContext(ChromeContext)
  if (!ctx) throw new Error('useChromeCompact must be used within ChromeProvider')
  return ctx.compact
}
