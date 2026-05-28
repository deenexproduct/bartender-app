export type ProductStatus = 'pending' | 'partial' | 'completed'
export type OrderError = 'not-found' | 'expired'

export type OrderProduct = {
  id: string
  name: string
  description?: string
  category: 'bebida' | 'comida' | 'extra'
  total: number
  retrieved: number
}

export type RetrievalEvent = {
  id: string
  at: string
  operator: string
  point: string
  items: { productId: string; productName: string; qty: number }[]
}

export type Order = {
  id: string
  token: string
  customerName: string
  createdAt: string
  pickupPoint?: string
  status: ProductStatus
  products: OrderProduct[]
  history: RetrievalEvent[]
  /** Vencimiento explícito. Si no está, se calcula con la ventana parametrizable. */
  expiresAt?: string
}

export type FindResult =
  | { ok: true; order: Order }
  | { ok: false; error: OrderError }

// Pedidos semilla con fechas RELATIVAS al momento de carga, para que la
// expiración parametrizable se pueda demostrar de verdad (no fechas fijas viejas).
export function createSeedOrders(): Order[] {
  const now = Date.now()
  const minAgo = (m: number) => new Date(now - m * 60000).toISOString()

  return [
    {
      id: 'ord_001',
      token: 'DNX-A1B2C3',
      customerName: 'Lucía Fernández',
      createdAt: minAgo(12),
      pickupPoint: 'Barra principal',
      status: 'pending',
      history: [],
      products: [
        { id: 'p1', name: 'Cerveza Stella', category: 'bebida', total: 7, retrieved: 0 },
        { id: 'p2', name: 'Gin Tonic', description: 'Hendrick’s + tónica', category: 'bebida', total: 2, retrieved: 0 },
        { id: 'p3', name: 'Papas bravas', category: 'comida', total: 1, retrieved: 0 },
        { id: 'p4', name: 'Tabla de quesos', category: 'comida', total: 1, retrieved: 0 },
      ],
    },
    {
      id: 'ord_002',
      token: 'DNX-X9Y8Z7',
      customerName: 'Mateo Sosa',
      createdAt: minAgo(48),
      pickupPoint: 'Cocina',
      status: 'partial',
      products: [
        { id: 'p1', name: 'Aperol Spritz', category: 'bebida', total: 4, retrieved: 2 },
        { id: 'p2', name: 'Empanadas (carne)', category: 'comida', total: 6, retrieved: 6 },
        { id: 'p3', name: 'Agua sin gas', category: 'bebida', total: 2, retrieved: 0 },
      ],
      history: [
        {
          id: 'r1',
          at: minAgo(40),
          operator: 'Sofía Méndez',
          point: 'Cocina',
          items: [{ productId: 'p2', productName: 'Empanadas (carne)', qty: 6 }],
        },
        {
          id: 'r2',
          at: minAgo(33),
          operator: 'Lucas Torres',
          point: 'Barra principal',
          items: [{ productId: 'p1', productName: 'Aperol Spritz', qty: 2 }],
        },
      ],
    },
    {
      id: 'ord_003',
      token: 'DNX-DONE99',
      customerName: 'Camila Pérez',
      createdAt: minAgo(190),
      pickupPoint: 'Takeaway',
      status: 'completed',
      products: [
        { id: 'p1', name: 'Café americano', category: 'bebida', total: 2, retrieved: 2 },
        { id: 'p2', name: 'Medialunas', category: 'comida', total: 3, retrieved: 3 },
      ],
      history: [
        {
          id: 'r1',
          at: minAgo(185),
          operator: 'Lucas Torres',
          point: 'Takeaway',
          items: [
            { productId: 'p1', productName: 'Café americano', qty: 2 },
            { productId: 'p2', productName: 'Medialunas', qty: 3 },
          ],
        },
      ],
    },
    {
      // Demo de QR vencido: expiresAt explícito en el pasado → siempre vencido,
      // independiente de la ventana parametrizable.
      id: 'ord_exp',
      token: 'DNX-EXPIRED',
      customerName: 'Tomás Giménez',
      createdAt: minAgo(400),
      expiresAt: minAgo(30),
      pickupPoint: 'Barra principal',
      status: 'pending',
      history: [],
      products: [
        { id: 'p1', name: 'Fernet con cola', category: 'bebida', total: 3, retrieved: 0 },
        { id: 'p2', name: 'Maní', category: 'extra', total: 1, retrieved: 0 },
      ],
    },
  ]
}

// Se mantiene un snapshot por compatibilidad, pero el store usa createSeedOrders().
export const mockOrders: Order[] = createSeedOrders()

export function computeOrderStatus(products: OrderProduct[]): ProductStatus {
  const totalQty = products.reduce((s, p) => s + p.total, 0)
  const retrievedQty = products.reduce((s, p) => s + p.retrieved, 0)
  if (retrievedQty === 0) return 'pending'
  if (retrievedQty >= totalQty) return 'completed'
  return 'partial'
}

/** Timestamp (ms) en que vence el QR, o null si no vence. `windowMin` = 0 → sin vencimiento. */
export function orderExpiryMs(order: Order, windowMin: number): number | null {
  if (order.expiresAt) return Date.parse(order.expiresAt)
  if (windowMin > 0) return Date.parse(order.createdAt) + windowMin * 60_000
  return null
}

/** Un pedido completado nunca "vence" (ya se cumplió). */
export function isOrderExpired(order: Order, nowMs: number, windowMin: number): boolean {
  if (order.status === 'completed') return false
  const exp = orderExpiryMs(order, windowMin)
  return exp !== null && nowMs > exp
}
