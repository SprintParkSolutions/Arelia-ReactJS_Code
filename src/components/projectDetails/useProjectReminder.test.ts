import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useProjectReminder, useProjectConversionNotifications } from './useProjectReminder'
describe('project reminder history', () => {
  it('retains read history after submission and remount', () => {
    const hook = renderHook(({ needed }) => useProjectReminder('lead-history-test', needed), { initialProps: { needed: true } })
    const timestamp = hook.result.current.reminder!.timestamp
    act(() => hook.result.current.markRead())
    hook.rerender({ needed: false })
    expect(hook.result.current.reminder).toEqual({ timestamp, read: true, dismissed: false })
    hook.unmount()
    const restored = renderHook(() => useProjectReminder('lead-history-test', false))
    expect(restored.result.current.reminder).toEqual({ timestamp, read: true, dismissed: false })
  })
  it('isolates history by Lead and does not invent notifications for completed accounts', () => {
    const { result } = renderHook(() => useProjectReminder('different-lead-test', false))
    expect(result.current.reminder).toBeNull()
  })
  it('only dismisses when explicitly deleted', () => {
    const { result, rerender } = renderHook(() => useProjectReminder('deleted-lead-test', true))
    act(() => result.current.dismiss())
    rerender()
    expect(result.current.reminder?.dismissed).toBe(true)
  })
})
it('notifies once per fully converted project and preserves independent read and deleted history', () => {
  const project = (leadId: string, converted: boolean) => ({ success: true, message: '', leadId,
    isConverted: converted, convertedAccountId: 'account', convertedContactId: 'contact',
    convertedOpportunityId: converted ? 'opp-' + leadId : undefined })
  const first = project('conversion-first', true)
  const second = project('conversion-second', false)
  const initial = { success: true, message: '', projects: [first, second] }
  const view = renderHook(({ data }) => useProjectConversionNotifications(first.leadId, data), { initialProps: { data: initial } })
  expect(view.result.current.notifications).toHaveLength(1)
  expect(view.result.current.notifications[0].message).toContain('Project 1:')
  act(() => view.result.current.markRead('project-converted:' + first.leadId))
  view.rerender({ data: { ...initial, projects: [first, project(second.leadId, true)] } })
  expect(view.result.current.notifications).toHaveLength(2)
  expect(view.result.current.notifications.map(n => n.read)).toEqual([true, false])
  expect(view.result.current.notifications[1].message).toContain('Project 2:')
  act(() => view.result.current.dismiss('project-converted:' + first.leadId))
  act(() => view.result.current.markAllRead())
  view.unmount()
  const restored = renderHook(() => useProjectConversionNotifications(first.leadId,
    { ...initial, projects: [first, project(second.leadId, true)] }))
  expect(restored.result.current.notifications).toHaveLength(1)
  expect(restored.result.current.notifications[0].read).toBe(true)
})
it('does not notify for incomplete conversion or an older API response', () => {
  const { result } = renderHook(() => useProjectConversionNotifications('conversion-incomplete', {
    success: true, message: '', isConverted: true, convertedAccountId: 'account', convertedContactId: 'contact',
  }))
  expect(result.current.notifications).toHaveLength(0)
})
