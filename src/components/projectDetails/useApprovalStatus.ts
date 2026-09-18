import { useEffect, useState } from 'react'
import { requestProjectDetails, type ProjectDetailsResult } from '../../services/projectDetailsApi'

export function useApprovalStatus(leadId?: string) {
  const [observed, setObserved] = useState<{ leadId: string; status: ProjectDetailsResult['approvalStatus'] } | null>(null)
  useEffect(() => {
    if (!leadId) return
    let active = true
    let pending = false
    async function check() {
      if (!active || pending || document.visibilityState === 'hidden') return
      pending = true
      try {
        const response = await requestProjectDetails(leadId!)
        if (active && response.success && response.approvalStatus) {
          setObserved({ leadId: leadId!, status: response.approvalStatus })
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
  return observed?.leadId === leadId ? observed?.status : undefined
}