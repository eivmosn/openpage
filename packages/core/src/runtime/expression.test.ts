import type { RuntimeContext } from '../types/runtime'
import { describe, expect, it, vi } from 'vitest'
import { compileExpressionValue, resolveExpressionValue } from './expression'

/**
 * 创建表达式测试所需的最小运行时上下文。
 *
 * @param state 当前测试状态对象。
 * @returns 返回表达式可执行的运行时上下文。
 */
function createRuntimeContext(state: Record<string, unknown>): RuntimeContext {
  return {
    compiled: {
      id: 'test-page',
      children: [],
      components: new Map(),
      componentNames: new Map(),
      interactionCss: '',
    },
    componentPatches: {},
    services: {
      notifyStateChange: vi.fn(),
    },
    state,
  }
}

describe('expression runtime', () => {
  it('resolves missing state identifiers as undefined', () => {
    const context = createRuntimeContext({})

    expect(resolveExpressionValue('{{ sum(a, b) }}', context)).toBeUndefined()
  })

  it('keeps helpers, scope and global objects available', () => {
    const context = createRuntimeContext({
      a: 2,
    })

    expect(resolveExpressionValue('{{ sum(a, $event.step, Math.max(1, 3)) }}', context, {
      $event: {
        step: 4,
      },
    })).toBe(9)
  })

  it('uses the compiled expression resolver with the same safe state scope', () => {
    const context = createRuntimeContext({
      price: 12,
    })
    const resolveValue = compileExpressionValue({
      total: '{{ sum(price, discount) }}',
    })

    expect(resolveValue(context)).toEqual({
      total: 12,
    })
  })
})
