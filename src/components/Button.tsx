import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-amber-500 text-neutral-950 hover:bg-amber-400 disabled:bg-neutral-700 disabled:text-neutral-500',
  secondary: 'bg-neutral-800 text-neutral-100 hover:bg-neutral-700 disabled:text-neutral-500',
  ghost: 'bg-transparent text-neutral-300 hover:bg-neutral-800',
  danger: 'bg-red-500/15 text-red-400 hover:bg-red-500/25',
}

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed ${VARIANTS[variant]} ${className}`}
      {...props}
    />
  )
}
