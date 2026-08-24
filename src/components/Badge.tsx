import type { ReactNode } from 'react'

const TONES = {
  neutral: 'bg-neutral-800 text-neutral-300',
  accent: 'bg-amber-500/15 text-amber-400',
  success: 'bg-emerald-500/15 text-emerald-400',
  info: 'bg-sky-500/15 text-sky-400',
} as const

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: keyof typeof TONES }) {
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${TONES[tone]}`}>{children}</span>
}
