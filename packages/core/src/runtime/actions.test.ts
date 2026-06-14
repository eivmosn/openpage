import type { RuntimeContext } from '../types/runtime'
import { describe, expect, it, vi } from 'vitest'
import { runActions } from './actions'

/**
 * 创建运行事件动作所需的最小上下文。
 *
 * @param state 当前测试状态对象。
 * @returns 返回可执行脚本事件的运行时上下文。
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
    ctx: {},
    params: {},
    services: {
      message: {
        error: vi.fn(),
      },
      notifyStateChange: vi.fn(),
    },
    state,
  }
}

describe('runActions', () => {
  it('runs script events through script-runner and notifies state changes', async () => {
    const context = createRuntimeContext({
      form: {
        count: 1,
        submitted: '',
      },
    })

    await runActions(`
      state.form.count += $event.step
      state.form.submitted = $event.name
    `, context, { name: 'main-submit', step: 2 })

    expect(context.state.form).toEqual({
      count: 3,
      submitted: 'main-submit',
    })
    expect(context.services.notifyStateChange).toHaveBeenCalledTimes(1)
    expect(context.services.message?.error).not.toHaveBeenCalled()
  })

  it('keeps script errors inside the action boundary and rolls back state writes', async () => {
    const context = createRuntimeContext({
      form: {
        count: 1,
      },
    })

    await expect(runActions(`
      state.form.count = 9
      throw new Error('boom')
    `, context)).resolves.toBeUndefined()

    expect(context.state.form).toEqual({
      count: 1,
    })
    expect(context.services.notifyStateChange).not.toHaveBeenCalled()
    expect(context.services.message?.error).toHaveBeenCalledWith('OpenPage script runtime error: boom')
  })

  it('uses ctx.validate for form validation', async () => {
    const context = createRuntimeContext({
      submitted: false,
    })

    context.services.form = {
      reset: () => true,
      validate: () => false,
    }
    context.ctx.validate = async () => {
      context.services.message?.error?.('请填写用户名')
      return false
    }

    await runActions(`
      const valid = await ctx.validate()
      if (!valid) return
      state.submitted = true
    `, context)

    expect(context.state.submitted).toBe(false)
    expect(context.services.message?.error).toHaveBeenCalledWith('请填写用户名')
  })
})
