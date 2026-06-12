import { describe, expect, it } from 'vitest'
import { getModelValue, setModelValue } from './model'

describe('runtime model binding', () => {
  it('reads and writes single path models', () => {
    const state: Record<string, unknown> = {
      search: {
        keyword: 'OpenPage',
      },
    }

    expect(getModelValue(state, { path: 'search.keyword' })).toBe('OpenPage')

    setModelValue(state, { path: 'search.keyword' }, 'Renderer')

    expect(state).toEqual({
      search: {
        keyword: 'Renderer',
      },
    })
  })

  it('reads and writes multi path models as arrays', () => {
    const state: Record<string, unknown> = {
      end: '',
      start: '',
    }

    expect(getModelValue(state, { paths: ['start', 'end'] })).toEqual(['', ''])

    setModelValue(state, { paths: ['start', 'end'] }, ['2026-01-01', '2026-12-31'])

    expect(state).toEqual({
      end: '2026-12-31',
      start: '2026-01-01',
    })
  })
})
