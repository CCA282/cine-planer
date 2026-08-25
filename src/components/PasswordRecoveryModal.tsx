import { useState } from 'react'
import { useAuth } from '../lib/authContext'
import { Button } from './Button'

/** Shown whenever a recovery session is active (user followed the "reset password" email link),
 * regardless of which page they land on or whether the account popover is open. */
export function PasswordRecoveryModal() {
  const { recovery, updatePassword, signOut } = useAuth()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (!recovery) return null

  async function submit() {
    setError('')
    setBusy(true)
    try {
      await updatePassword(password)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors de la mise à jour du mot de passe')
    }
    setBusy(false)
  }

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-xs rounded-xl border border-neutral-800 bg-neutral-900 p-4 shadow-lg">
        <p className="mb-1 text-sm font-semibold">Nouveau mot de passe</p>
        <p className="mb-3 text-xs text-neutral-400">Choisis un nouveau mot de passe pour ton compte.</p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Nouveau mot de passe"
          autoFocus
          className="mb-2 w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm placeholder:text-neutral-500 focus:border-amber-500 focus:outline-none"
        />
        {error && <p className="mb-2 text-xs text-red-400">{error}</p>}
        <Button onClick={submit} disabled={busy || password.length < 6} className="mb-2 w-full">
          Mettre à jour le mot de passe
        </Button>
        <button onClick={() => signOut()} className="w-full text-center text-xs text-neutral-400 hover:text-neutral-200">
          Annuler
        </button>
      </div>
    </div>
  )
}
