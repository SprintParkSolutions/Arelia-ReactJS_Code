import type { ProjectDetailsResult } from '../../services/projectDetailsApi'
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
// Keep the existing per-Lead keys so previously read/dismissed approvals stay that way.
export function useProjectApprovalNotifications(leadId: string | undefined, result?: ProjectDetailsResult) {
  const projects = useMemo(() => result?.projects?.length ? result.projects : leadId ? [{ ...result, leadId }] : [], [leadId, result])
  const items = projects.map((project, index) => ({
    leadId: project.leadId, needed: project.approvalStatus === 'Approved',
    message: `${projects.length > 1 ? `Project ${index + 1}: ` : ''}Your project details have been approved by the Arelia Team.`,
  }))
  return useProjectNotifications(items, 'projectApprovalNotification', 'project-details-approved', 'approvals')
}

export function useProjectNotifications(
  projects: { leadId?: string; needed: boolean; message: string }[],
  category: string, prefix: string, type: 'approvals' | 'supervisor',
) {
  const keys = useMemo(() => projects.map(project => `${category}:${project.leadId}`), [projects, category])
  const raw = useSyncExternalStore(subscribe, () => JSON.stringify(keys.map(key => read(key))), () => '[]')
  const reminders = useMemo<(Reminder | null)[]>(() => JSON.parse(raw).map((value: string | null) => {
    try {
      const entry = value ? JSON.parse(value) : null
      return entry && typeof entry.timestamp === 'number' && typeof entry.read === 'boolean' && typeof entry.dismissed === 'boolean' ? entry : null
    } catch { return null }
  }), [raw])
  useEffect(() => {
    projects.forEach((project, index) => {
      if (project.leadId && project.needed && !reminders[index]) {
        write(keys[index], { timestamp: Date.now(), read: false, dismissed: false })
      }
    })
  }, [projects, keys, reminders])
  const entries = projects.flatMap((project, index) => {
    const reminder = reminders[index]
    return project.leadId && reminder ? [{
      ...reminder, id: `${prefix}:${project.leadId}`, type,
      message: project.message,
      key: keys[index],
    }] : []
  })
  function update(id?: string, dismiss = false) {
    entries.filter(entry => !id || entry.id === id).forEach(entry => {
      write(entry.key, { timestamp: entry.timestamp, read: true, dismissed: entry.dismissed || dismiss })
    })
  }
  return {
    notifications: entries.filter(entry => !entry.dismissed),
    markRead: (id: string) => update(id), markAllRead: () => update(), dismiss: (id: string) => update(id, true),
  }
}
