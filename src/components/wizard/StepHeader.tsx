export function StepHeader({
  step,
  total,
  title,
  subtitle,
  onAbort,
}: {
  step: number
  total: number
  title: string
  subtitle?: string
  onAbort?: () => void
}) {
  return (
    <div className="mb-3">
      <div className="mb-1.5 flex items-center gap-2">
        <div className="flex flex-1 gap-1">
          {Array.from({ length: total }, (_, i) => (
            <div key={i} className={`h-1 flex-1 rounded-full ${i < step ? 'bg-amber-400' : 'bg-neutral-800'}`} />
          ))}
        </div>
        {onAbort && (
          <button onClick={onAbort} aria-label="Abandonner la planification" className="shrink-0 rounded-full p-1 text-base leading-none text-neutral-500 hover:text-neutral-300">
            ✕
          </button>
        )}
      </div>
      <p className="text-[11px] font-medium text-neutral-500">
        Étape {step}/{total}
      </p>
      <h2 className="text-lg font-bold leading-tight">{title}</h2>
      {subtitle && <p className="mt-0.5 text-xs text-neutral-400">{subtitle}</p>}
    </div>
  )
}
