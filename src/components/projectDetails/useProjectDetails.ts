import { useCallback, useEffect, useState } from 'react'
import { requestProjectDetails, type ProjectDetailsResult } from '../../services/projectDetailsApi'
export function useProjectDetails(leadId?: string) {
  const [result, setResult] = useState<ProjectDetailsResult | null>(null)
  const [loading, setLoading] = useState(Boolean(leadId))
  const [revision, setRevision] = useState(0)
  const reload = useCallback(() => setRevision(value => value + 1), [])
  useEffect(() => {
    let current = true
    if (!leadId) return
    async function load() {
      setLoading(true)
      setResult(null)
      const next = await requestProjectDetails(leadId!)
      if (current) { setResult(next); setLoading(false) }
    }
    void load()
    return () => { current = false }
  }, [leadId, revision])
  return { result, loading, reload, setResult }
}
