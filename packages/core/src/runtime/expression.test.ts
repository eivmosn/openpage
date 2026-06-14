import type { RuntimeContext } from '../types/runtime'
import { describe, expect, it, vi } from 'vitest'
import { compileExpressionValue, resolveExpressionValue } from './expression'
import { valueRuntimeHelpers } from './helpers'

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
    ctx: {
      ...valueRuntimeHelpers,
    },
    params: {},
    services: {
      notifyStateChange: vi.fn(),
    },
    state,
  }
}

describe('expression runtime', () => {
  it('returns undefined for invalid expression syntax without throwing', () => {
    const context = createRuntimeContext({
      a: 1,
    })
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    expect(resolveExpressionValue('{{ state.a + }}', context)).toBeUndefined()
    expect(resolveExpressionValue('{{ state.a + }}', context)).toBeUndefined()
    expect(warn).toHaveBeenCalledTimes(1)

    warn.mockRestore()
  })

  it('returns undefined for runtime expression errors without throwing', () => {
    const context = createRuntimeContext({
      user: undefined,
    })
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    expect(resolveExpressionValue('{{ state.user.name }}', context)).toBeUndefined()
    expect(resolveExpressionValue('{{ state.user.name }}', context)).toBeUndefined()
    expect(warn).toHaveBeenCalledTimes(1)

    warn.mockRestore()
  })

  it('resolves missing state identifiers as undefined', () => {
    const context = createRuntimeContext({})

    expect(resolveExpressionValue('{{ ctx.sum(state.a, state.b) }}', context)).toBeUndefined()
  })

  it('keeps helpers, scope and global objects available', () => {
    const context = createRuntimeContext({
      a: 2,
    })

    expect(resolveExpressionValue('{{ ctx.sum(state.a, $event.step, Math.max(1, 3)) }}', context, {
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
      total: '{{ ctx.sum(state.price, state.discount) }}',
    })

    expect(resolveValue(context)).toEqual({
      total: 12,
    })
  })
})
