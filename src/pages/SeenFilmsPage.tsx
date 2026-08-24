import { Button } from '../components/Button'
import { useSeenFilms } from '../hooks/useSeenFilms'

export function SeenFilmsPage() {
  const { seenFilms, unmarkSeen } = useSeenFilms()

  const sorted = [...seenFilms].sort((a, b) => b.seenAt.localeCompare(a.seenAt))

  return (
    <div>
      <h2 className="mb-1 text-xl font-bold">Films vus</h2>
      <p className="mb-4 text-sm text-neutral-400">
        Marqués automatiquement quand tu clôtures un planning. Décoche-en un pour qu'il redevienne proposable.
      </p>

      {sorted.length === 0 && <p className="py-8 text-center text-sm text-neutral-500">Aucun film marqué comme vu pour l'instant.</p>}

      <ul className="space-y-2">
        {sorted.map((f) => (
          <li key={f.filmSlug} className="flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2.5">
            <div>
              <p className="text-sm font-semibold">{f.title}</p>
              <p className="text-xs text-neutral-500">{new Date(f.seenAt).toLocaleDateString('fr-FR')}</p>
            </div>
            <Button variant="ghost" onClick={() => unmarkSeen(f.filmSlug)}>
              Retirer
            </Button>
          </li>
        ))}
      </ul>
    </div>
  )
}
