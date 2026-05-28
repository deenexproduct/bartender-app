import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams, useLocation, Link } from 'react-router-dom'
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  MapPin,
  User,
  Zap,
  AlertCircle,
  Hourglass,
  RefreshCw,
} from 'lucide-react'
import { computeOrderStatus, orderExpiryMs, type OrderProduct } from '@/data/mockOrders'
import { ordersStore, useOrder } from '@/lib/ordersStore'
import { useConfig } from '@/lib/config'
import { ProductRow } from '@/components/ProductRow'
import { StatusBadge } from '@/components/StatusBadge'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { RetrievalHistory } from '@/components/RetrievalHistory'
import { useToast } from '@/components/Toast'
import { useAuth } from '@/lib/auth'
import { cn } from '@/lib/cn'

// UX-04: persistir la selección en curso (por token) en sessionStorage para que un
// tap accidental en la nav inferior — o un refresh — no borre lo que se venía cargando.
type Selection = Record<string, number>

function selectionKey(token: string) {
  return `bartender.selection.${token.trim().toUpperCase()}`
}
function readSelection(token: string): Selection {
  try {
    const raw = sessionStorage.getItem(selectionKey(token))
    const parsed = raw ? JSON.parse(raw) : null
    return parsed && typeof parsed === 'object' ? (parsed as Selection) : {}
  } catch {
    return {}
  }
}
function writeSelection(token: string, sel: Selection) {
  try {
    const hasAny = Object.values(sel).some((n) => n > 0)
    if (hasAny) sessionStorage.setItem(selectionKey(token), JSON.stringify(sel))
    else sessionStorage.removeItem(selectionKey(token))
  } catch {
    /* noop */
  }
}
function clearSelection(token: string) {
  try {
    sessionStorage.removeItem(selectionKey(token))
  } catch {
    /* noop */
  }
}

// KONEX: etiqueta legible del tiempo restante hasta el vencimiento del QR.
function formatVence(expiryMs: number, nowMs: number): string {
  const diff = expiryMs - nowMs
  if (diff <= 0) return 'QR vencido'
  const mins = Math.round(diff / 60_000)
  if (mins < 60) return `Vence en ${mins} min`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m ? `Vence en ${h} h ${m} min` : `Vence en ${h} h`
}

export function OrderDetailPage() {
  const { token = '' } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()

  // UX-03: volver al origen real (lista o escaneo). location.key === 'default'
  // significa que se entró directo a esta URL (sin historial in-app) → ir a "/".
  const goBack = () => (location.key === 'default' ? navigate('/') : navigate(-1))
  const { operator } = useAuth()
  const { qrExpiryMinutes } = useConfig()
  const result = useOrder(token)
  const order = result.ok ? result.order : null

  const [selection, setSelection] = useState<Selection>(() => readSelection(token))
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [completedShown, setCompletedShown] = useState(false)
  // UX-42: avisar "Pedido ya completado" SOLO si llegó completo (escaneaste un QR cerrado),
  // no cuando lo completás vos acá (en ese caso ya navegás a la confirmación).
  const wasCompletedOnArrival = useRef(order?.status === 'completed')

  // UX-04: persistir cada cambio de selección para sobrevivir nav accidental / refresh.
  useEffect(() => {
    writeSelection(token, selection)
  }, [token, selection])

  // Resetear la selección solo cuando aparece un retiro NUEVO (el historial crece),
  // no en el montaje — para no pisar la selección restaurada de sessionStorage.
  const prevHistoryLen = useRef(order?.history.length ?? 0)
  useEffect(() => {
    const len = order?.history.length ?? 0
    if (len > prevHistoryLen.current) {
      setSelection({})
      clearSelection(token)
    }
    prevHistoryLen.current = len
  }, [order?.history.length, token])

  useEffect(() => {
    if (wasCompletedOnArrival.current && !completedShown) {
      setCompletedShown(true)
      toast.warning(
        'Pedido ya completado',
        'No queda nada por entregar. Podés revisar el detalle.',
      )
    }
  }, [completedShown, toast])

  if (!result.ok && result.error === 'expired') {
    return (
      <ErrorState
        variant="expired"
        token={token}
        title="QR expirado"
        description="Este código ya cumplió su tiempo o fue invalidado por el sistema. Pedile al cliente que genere uno nuevo desde la app."
      />
    )
  }

  if (!result.ok) {
    return (
      <ErrorState
        variant="not-found"
        token={token}
        title="No encontramos ese pedido"
        description="Revisá el código o probá escaneando de nuevo."
      />
    )
  }

  const isCompleted = order!.status === 'completed'
  const expiryMs = orderExpiryMs(order!, qrExpiryMinutes)
  const venceLabel = !isCompleted && expiryMs !== null ? formatVence(expiryMs, Date.now()) : null
  const totalItems = order!.products.reduce((s, p) => s + p.total, 0)
  const retrievedItems = order!.products.reduce((s, p) => s + p.retrieved, 0)
  const selectedItems = Object.values(selection).reduce((s, n) => s + n, 0)
  const progress = totalItems === 0 ? 0 : Math.round((retrievedItems / totalItems) * 100)
  const wouldComplete =
    selectedItems > 0 &&
    computeOrderStatus(
      order!.products.map((p) => ({
        ...p,
        retrieved: p.retrieved + (selection[p.id] ?? 0),
      })),
    ) === 'completed'

  const recentOtherRetrieve = order!.history.find((ev) => {
    if (operator && ev.operator === operator.name) return false
    const elapsed = Date.now() - new Date(ev.at).getTime()
    return elapsed < 5 * 60 * 1000
  })

  const setQty = (productId: string, qty: number) =>
    setSelection((prev) => ({ ...prev, [productId]: qty }))

  const selectAll = () => {
    const next: Record<string, number> = {}
    order!.products.forEach((p: OrderProduct) => {
      const remaining = p.total - p.retrieved
      if (remaining > 0) next[p.id] = remaining
    })
    setSelection(next)
  }

  const clearAll = () => setSelection({})

  const handleConfirmClick = () => {
    if (selectedItems === 0) return
    if (wouldComplete) {
      setConfirmOpen(true)
    } else {
      finalizeDelivery()
    }
  }

  const finalizeDelivery = () => {
    setConfirmOpen(false)

    const res = ordersStore.retrieveProducts({
      token: order!.token,
      operator: operator?.name ?? 'Operador',
      point: order!.pickupPoint ?? 'Mostrador',
      selection,
    })

    if (!res.ok) {
      toast.error('No pudimos confirmar', res.reason)
      return
    }

    clearSelection(order!.token) // UX-04: la entrega se confirmó, limpiamos lo persistido
    const eventId = res.event.id
    const wasComplete = wouldComplete
    const totalDelivered = res.event.items.reduce((s, i) => s + i.qty, 0)

    // UX-02: red de seguridad — permitir deshacer el retiro recién confirmado.
    toast.show({
      variant: 'success',
      title: `Entregaste ${totalDelivered} producto${totalDelivered === 1 ? '' : 's'}`,
      description: wasComplete ? 'El pedido quedó completo.' : 'Quedan productos por retirar.',
      duration: 7000,
      action: {
        label: 'Deshacer',
        onClick: () => {
          const undo = ordersStore.undoRetrieval(order!.token, eventId)
          if (undo.ok) {
            toast.info('Entrega deshecha', 'Restauramos las cantidades del pedido.')
            navigate(`/pedidos/${encodeURIComponent(order!.token)}`)
          } else {
            toast.error('No se pudo deshacer', undo.reason)
          }
        },
      },
    })

    navigate(
      `/pedidos/${encodeURIComponent(order!.token)}/confirmacion?items=${totalDelivered}&done=${wasComplete ? '1' : '0'}`,
    )
  }

  return (
    <>
      <div className="animate-fade-up mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 py-6 sm:px-6 sm:py-8">
        <button
          onClick={goBack}
          className="inline-flex w-fit items-center gap-1.5 rounded-full px-2 py-1 text-sm font-semibold text-neutral-500 transition-colors duration-150 hover:text-neutral-900 focus-visible:ring-2 focus-visible:ring-accent-400"
        >
          <ArrowLeft size={16} /> Volver
        </button>

        <div className="overflow-hidden rounded-3xl bg-white shadow-card">
          <div className="bg-violet-mesh relative px-5 pb-6 pt-5 sm:px-7 sm:pt-7">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-accent-700">
                  Pedido
                </p>
                <h1 className="mt-1 font-mono text-2xl font-bold tracking-widest text-neutral-900 sm:text-3xl">
                  {order!.token}
                </h1>
              </div>
              <StatusBadge status={order!.status} />
            </div>

            <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
              <div className="flex items-center gap-2 text-neutral-700">
                <User size={16} className="text-accent-500" />
                <span className="font-medium">{order!.customerName}</span>
              </div>
              {order!.pickupPoint && (
                <div className="flex items-center gap-2 text-neutral-700">
                  <MapPin size={16} className="text-cat-extra" />
                  <span className="font-medium">{order!.pickupPoint}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-neutral-700">
                <Clock size={16} className="text-cat-bebida" />
                <span className="font-medium">
                  {new Date(order!.createdAt).toLocaleString('es-AR', {
                    hour: '2-digit',
                    minute: '2-digit',
                    day: '2-digit',
                    month: '2-digit',
                  })}
                </span>
              </div>
            </dl>

            {venceLabel && (
              <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-neutral-700 ring-1 ring-neutral-100 backdrop-blur-sm">
                <Hourglass size={13} className="text-accent-500" />
                {venceLabel}
              </div>
            )}
          </div>

          <div className="border-t border-neutral-100 px-5 py-4 sm:px-7 sm:py-5">
            <div className="flex items-baseline justify-between text-xs">
              <span className="font-bold text-neutral-700">Avance del retiro</span>
              <span className="font-bold tabular-nums text-neutral-900">
                {retrievedItems} de {totalItems}
                <span className="ml-2 text-neutral-500">{progress}%</span>
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-primary-100">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-700 ease-out',
                  isCompleted
                    ? 'bg-gradient-to-r from-status-success to-emerald-400'
                    : 'bg-gradient-to-r from-accent-400 to-accent-600',
                )}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {recentOtherRetrieve && !isCompleted && (
          <div className="animate-fade-in flex items-start gap-3 rounded-2xl bg-status-info-bg p-4 text-status-info-fg ring-1 ring-status-info/20">
            <RefreshCw size={18} className="mt-0.5 shrink-0 text-status-info" />
            <div className="text-sm">
              <p className="font-bold">
                {recentOtherRetrieve.operator} acaba de retirar productos en{' '}
                {recentOtherRetrieve.point}
              </p>
              <p className="mt-0.5 text-xs font-medium">
                Revisá el historial antes de confirmar para no duplicar entregas.
              </p>
            </div>
          </div>
        )}

        {isCompleted && (
          <div className="flex items-center gap-3 rounded-2xl bg-status-success-bg p-4 text-status-success-fg">
            <CheckCircle2 size={20} className="shrink-0 text-status-success" />
            <p className="text-sm font-semibold">Este pedido ya fue entregado por completo.</p>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
          <h2 className="text-xl font-bold text-neutral-900">Productos</h2>
          {!isCompleted && (
            <div className="flex items-center gap-2">
              <button
                onClick={selectAll}
                className="inline-flex h-11 items-center gap-1.5 rounded-full bg-accent-50 px-4 text-xs font-bold text-accent-700 ring-1 ring-accent-100 transition-all duration-200 hover:-translate-y-0.5 hover:bg-accent-100 hover:shadow-card focus-visible:ring-2 focus-visible:ring-accent-400"
              >
                <Zap size={14} className="text-accent-500" /> Entregar todo
              </button>
              <button
                onClick={clearAll}
                disabled={selectedItems === 0}
                className="inline-flex h-11 items-center rounded-full px-4 text-xs font-semibold text-neutral-500 transition-colors duration-150 hover:text-neutral-900 disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-accent-400"
              >
                Limpiar
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3">
          {order!.products.map((product) => (
            <ProductRow
              key={product.id}
              product={product}
              selected={selection[product.id] ?? 0}
              onChange={(qty) => setQty(product.id, qty)}
            />
          ))}
        </div>

        <RetrievalHistory events={order!.history} />

        {!isCompleted && (
          <>
            <div className="h-32 md:hidden" aria-hidden />

            <div
              className={cn(
                'fixed inset-x-3 bottom-[5.5rem] z-20 rounded-3xl bg-white p-3 shadow-floating ring-1 ring-neutral-100',
                'md:static md:mt-3 md:p-4 md:shadow-card md:ring-0',
              )}
              style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
            >
              <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
                <div className="pl-2">
                  <p className="text-xs font-bold uppercase tracking-widest text-neutral-500">
                    A entregar
                  </p>
                  <p className="text-2xl font-bold tabular-nums text-neutral-900">{selectedItems}</p>
                </div>
                <button
                  type="button"
                  onClick={handleConfirmClick}
                  disabled={selectedItems === 0}
                  className={cn(
                    'group relative flex-1 overflow-hidden rounded-full px-6 py-4 text-base font-semibold text-white transition-all duration-200',
                    'bg-gradient-to-br from-accent-400 to-accent-600 shadow-cta hover:-translate-y-0.5 hover:from-accent-500 hover:to-accent-700 hover:shadow-floating',
                    'active:translate-y-0 active:scale-[0.98]',
                    'focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2',
                    'disabled:bg-none disabled:bg-primary-200 disabled:text-primary-400 disabled:shadow-none disabled:hover:translate-y-0 disabled:cursor-not-allowed',
                    'sm:flex-none sm:px-10',
                  )}
                >
                  Confirmar entrega
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <ConfirmDialog
        open={confirmOpen}
        variant="warning"
        title="¿Cerrar el pedido?"
        description={
          <span>
            Estás por entregar los últimos{' '}
            <span className="font-bold text-neutral-700">{selectedItems} producto{selectedItems === 1 ? '' : 's'}</span>{' '}
            del pedido <span className="font-mono font-bold text-accent-700">{order!.token}</span>. Esta acción cierra el QR y no se puede deshacer.
          </span>
        }
        confirmLabel="Sí, cerrar pedido"
        cancelLabel="Volver"
        onConfirm={finalizeDelivery}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  )
}

function ErrorState({
  variant,
  token,
  title,
  description,
}: {
  variant: 'expired' | 'not-found'
  token: string
  title: string
  description: string
}) {
  const Icon = variant === 'expired' ? Hourglass : AlertCircle
  return (
    <div className="animate-fade-up mx-auto flex w-full max-w-2xl flex-col items-center gap-5 px-4 py-20 text-center">
      <div className="grid h-20 w-20 place-items-center rounded-3xl bg-status-error-bg text-status-error">
        <Icon size={32} />
      </div>
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">{title}</h1>
        <p className="mt-2 text-base text-neutral-500">
          {description}
          {variant === 'not-found' && token && (
            <>
              {' '}Código:{' '}
              <code className="rounded-md bg-primary-100 px-1.5 py-0.5 font-mono text-sm font-bold text-neutral-700">
                {token}
              </code>
            </>
          )}
        </p>
      </div>
      <Link
        to="/"
        className="rounded-full bg-gradient-to-br from-accent-400 to-accent-600 px-6 py-3.5 text-sm font-semibold text-white shadow-cta transition-all duration-200 hover:-translate-y-0.5 hover:shadow-floating active:translate-y-0 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2"
      >
        Volver a escanear
      </Link>
    </div>
  )
}
