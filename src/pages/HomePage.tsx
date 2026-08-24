import { useNavigate } from 'react-router-dom'
import { Button } from '../components/Button'

export function HomePage() {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-6 pb-12 text-center">
      <div>
        <h2 className="mb-1 text-xl font-bold">
          <span className="text-amber-400">Ciné</span>Planner
        </h2>
        <p className="text-sm text-neutral-400">
          Choisis tes cinémas et tes films, on s'occupe de trouver les meilleurs horaires pour ta journée.
        </p>
      </div>
      <Button onClick={() => navigate('/wizard')} className="w-full max-w-xs">
        🎬 Planifier une sortie
      </Button>
    </div>
  )
}
