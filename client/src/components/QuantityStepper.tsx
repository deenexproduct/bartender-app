import { Minus, Plus } from 'lucide-react'

type Props = {
  value: number
  min?: number
  max: number
  onChange: (v: number) => void
  disabled?: boolean
  /** Contexto para lectores de pantalla, ej. el nombre del producto */
  label?: string
}

export function QuantityStepper({ value, min = 0, max, onChange, disabled, label }: Props) {
  const dec = () => onChange(Math.max(min, value - 1))
  const inc = () => onChange(Math.min(max, value + 1))
  const isMin = value <= min
  const isMax = value >= max
  const suffix = label ? ` de ${label}` : ''

  return (
    <div
      role="group"
      aria-label={`Cantidad a entregar${suffix}`}
      className="inline-flex select-none items-center gap-1.5 rounded-full bg-white p-1 ring-1 ring-neutral-100 shadow-card"
    >
      <button
        type="button"
        aria-label={`Restar uno${suffix}`}
        onClick={dec}
        disabled={disabled || isMin}
        className="grid h-11 w-11 place-items-center rounded-full bg-primary-100 text-neutral-700 transition-all duration-150 hover:bg-primary-200 active:scale-90 disabled:opacity-30 disabled:hover:bg-primary-100 focus-visible:ring-2 focus-visible:ring-accent-400 sm:h-12 sm:w-12"
      >
        <Minus size={18} strokeWidth={2.5} />
      </button>
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        aria-label={`${value} seleccionado${value === 1 ? '' : 's'}${suffix}`}
        className="min-w-[2.5ch] text-center text-xl font-bold tabular-nums text-neutral-900 sm:text-2xl"
      >
        {value}
      </div>
      <button
        type="button"
        aria-label={`Sumar uno${suffix}`}
        onClick={inc}
        disabled={disabled || isMax}
        className="grid h-11 w-11 place-items-center rounded-full bg-accent-500 text-white shadow-cta transition-all duration-150 hover:bg-accent-600 active:scale-90 disabled:opacity-30 disabled:hover:bg-accent-500 focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2 sm:h-12 sm:w-12"
      >
        <Plus size={18} strokeWidth={2.5} />
      </button>
    </div>
  )
}
