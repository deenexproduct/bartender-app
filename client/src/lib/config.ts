import { useSyncExternalStore } from 'react'

// KONEX: vencimiento de QR parametrizable. Acá vive la ventana de expiración
// (en minutos). 0 = el QR no vence. Persistido en localStorage.

const STORAGE_KEY = 'bartender.config.v1'
const DEFAULT_EXPIRY_MINUTES = 120 // 2 h

export type AppConfig = {
  qrExpiryMinutes: number
}

export const EXPIRY_OPTIONS: { label: string; minutes: number }[] = [
  { label: '30 min', minutes: 30 },
  { label: '2 h', minutes: 120 },
  { label: '8 h', minutes: 480 },
  { label: 'Sin vencimiento', minutes: 0 },
]

function load(): AppConfig {
  if (typeof window === 'undefined') return { qrExpiryMinutes: DEFAULT_EXPIRY_MINUTES }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { qrExpiryMinutes: DEFAULT_EXPIRY_MINUTES }
    const parsed = JSON.parse(raw) as Partial<AppConfig>
    return {
      qrExpiryMinutes:
        typeof parsed.qrExpiryMinutes === 'number' && parsed.qrExpiryMinutes >= 0
          ? parsed.qrExpiryMinutes
          : DEFAULT_EXPIRY_MINUTES,
    }
  } catch {
    return { qrExpiryMinutes: DEFAULT_EXPIRY_MINUTES }
  }
}

let state: AppConfig = load()
let snapshot: AppConfig = { ...state }
const listeners = new Set<() => void>()

function emit() {
  snapshot = { ...state }
  listeners.forEach((l) => l())
}

export const configStore = {
  subscribe: (l: () => void) => {
    listeners.add(l)
    return () => {
      listeners.delete(l)
    }
  },
  getSnapshot: () => snapshot,
  getQrExpiryMinutes: () => state.qrExpiryMinutes,
  setQrExpiryMinutes(minutes: number) {
    state = { ...state, qrExpiryMinutes: Math.max(0, Math.round(minutes)) }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      /* noop */
    }
    emit()
  },
}

export function useConfig(): AppConfig {
  return useSyncExternalStore(
    configStore.subscribe,
    configStore.getSnapshot,
    configStore.getSnapshot,
  )
}
