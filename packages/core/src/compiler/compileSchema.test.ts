import type { RuntimeContext } from '../types/runtime'
import { describe, expect, it } from 'vitest'
import { compileSchema } from './compileSchema'

describe('compileSchema', () => {
  it('binds component names directly to state paths without form containers', () => {
    const compiled = compileSchema({
      id: 'page',
      children: [
        {
          id: 'keyword',
          type: 'input',
          name: 'search.keyword',
        },
        {
          id: 'title',
          type: 'input',
          name: 'title',
        },
      ],
    })

    expect(compiled.components.get('keyword')?.model).toEqual({
      path: 'search.keyword',
    })
    expect(compiled.components.get('title')?.model).toEqual({
      path: 'title',
    })
    expect(compiled.componentNames.get('search.keyword')).toBe('keyword')
  })

  it('binds comma separated component names to multiple state paths', () => {
    const compiled = compileSchema({
      id: 'page',
      children: [
        {
          id: 'date-range',
          type: 'daterange',
          name: 'start,end',
        },
      ],
    })

    expect(compiled.components.get('date-range')?.model).toEqual({
      paths: ['start', 'end'],
    })
    expect(compiled.componentNames.get('start,end')).toBe('date-range')
  })

  it('supports configurable dynamic component fields', () => {
    const compiled = compileSchema({
      id: 'page',
      children: [{
        id: 'hero',
        type: 'section',
        props: {},
        description: '{{ state.user.name + " / " + state.count }}',
      }],
    }, {
      dynamicFieldKeys: ['description'],
    })
    const component = compiled.components.get('hero')
    const context = {
      ctx: {},
      params: {},
      services: {
        notifyStateChange: () => {},
      },
      state: {
        count: 7,
        user: {
          name: 'OpenPage',
        },
      },
    } as unknown as RuntimeContext

    expect(component?.dynamic.fields).toEqual(['description'])
    expect(component?.dynamicValues.description).toBe('{{ state.user.name + " / " + state.count }}')
    expect(component?.dynamicResolvers.description?.(context)).toBe('OpenPage / 7')
  })
})
