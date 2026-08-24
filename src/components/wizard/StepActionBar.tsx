import type { ReactNode } from 'react'

export function StepActionBar({ children }: { children: ReactNode }) {
  return (
    <div className="sticky bottom-0 z-10 -mx-4 flex gap-2 border-t border-neutral-800 bg-neutral-950/95 px-4 py-3 backdrop-blur">
      {children}
    </div>
  )
}
