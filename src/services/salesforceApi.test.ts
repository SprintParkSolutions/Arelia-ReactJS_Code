import { afterEach, expect, it, vi } from 'vitest'
import { getProjectStatus } from './salesforceApi'

afterEach(() => vi.unstubAllGlobals())

it('retains zero as the baseline for subsequent project progress updates', async () => {
  const fetchMock = vi.fn()
  for (const completionPercentage of [0, 8, 17]) {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({
      success: true,
      projects: [{ projectId: 'project-1', projectName: 'Kitchen', completionPercentage }],
    })))
  }
  vi.stubGlobal('fetch', fetchMock)
  const progress = []
  for (let index = 0; index < 3; index++) {
    progress.push((await getProjectStatus('contact-1'))?.projects[0].completionPercentage)
  }
  expect(progress).toEqual([0, 8, 17])
})

it('preserves zero over fallback values and retains nullish fallbacks', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
    success: true,
    projects: [
      { projectId: 'a', projectName: 'First', completionPercentage: 0, progress: 25 },
      { projectId: 'b', projectName: 'Second', completionPercentage: null, progress: 0, percentComplete: 30 },
      { projectId: 'c', projectName: 'Third', percentComplete: 8 },
      { projectId: 'd', projectName: 'Fourth' },
    ],
  }))))
  const result = await getProjectStatus('contact-1')
  expect(result?.projects.map(project => project.completionPercentage)).toEqual([0, 0, 8, undefined])
})
