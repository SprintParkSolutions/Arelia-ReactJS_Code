import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useDesignNotifications } from './useDesignNotifications'
import type { Design } from '../../services/designApprovalsApi'
const design: Design = {
  designId: 'manager-design', designName: 'AD-0247', opportunityId: 'opp1',
  opportunityName: 'Yash Thakur Home Project', status: 'Approved', comments: '',
  createdDate: '', canApprove: false, canRequestChanges: false, files: [], managerApproval: false,
}
describe('manager approval notifications', () => {
  it('notifies only on manager approval, retains read history, and prevents duplicates', () => {
    const hook = renderHook(({ item }) => useDesignNotifications('manager-test-contact', { success: true, message: '', designs: [item] }), { initialProps: { item: design } })
    expect(hook.result.current.notifications).toHaveLength(0)
    const approved = { ...design, managerApproval: true }
    hook.rerender({ item: approved })
    expect(hook.result.current.notifications).toHaveLength(1)
    const notification = hook.result.current.notifications[0]
    expect(notification.message).toBe('AD-0247 3D Design for Yash Thakur Home Project has received final internal approval and is ready to proceed to the next stage.')
    expect(notification.designId).toBe(design.designId)
    act(() => hook.result.current.markRead(notification.id))
    hook.rerender({ item: { ...approved } })
    expect(hook.result.current.notifications).toHaveLength(1)
    expect(hook.result.current.notifications[0].read).toBe(true)
    hook.unmount()
    const restored = renderHook(() => useDesignNotifications('manager-test-contact', { success: true, message: '', designs: [approved] }))
    expect(restored.result.current.notifications[0].read).toBe(true)
    act(() => restored.result.current.dismiss(notification.id))
    restored.rerender()
    expect(restored.result.current.notifications).toHaveLength(0)
  })
  it('keeps the original review notification separate from final approval', () => {
    const hook = renderHook(({ item }) => useDesignNotifications('manager-separate-contact', { success: true, message: '', designs: [item] }), { initialProps: { item: { ...design, status: 'Sent' } } })
    const request = hook.result.current.notifications[0]
    act(() => hook.result.current.markRead(request.id))
    hook.rerender({ item: { ...design, managerApproval: true } })
    expect(hook.result.current.notifications).toHaveLength(2)
    expect(hook.result.current.notifications.find(n => n.id === request.id)).toMatchObject({ read: true, message: '3D design for Yash Thakur Home Project is ready for review and approval.' })
    expect(hook.result.current.notifications[0].read).toBe(false)
  })
})