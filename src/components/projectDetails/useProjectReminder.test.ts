import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useProjectReminder } from './useProjectReminder'
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