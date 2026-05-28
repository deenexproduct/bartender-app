import { useSyncExternalStore } from 'react'
import {
  computeOrderStatus,
  createSeedOrders,
  isOrderExpired,
  type FindResult,
  type Order,
  type RetrievalEvent,
} from '@/data/mockOrders'
import { configStore, useConfig } from '@/lib/config'

// v3: expiresAt congelado por pedido (UX-38, no retroactivo). Descarta cache previo.
const STORAGE_KEY = 'bartender.orders.v3'

type Listener = () => void

class OrdersStore {
  private orders: Order[]
  private listeners = new Set<Listener>()
  private snapshotRef: { orders: Order[] }

  constructor() {
    this.orders = this.load()
    this.snapshotRef = { orders: this.orders }
  }

  private load(): Order[] {
    if (typeof window === 'undefined') return createSeedOrders(configStore.getQrExpiryMinutes())
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return createSeedOrders(configStore.getQrExpiryMinutes())
      const parsed = JSON.parse(raw) as Order[]
      if (!Array.isArray(parsed) || parsed.length === 0) return createSeedOrders(configStore.getQrExpiryMinutes())
      return parsed
    } catch {
      return createSeedOrders(configStore.getQrExpiryMinutes())
    }
  }

  private persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.orders))
    } catch {
      /* noop */
    }
  }

  private emit() {
    this.snapshotRef = { orders: this.orders }
    this.listeners.forEach((l) => l())
  }

  subscribe = (l: Listener) => {
    this.listeners.add(l)
    return () => {
      this.listeners.delete(l)
    }
  }

  getSnapshot = () => this.snapshotRef

  // --- Selectors ---

  getAll(): Order[] {
    return this.orders
  }

  findByToken(token: string): FindResult {
    const cleaned = token.trim().toUpperCase()
    const order = this.orders.find((o) => o.token.toUpperCase() === cleaned)
    if (!order) return { ok: false, error: 'not-found' }
    if (isOrderExpired(order, Date.now(), configStore.getQrExpiryMinutes())) {
      return { ok: false, error: 'expired' }
    }
    return { ok: true, order }
  }

  // --- Mutations ---

  retrieveProducts(args: {
    token: string
    operator: string
    point: string
    selection: Record<string, number> // productId → qty
  }): { ok: true; event: RetrievalEvent } | { ok: false; reason: string } {
    const cleaned = args.token.trim().toUpperCase()
    const idx = this.orders.findIndex((o) => o.token.toUpperCase() === cleaned)
    if (idx === -1) return { ok: false, reason: 'Pedido no encontrado' }

    const order = this.orders[idx]
    if (isOrderExpired(order, Date.now(), configStore.getQrExpiryMinutes())) {
      return { ok: false, reason: 'El QR venció' }
    }
    if (order.status === 'completed') {
      return { ok: false, reason: 'Pedido ya completado' }
    }

    // Build event items, validating no over-retrieval
    const items: RetrievalEvent['items'] = []
    const updatedProducts = order.products.map((p) => {
      const qty = args.selection[p.id] ?? 0
      if (qty <= 0) return p
      const remaining = p.total - p.retrieved
      const safeQty = Math.min(qty, remaining)
      if (safeQty === 0) return p
      items.push({ productId: p.id, productName: p.name, qty: safeQty })
      return { ...p, retrieved: p.retrieved + safeQty }
    })

    if (items.length === 0) {
      return { ok: false, reason: 'No hay productos seleccionados' }
    }

    const event: RetrievalEvent = {
      id: `r_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      at: new Date().toISOString(),
      operator: args.operator,
      point: args.point,
      items,
    }

    const nextOrder: Order = {
      ...order,
      products: updatedProducts,
      status: computeOrderStatus(updatedProducts),
      history: [...order.history, event],
    }

    this.orders = [
      ...this.orders.slice(0, idx),
      nextOrder,
      ...this.orders.slice(idx + 1),
    ]
    this.persist()
    this.emit()

    return { ok: true, event }
  }

  // UX-02: revierte un retiro por id de evento (red de seguridad / "Deshacer").
  // Resta las cantidades de ese evento y lo quita del historial.
  undoRetrieval(
    token: string,
    eventId: string,
  ): { ok: true } | { ok: false; reason: string } {
    const cleaned = token.trim().toUpperCase()
    const idx = this.orders.findIndex((o) => o.token.toUpperCase() === cleaned)
    if (idx === -1) return { ok: false, reason: 'Pedido no encontrado' }

    const order = this.orders[idx]
    const event = order.history.find((e) => e.id === eventId)
    if (!event) return { ok: false, reason: 'No encontramos esa entrega' }

    const decByProduct = new Map<string, number>()
    event.items.forEach((it) =>
      decByProduct.set(it.productId, (decByProduct.get(it.productId) ?? 0) + it.qty),
    )

    const updatedProducts = order.products.map((p) => {
      const dec = decByProduct.get(p.id) ?? 0
      if (dec <= 0) return p
      return { ...p, retrieved: Math.max(0, p.retrieved - dec) }
    })

    const nextOrder: Order = {
      ...order,
      products: updatedProducts,
      status: computeOrderStatus(updatedProducts),
      history: order.history.filter((e) => e.id !== eventId),
    }

    this.orders = [
      ...this.orders.slice(0, idx),
      nextOrder,
      ...this.orders.slice(idx + 1),
    ]
    this.persist()
    this.emit()

    return { ok: true }
  }

  resetToDemo() {
    this.orders = createSeedOrders(configStore.getQrExpiryMinutes())
    this.persist()
    this.emit()
  }
}

export const ordersStore = new OrdersStore()

export function useOrders(): Order[] {
  const snap = useSyncExternalStore(
    ordersStore.subscribe,
    ordersStore.getSnapshot,
    ordersStore.getSnapshot,
  )
  return snap.orders
}

export function useOrder(token: string | undefined): FindResult {
  const orders = useOrders()
  const { qrExpiryMinutes } = useConfig()
  if (!token) return { ok: false, error: 'not-found' }
  const cleaned = token.trim().toUpperCase()
  const order = orders.find((o) => o.token.toUpperCase() === cleaned)
  if (!order) return { ok: false, error: 'not-found' }
  if (isOrderExpired(order, Date.now(), qrExpiryMinutes)) {
    return { ok: false, error: 'expired' }
  }
  return { ok: true, order }
}

export function useOrderStats() {
  const orders = useOrders()
  return {
    pending: orders.filter((o) => o.status === 'pending').length,
    partial: orders.filter((o) => o.status === 'partial').length,
    completed: orders.filter((o) => o.status === 'completed').length,
    total: orders.length,
  }
}
