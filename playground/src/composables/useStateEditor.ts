import type { ShallowRef } from 'vue'
import { onBeforeUnmount, shallowRef, watch } from 'vue'

export interface StateEditorState {
  source: ShallowRef<string>
  state: ShallowRef<Record<string, unknown>>
  syncStateSource: (state: Record<string, unknown>) => void
}

/**
 * 创建支持双向同步的 State JSON 编辑状态。
 *
 * @param initialState 编辑器初始状态。
 * @returns 返回 State、JSON 文本和运行时同步方法。
 */
export function useStateEditor(initialState: Record<string, unknown>): StateEditorState {
  const source = shallowRef(stringifyState(initialState))
  const state = shallowRef(initialState)
  let parseTimer: ReturnType<typeof setTimeout> | undefined
  let syncingRuntimeState = false

  /**
   * 解析编辑器 JSON 并更新有效 State。
   *
   * @param value 当前编辑器 JSON 文本。
   */
  function parseState(value: string): void {
    try {
      state.value = JSON.parse(value) as Record<string, unknown>
    }
    catch {
      // 保留最后一次有效 State，直到 JSON 再次可解析。
    }
  }

  /**
   * 将 Renderer 的最新运行时 State 同步到编辑器。
   *
   * @param nextState Renderer 上报的最新 State。
   */
  function syncStateSource(nextState: Record<string, unknown>): void {
    state.value = nextState
    syncingRuntimeState = true
    source.value = stringifyState(nextState)
    syncingRuntimeState = false
  }

  watch(
    source,
    (value) => {
      if (syncingRuntimeState) {
        return
      }

      clearTimeout(parseTimer)
      parseTimer = setTimeout(parseState, 180, value)
    },
    {
      flush: 'sync',
    },
  )

  onBeforeUnmount(() => {
    clearTimeout(parseTimer)
  })

  return {
    source,
    state,
    syncStateSource,
  }
}

/**
 * 将 State 格式化为编辑器 JSON 文本。
 *
 * @param state 需要格式化的 State。
 * @returns 返回格式化后的 JSON 文本。
 */
function stringifyState(state: Record<string, unknown>): string {
  return JSON.stringify(state, null, 2)
}
