import { useCallback, useEffect, useRef, useState } from 'react'
import { getDesignApprovals, submitDesignDecision, type Design, type DesignsResult } from '../../services/designApprovalsApi'
export function useDesignApprovals(contactId: string) {
  const [state, setState] = useState<{ contactId: string; result: DesignsResult } | null>(null)
  const [revision, setRevision] = useState(0)
  const [busy, setBusy] = useState(false)
  const lock = useRef(false)
  const generation = useRef(0)
  const retry = useCallback(() => setRevision(v => v + 1), [])
  useEffect(() => {
    if (!contactId) return
    let active = true
    let pending = false
    async function check() {
      if (!active || pending || lock.current || document.visibilityState === 'hidden') return
      pending = true
      const version = generation.current
      const result = await getDesignApprovals(contactId)
      if (active && version === generation.current) setState({ contactId, result })
      pending = false
    }
    void check()
    const refresh = () => { void check() }
    const timer = window.setInterval(refresh, 30000)
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', refresh)
    return () => { active = false; window.clearInterval(timer); window.removeEventListener('focus', refresh); document.removeEventListener('visibilitychange', refresh) }
  }, [contactId, revision])
  async function submit(design: Design, status: 'Approved' | 'Changes Requested', comments: string) {
    if (lock.current) return { success: false, message: 'A response is already being submitted.' }
    lock.current = true; generation.current++; setBusy(true)
    try {
      const result = await submitDesignDecision(contactId, design, status, comments)
      if (result.success || result.conflict) {
        setState(previous => previous?.contactId === contactId ? { ...previous, result: { ...previous.result, designs: previous.result.designs.map(d => d.designId === design.designId ? { ...d, status: result.success ? status : d.status, comments: result.success ? comments.trim() || 'Approved By Client' : d.comments, canApprove: false, canRequestChanges: false } : d) } } : previous)
      }
      retry()
      return result
    } finally { lock.current = false; setBusy(false) }
  }
  return { result: state?.contactId === contactId ? state?.result ?? null : null, busy, retry, submit }
}
