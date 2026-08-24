export function StepHeader({ step, total, title, subtitle }: { step: number; total: number; title: string; subtitle?: string }) {
  return (
    <div className="mb-3">
      <div className="mb-1.5 flex gap-1">
        {Array.from({ length: total }, (_, i) => (
          <div key={i} className={`h-1 flex-1 rounded-full ${i < step ? 'bg-amber-400' : 'bg-neutral-800'}`} />
        ))}
      </div>
      <p className="text-[11px] font-medium text-neutral-500">
        Étape {step}/{total}
      </p>
      <h2 className="text-lg font-bold leading-tight">{title}</h2>
      {subtitle && <p className="mt-0.5 text-xs text-neutral-400">{subtitle}</p>}
    </div>
  )
}
