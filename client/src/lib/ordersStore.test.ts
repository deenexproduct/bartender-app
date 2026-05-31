import { describe, it, expect } from 'vitest'
import {
  computeOrderStatus,
  isOrderExpired,
  orderExpiryMs,
  createSeedOrders,
  type OrderProduct,
} from '@/data/mockOrders'
import { OrdersStore } from '@/lib/ordersStore'

const prod = (over: Partial<OrderProduct> = {}): OrderProduct => ({
  id: 'p1',
  name: 'Test',
  category: 'bebida',
  total: 5,
  retrieved: 0,
  ...over,
})

describe('computeOrderStatus', () => {
  it('pending cuando no se retiró nada', () => {
    expect(computeOrderStatus([prod({ retrieved: 0, total: 5 })])).toBe('pending')
  })
  it('partial cuando se retiró algo pero no todo', () => {
    expect(computeOrderStatus([prod({ retrieved: 2, total: 5 })])).toBe('partial')
  })
  it('completed cuando se retiró todo', () => {
    expect(computeOrderStatus([prod({ retrieved: 5, total: 5 })])).toBe('completed')
  })
  it('agrega cantidades a través de varios productos', () => {
    const ps = [prod({ id: 'a', retrieved: 1, total: 2 }), prod({ id: 'b', retrieved: 0, total: 3 })]
    expect(computeOrderStatus(ps)).toBe('partial')
  })
})

describe('orderExpiryMs / isOrderExpired', () => {
  const now = Date.now()
  const mkOrder = (over: Record<string, unknown> = {}) => ({
    id: 'o', token: 'T', customerName: 'C',
    createdAt: new Date(now - 10 * 60_000).toISOString(),
    status: 'pending' as const, history: [], products: [prod()],
    ...over,
  })

  it('usa expiresAt explícito si está', () => {
    const exp = new Date(now + 60_000).toISOString()
    expect(orderExpiryMs(mkOrder({ expiresAt: exp }), 0)).toBe(Date.parse(exp))
  })
  it('calcula desde createdAt + ventana si no hay expiresAt', () => {
    const o = mkOrder()
    expect(orderExpiryMs(o, 30)).toBe(Date.parse(o.createdAt) + 30 * 60_000)
  })
  it('ventana 0 sin expiresAt => nunca vence (null)', () => {
    expect(orderExpiryMs(mkOrder(), 0)).toBeNull()
  })
  it('expirado si expiresAt está en el pasado', () => {
    expect(isOrderExpired(mkOrder({ expiresAt: new Date(now - 1000).toISOString() }), now, 0)).toBe(true)
  })
  it('NO expirado si expiresAt está en el futuro', () => {
    expect(isOrderExpired(mkOrder({ expiresAt: new Date(now + 60_000).toISOString() }), now, 0)).toBe(false)
  })
  it('un pedido completado NUNCA vence', () => {
    const o = mkOrder({ status: 'completed', expiresAt: new Date(now - 1000).toISOString() })
    expect(isOrderExpired(o, now, 0)).toBe(false)
  })
})

describe('createSeedOrders — UX-38 expiresAt congelado', () => {
  it('con ventana > 0 congela expiresAt en los activos', () => {
    const orders = createSeedOrders(120)
    const active = orders.find((o) => o.status !== 'completed' && !o.token.includes('EXPIRED'))!
    expect(active.expiresAt).toBeTruthy()
    expect(Date.parse(active.expiresAt!)).toBe(Date.parse(active.createdAt) + 120 * 60_000)
  })
  it('con ventana 0 los activos quedan sin expiresAt (no vencen)', () => {
    const orders = createSeedOrders(0)
    const active = orders.find((o) => o.status === 'pending' && !o.token.includes('EXPIRED'))!
    expect(active.expiresAt).toBeUndefined()
  })
  it('DNX-EXPIRED siempre tiene expiresAt en el pasado', () => {
    const expired = createSeedOrders(120).find((o) => o.token === 'DNX-EXPIRED')!
    expect(Date.parse(expired.expiresAt!)).toBeLessThan(Date.now())
  })
})

describe('OrdersStore.retrieveProducts', () => {
  it('NO permite retirar más que lo restante (capping anti over-retrieval)', () => {
    const store = new OrdersStore()
    const res = store.retrieveProducts({ token: 'DNX-A1B2C3', operator: 'T', point: 'P', selection: { p1: 999 } })
    expect(res.ok).toBe(true)
    if (!res.ok) return
    const cerveza = store.findByToken('DNX-A1B2C3').ok && store.getAll().find((o) => o.token === 'DNX-A1B2C3')!.products.find((p) => p.id === 'p1')!
    expect(cerveza && cerveza.retrieved).toBe(7) // total de Cerveza, no 999
    expect(res.event.items[0].qty).toBe(7)
  })

  it('rechaza un pedido ya completado', () => {
    const store = new OrdersStore()
    const res = store.retrieveProducts({ token: 'DNX-DONE99', operator: 'T', point: 'P', selection: { p1: 1 } })
    expect(res.ok).toBe(false)
  })

  it('rechaza selección vacía', () => {
    const store = new OrdersStore()
    const res = store.retrieveProducts({ token: 'DNX-A1B2C3', operator: 'T', point: 'P', selection: {} })
    expect(res.ok).toBe(false)
  })

  it('token inexistente => error', () => {
    const store = new OrdersStore()
    const res = store.retrieveProducts({ token: 'NO-EXISTE', operator: 'T', point: 'P', selection: { p1: 1 } })
    expect(res.ok).toBe(false)
  })
})

describe('OrdersStore.undoRetrieval', () => {
  it('revierte cantidades y elimina el evento', () => {
    const store = new OrdersStore()
    const res = store.retrieveProducts({ token: 'DNX-A1B2C3', operator: 'T', point: 'P', selection: { p1: 3 } })
    expect(res.ok).toBe(true)
    if (!res.ok) return
    const undo = store.undoRetrieval('DNX-A1B2C3', res.event.id)
    expect(undo.ok).toBe(true)
    const order = store.getAll().find((o) => o.token === 'DNX-A1B2C3')!
    expect(order.products.find((p) => p.id === 'p1')!.retrieved).toBe(0)
    expect(order.history.length).toBe(0)
    expect(order.status).toBe('pending')
  })

  it('undo de un evento inexistente => error (idempotente)', () => {
    const store = new OrdersStore()
    const undo = store.undoRetrieval('DNX-A1B2C3', 'evento-fantasma')
    expect(undo.ok).toBe(false)
  })

  it('nunca deja retrieved negativo', () => {
    const store = new OrdersStore()
    const res = store.retrieveProducts({ token: 'DNX-A1B2C3', operator: 'T', point: 'P', selection: { p1: 2 } })
    if (!res.ok) return
    store.undoRetrieval('DNX-A1B2C3', res.event.id)
    const order = store.getAll().find((o) => o.token === 'DNX-A1B2C3')!
    expect(order.products.find((p) => p.id === 'p1')!.retrieved).toBeGreaterThanOrEqual(0)
  })
})
