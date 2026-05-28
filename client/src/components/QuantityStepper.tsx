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

  // UX-39: ingreso numérico directo (clamp a [min, max]) para cargar cantidades
  // grandes sin tocar "+" decenas de veces.
  const handleInput = (raw: string) => {
    const digits = raw.replace(/[^0-9]/g, '')
    if (digits === '') {
      onChange(min)
      return
    }
    const n = parseInt(digits, 10)
    onChange(Math.min(max, Math.max(min, n)))
  }

  return (
    <div
      role="group"
      aria-label={`Cantidad a entregar${suffix}`}
      className="inline-flex select-none items-center gap-1.5 rounded-full bg-white p-1 ring-1 ring-neutral-100 shadow-card"
    >
      {/* UX-34: anuncio del valor para lectores de pantalla (cubre +/- y edición directa) */}
      <span className="sr-only" role="status" aria-live="polite">
        {`${value} seleccionado${value === 1 ? '' : 's'}${suffix}`}
      </span>

      <button
        type="button"
        aria-label={`Restar uno${suffix}`}
        onClick={dec}
        disabled={disabled || isMin}
        className="grid h-11 w-11 place-items-center rounded-full bg-primary-100 text-neutral-700 transition-all duration-150 hover:bg-primary-200 active:scale-90 disabled:opacity-30 disabled:hover:bg-primary-100 focus-visible:ring-2 focus-visible:ring-accent-400 sm:h-12 sm:w-12"
      >
        <Minus size={18} strokeWidth={2.5} />
      </button>

      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        aria-label={`Cantidad${suffix} (máximo ${max})`}
        value={value}
        disabled={disabled}
        onFocus={(e) => e.currentTarget.select()}
        onChange={(e) => handleInput(e.target.value)}
        className="w-[3ch] rounded-lg bg-transparent text-center text-xl font-bold tabular-nums text-neutral-900 outline-none focus-visible:ring-2 focus-visible:ring-accent-400 disabled:opacity-40 sm:text-2xl"
      />

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
