import { useEffect, useState } from 'react'
import { requestProjectDetails, type ProjectDetailsResult } from '../../services/projectDetailsApi'

export function useApprovalProjects(leadId?: string) {
  const [observed, setObserved] = useState<{ leadId: string; result: ProjectDetailsResult } | null>(null)
  useEffect(() => {
    if (!leadId) return
    let active = true
    let pending = false
    async function check() {
      if (!active || pending || document.visibilityState === 'hidden') return
      pending = true
      try {
        const response = await requestProjectDetails(leadId!)
        if (active && response.success) {
          setObserved({ leadId: leadId!, result: response })
        }
      } finally { pending = false }
    }
    void check()
    const timer = window.setInterval(() => { void check() }, 30_000)
    const onVisible = () => { void check() }
    window.addEventListener('focus', onVisible)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      active = false
      window.clearInterval(timer)
      window.removeEventListener('focus', onVisible)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [leadId])
  return observed?.leadId === leadId ? observed?.result : undefined
}
export function useApprovalStatus(leadId?: string) {
  return useApprovalProjects(leadId)?.approvalStatus
}
