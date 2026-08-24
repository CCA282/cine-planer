import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'

const TABS = [
  { to: '/', label: 'Planifier', icon: '🎬' },
  { to: '/films', label: 'Films', icon: '🎞️' },
  { to: '/plannings', label: 'Plannings', icon: '🗓️' },
]

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex h-dvh max-w-2xl flex-col overflow-hidden">
      <header className="sticky top-0 z-10 border-b border-neutral-800 bg-neutral-950/90 px-4 py-3 backdrop-blur">
        <h1 className="text-lg font-bold tracking-tight">
          <span className="text-amber-400">Ciné</span>Planner
        </h1>
      </header>

      <main className="flex-1 overflow-y-auto px-4 pt-4">{children}</main>

      <nav className="h-16 shrink-0 border-t border-neutral-800 bg-neutral-950/95 backdrop-blur">
        <div className="grid h-full grid-cols-3">
          {TABS.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-0.5 text-xs font-medium ${isActive ? 'text-amber-400' : 'text-neutral-500'}`
              }
            >
              <span className="text-lg leading-none">{tab.icon}</span>
              {tab.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
