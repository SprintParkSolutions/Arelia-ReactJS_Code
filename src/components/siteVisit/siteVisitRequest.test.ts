import { expect, it } from 'vitest'
import { isFutureSiteVisitSlot } from './siteVisitRequest'

const now = new Date(2030, 9, 10, 14, 30)
it.each([
  ['2030-10-09', '2PM-3PM', false],
  ['2030-10-10', '9AM-10AM', false],
  ['2030-10-10', '2PM-3PM', false],
  ['2030-10-10', '2:30 PM - 3:30 PM', false],
  ['2030-10-10', '3PM-4PM', true],
  ['2030-10-10', '15:00-16:00', true],
  ['2030-10-11', '9AM-10AM', true],
  ['2030-10-10', '12AM-1AM', false],
  ['2030-10-10', '12PM-1PM', false],
  ['2030-10-10', 'invalid', false],
])('validates %s %s against the current time', (date, slot, expected) => {
  expect(isFutureSiteVisitSlot(date, slot, now)).toBe(expected)
})
