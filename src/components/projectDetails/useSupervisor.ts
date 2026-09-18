import { useCallback, useEffect, useState } from 'react'
import { getSupervisor, type SupervisorResult } from '../../services/supervisorApi'
export function useSupervisor(leadId?: string) {
  const [state, setState] = useState<{ leadId: string; result: SupervisorResult } | null>(null)
  const [revision, setRevision] = useState(0)
  const retry = useCallback(() => setRevision(value => value + 1), [])
  useEffect(() => {
    if (!leadId) return
    let active = true
    let pending = false
    async function check() {
      if (!active || pending || document.visibilityState === 'hidden') return
      pending = true
      try {
        const result = await getSupervisor(leadId!)
        if (active) setState({ leadId: leadId!, result })
      } finally { pending = false }
    }
    void check()
    const timer = window.setInterval(() => { void check() }, 30_000)
    const refresh = () => { void check() }
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', refresh)
    return () => {
      active = false
      window.clearInterval(timer)
      window.removeEventListener('focus', refresh)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [leadId, revision])
  return { result: state?.leadId === leadId ? state?.result ?? null : null, retry }
}
