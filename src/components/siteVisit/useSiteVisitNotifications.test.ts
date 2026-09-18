import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { VisitReport } from '../../services/siteVisitApi'
import { useSiteVisitNotifications } from './useSiteVisitNotifications'

function approved(leadId: string, reportId = 'report1'): VisitReport {
  return { success: true, message: '', reportAvailable: true, report: { leadId, reportId, managementApproval: true, finalSubmitted: true } }
}
describe('report-ready notifications', () => {
  it('notifies when an approved report arrives and retains read history without duplicates', () => {
    const leadId = 'report-history-lead'
    const hook = renderHook(({ report }: { report: VisitReport | null }) => useSiteVisitNotifications(leadId, null, report), { initialProps: { report: null } })
    expect(hook.result.current.notifications).toHaveLength(0)
    hook.rerender({ report: approved(leadId) })
    expect(hook.result.current.notifications).toHaveLength(1)
    const notification = hook.result.current.notifications[0]
    expect(notification.message).toContain('ready to view')
    expect(notification.type).toBe('siteVisit')
    act(() => hook.result.current.markRead(notification.id))
    hook.rerender({ report: approved(leadId) })
    expect(hook.result.current.notifications).toHaveLength(1)
    expect(hook.result.current.notifications[0].read).toBe(true)
    hook.unmount()
    const restored = renderHook(() => useSiteVisitNotifications(leadId, null, approved(leadId)))
    expect(restored.result.current.notifications[0].read).toBe(true)
    act(() => restored.result.current.dismiss(notification.id))
    restored.rerender()
    expect(restored.result.current.notifications).toHaveLength(0)
  })
  it('creates a new notification for a different approved report', () => {
    const leadId = 'report-next-lead'
    const hook = renderHook(({ report }) => useSiteVisitNotifications(leadId, null, report), { initialProps: { report: approved(leadId) } })
    act(() => hook.result.current.markAllRead())
    hook.rerender({ report: approved(leadId, 'report2') })
    expect(hook.result.current.notifications).toHaveLength(2)
    expect(hook.result.current.notifications[0].read).toBe(false)
    expect(hook.result.current.notifications[1].read).toBe(true)
  })
  it.each([
    { success: false, message: 'Offline' },
    { success: true, message: '', reportAvailable: false },
    { ...approved('invalid-report-lead'), report: { ...approved('invalid-report-lead').report, managementApproval: false } },
    { ...approved('invalid-report-lead'), report: { ...approved('invalid-report-lead').report, finalSubmitted: false } },
    approved('another-lead'),
  ])('does not notify for unavailable, unapproved or unrelated reports', report => {
    const hook = renderHook(() => useSiteVisitNotifications('invalid-report-lead', null, report))
    expect(hook.result.current.notifications).toHaveLength(0)
  })
})