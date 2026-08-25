const HOURS = Array.from({ length: 24 }, (_, i) => i)
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5)

const selectClass =
  'rounded-lg border border-neutral-700 bg-neutral-950 px-2 py-1 text-sm text-neutral-100 focus:border-amber-500 focus:outline-none'

/** Two plain <select>s instead of <input type="time">: a native time input needs precise clicks
 * on its HH/MM segments and renders inconsistently across browsers — two selects are just a big,
 * reliable tap target each, and let us cap minutes to 5-minute steps directly in the options. */
export function TimePicker({ minutes, onChange }: { minutes: number; onChange: (minutes: number) => void }) {
  const h = Math.floor(minutes / 60) % 24
  const m = minutes % 60

  return (
    <div className="flex items-center gap-1">
      <select
        value={h}
        onChange={(e) => onChange(Number(e.target.value) * 60 + m)}
        aria-label="Heure"
        className={selectClass}
      >
        {HOURS.map((v) => (
          <option key={v} value={v}>
            {String(v).padStart(2, '0')}
          </option>
        ))}
      </select>
      <span className="text-neutral-500">:</span>
      <select
        value={m - (m % 5)}
        onChange={(e) => onChange(h * 60 + Number(e.target.value))}
        aria-label="Minutes"
        className={selectClass}
      >
        {MINUTES.map((v) => (
          <option key={v} value={v}>
            {String(v).padStart(2, '0')}
          </option>
        ))}
      </select>
    </div>
  )
}
