import { useEffect, useMemo, useSyncExternalStore } from 'react'
const eventName = 'project-reminder-updated'
type Reminder = { timestamp: number; read: boolean; dismissed: boolean }
const memory = new Map<string, string>()
function subscribe(callback: () => void) {
  window.addEventListener(eventName, callback)
  window.addEventListener('storage', callback)
  return () => {
    window.removeEventListener(eventName, callback)
    window.removeEventListener('storage', callback)
  }
}
function read(key: string) {
  try { return localStorage.getItem(key) || memory.get(key) || null } catch { return memory.get(key) || null }
}
function write(key: string, value: Reminder) {
  const json = JSON.stringify(value)
  memory.set(key, json)
  try { localStorage.setItem(key, json) } catch { /* Retain history for this session if storage is unavailable. */ }
  window.dispatchEvent(new Event(eventName))
}
export function useProjectReminder(leadId: string | undefined, needed: boolean, category = 'projectDetailsReminder') {
  const key = leadId ? `${category}:${leadId}` : ''
  const raw = useSyncExternalStore(subscribe, () => key ? read(key) : null, () => null)
  const reminder = useMemo<Reminder | null>(() => {
    try {
      const value = raw ? JSON.parse(raw) : null
      return value && typeof value.timestamp === 'number' && typeof value.read === 'boolean' && typeof value.dismissed === 'boolean' ? value : null
    } catch { return null }
  }, [raw])
  useEffect(() => {
    if (key && needed && !reminder) write(key, { timestamp: Date.now(), read: false, dismissed: false })
  }, [key, needed, reminder])
  return {
    reminder,
    markRead: () => { if (key && reminder) write(key, { ...reminder, read: true }) },
    dismiss: () => { if (key && reminder) write(key, { ...reminder, dismissed: true }) },
  }
}