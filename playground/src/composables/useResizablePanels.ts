import type { ComputedRef, Ref } from 'vue'
import { computed, onBeforeUnmount, shallowRef } from 'vue'

export interface ResizablePanels {
  activeDivider: Ref<number | undefined>
  gridTemplateColumns: ComputedRef<string>
  isResizing: Ref<boolean>
  startResize: (dividerIndex: number, event: PointerEvent) => void
}

/**
 * 创建三栏水平方向可拖拽面板状态。
 *
 * @param container 三栏面板容器元素引用。
 * @returns 返回网格列宽、拖拽状态和开始拖拽方法。
 */
export function useResizablePanels(container: Ref<HTMLElement | null>): ResizablePanels {
  const panelPercents = shallowRef<[number, number, number]>([25, 50, 25])
  const activeDivider = shallowRef<number>()
  const isResizing = computed(() => activeDivider.value !== undefined)
  const gridTemplateColumns = computed(() => (
    `${panelPercents.value[0]}fr 2px ${panelPercents.value[1]}fr 2px ${panelPercents.value[2]}fr`
  ))

  /**
   * 根据指针位置调整分割线相邻面板宽度。
   *
   * @param event 当前指针移动事件。
   */
  function handlePointerMove(event: PointerEvent): void {
    const element = container.value
    const dividerIndex = activeDivider.value

    if (!element || dividerIndex === undefined) {
      return
    }

    const rect = element.getBoundingClientRect()
    const pointerPercent = ((event.clientX - rect.left) / rect.width) * 100
    const [left, center, right] = panelPercents.value

    if (dividerIndex === 0) {
      const pairTotal = left + center
      const nextLeft = clamp(pointerPercent, 15, pairTotal - 20)
      panelPercents.value = [nextLeft, pairTotal - nextLeft, right]
      return
    }

    const pairTotal = center + right
    const nextCenter = clamp(pointerPercent - left, 20, pairTotal - 15)
    panelPercents.value = [left, nextCenter, pairTotal - nextCenter]
  }

  /**
   * 停止拖拽并释放全局事件。
   */
  function stopResize(): void {
    activeDivider.value = undefined
    window.removeEventListener('pointermove', handlePointerMove)
    window.removeEventListener('pointerup', stopResize)
  }

  /**
   * 开始拖拽指定分割线。
   *
   * @param dividerIndex 分割线索引，0 为左侧，1 为右侧。
   * @param event 分割线上的指针按下事件。
   */
  function startResize(dividerIndex: number, event: PointerEvent): void {
    if (window.matchMedia('(max-width: 1100px)').matches) {
      return
    }

    event.preventDefault()
    activeDivider.value = dividerIndex
    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', stopResize)
  }

  onBeforeUnmount(stopResize)

  return {
    activeDivider,
    gridTemplateColumns,
    isResizing,
    startResize,
  }
}

/**
 * 将数值限制在指定区间内。
 *
 * @param value 需要限制的数值。
 * @param minimum 最小值。
 * @param maximum 最大值。
 * @returns 返回限制后的数值。
 */
function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value))
}
