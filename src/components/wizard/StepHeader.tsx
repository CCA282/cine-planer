export function StepHeader({ step, total, title, subtitle }: { step: number; total: number; title: string; subtitle?: string }) {
  return (
    <div className="mb-4">
      <div className="mb-2 flex gap-1">
        {Array.from({ length: total }, (_, i) => (
          <div key={i} className={`h-1 flex-1 rounded-full ${i < step ? 'bg-amber-400' : 'bg-neutral-800'}`} />
        ))}
      </div>
      <p className="text-xs font-medium text-neutral-500">
        Étape {step}/{total}
      </p>
      <h2 className="text-xl font-bold">{title}</h2>
      {subtitle && <p className="mt-1 text-sm text-neutral-400">{subtitle}</p>}
    </div>
  )
}
