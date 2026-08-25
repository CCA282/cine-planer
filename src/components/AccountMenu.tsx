import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../lib/authContext'
import { Button } from './Button'

export function AccountMenu() {
  const { user, signIn, signUp, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onPointerDown(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  if (user) {
    return (
      <div className="flex items-center gap-2 text-xs text-neutral-400">
        <span className="max-w-[9rem] truncate">{user.email}</span>
        <button onClick={() => signOut()} className="font-semibold text-neutral-300 hover:text-amber-400">
          Déconnexion
        </button>
      </div>
    )
  }

  return (
    <div className="relative" ref={rootRef}>
      <button onClick={() => setOpen((v) => !v)} className="text-xs font-semibold text-amber-400 hover:text-amber-300">
        Se connecter
      </button>
      {open && <AuthPopover onDone={() => setOpen(false)} signIn={signIn} signUp={signUp} />}
    </div>
  )
}

function AuthPopover({
  onDone,
  signIn,
  signUp,
}: {
  onDone: () => void
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
}) {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit() {
    setError('')
    setBusy(true)
    try {
      if (mode === 'signup') await signUp(email, password)
      else await signIn(email, password)
      onDone()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur de connexion')
    }
    setBusy(false)
  }

  return (
    <div className="absolute right-0 top-full z-10 mt-2 w-64 rounded-xl border border-neutral-800 bg-neutral-900 p-3 shadow-lg">
      <p className="mb-2 text-sm font-semibold">{mode === 'signup' ? 'Créer un compte' : 'Se connecter'}</p>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="email@exemple.com"
        className="mb-2 w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm placeholder:text-neutral-500 focus:border-amber-500 focus:outline-none"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Mot de passe"
        className="mb-2 w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm placeholder:text-neutral-500 focus:border-amber-500 focus:outline-none"
      />
      {error && <p className="mb-2 text-xs text-red-400">{error}</p>}
      <Button onClick={submit} disabled={busy || !email || password.length < 6} className="mb-2 w-full">
        {mode === 'signup' ? 'Créer le compte' : 'Connexion'}
      </Button>
      <button
        onClick={() => setMode(mode === 'signup' ? 'login' : 'signup')}
        className="w-full text-center text-xs text-neutral-400 hover:text-neutral-200"
      >
        {mode === 'signup' ? 'Déjà un compte ? Se connecter' : "Pas encore de compte ? En créer un"}
      </button>
    </div>
  )
}
