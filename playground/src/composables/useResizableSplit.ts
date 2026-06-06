import type { ComputedRef, Ref } from 'vue'
import { computed, onBeforeUnmount, shallowRef } from 'vue'

export interface UseResizableSplitOptions {
  defaultPercent?: number
  maxPercent?: number
  minPercent?: number
}

export interface ResizableSplit {
  isResizing: Ref<boolean>
  leftPanelStyle: ComputedRef<Record<string, string>>
  startResize: (event: PointerEvent) => void
}

/**
 * 创建水平方向可拖拽分屏状态。
 *
 * @param container 分屏容器元素引用。
 * @param options 分屏默认值和宽度边界。
 * @returns 返回左侧样式和拖拽控制方法。
 */
export function useResizableSplit(
  container: Ref<HTMLElement | null>,
  options: UseResizableSplitOptions = {},
): ResizableSplit {
  const minPercent = options.minPercent ?? 22
  const maxPercent = options.maxPercent ?? 52
  const leftPercent = shallowRef(options.defaultPercent ?? 34)
  const isResizing = shallowRef(false)
  const leftPanelStyle = computed(() => ({
    width: `${leftPercent.value}%`,
  }))

  /**
   * 根据指针位置更新左侧面板宽度。
   *
   * @param event 当前指针移动事件。
   */
  function handlePointerMove(event: PointerEvent): void {
    const element = container.value

    if (!element) {
      return
    }

    const rect = element.getBoundingClientRect()
    const nextPercent = ((event.clientX - rect.left) / rect.width) * 100
    leftPercent.value = Math.min(maxPercent, Math.max(minPercent, nextPercent))
  }

  /**
   * 停止当前拖拽并释放全局事件。
   */
  function stopResize(): void {
    isResizing.value = false
    window.removeEventListener('pointermove', handlePointerMove)
    window.removeEventListener('pointerup', stopResize)
  }

  /**
   * 开始拖拽分割线。
   *
   * @param event 分割线上的指针按下事件。
   */
  function startResize(event: PointerEvent): void {
    if (window.matchMedia('(max-width: 900px)').matches) {
      return
    }

    event.preventDefault()
    isResizing.value = true
    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', stopResize)
  }

  onBeforeUnmount(stopResize)

  return {
    isResizing,
    leftPanelStyle,
    startResize,
  }
}
