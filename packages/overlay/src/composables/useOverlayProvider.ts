import type { CSSProperties } from 'vue'
import type { OverlayItem, OverlayProviderProps } from '../types'
import { computed, nextTick, onBeforeUnmount, onMounted, watch } from 'vue'
import { resolveDrawerPosition } from '../core/overlayPosition'
import { isStaticPosition, isViewportOverlayTarget, resolveOverlayTarget } from '../core/overlayTarget'
import { setOverlayZIndex } from '../core/zIndex'
import { formatCssUnit } from '../shared/utils'
import { overlay } from './useOverlay'

export interface OverlayProviderItemView {
  item: OverlayItem
  target: ReturnType<typeof resolveOverlayTarget>
  transitionName: string
  isLocalTarget: boolean
}

/**
 * 管理 OverlayProvider 的共享状态、生命周期和跨实例交互。
 *
 * @param props OverlayProvider 传入的全局配置。
 * @returns 返回模板渲染所需的数据和操作。
 */
export function useOverlayProvider(props: OverlayProviderProps) {
  const positionedTargets = new Map<HTMLElement, string>()
  let previousActiveElement: HTMLElement | undefined

  const activeItems = computed(() => overlay.items)
  const containerStyle = computed<CSSProperties>(() => {
    const style: CSSProperties = {}
    const modalRadius = formatCssUnit(props.modal?.radius)
    const drawerRadius = formatCssUnit(props.drawer?.radius)

    if (modalRadius) {
      style['--overlay-vue-modal-radius'] = modalRadius
    }

    if (drawerRadius) {
      style['--overlay-vue-radius'] = drawerRadius
    }

    return style
  })

  const itemViews = computed<OverlayProviderItemView[]>(() => activeItems.value.map((item) => {
    const target = resolveOverlayTarget(item, props)

    return {
      item,
      target,
      isLocalTarget: !isViewportOverlayTarget(target),
      transitionName: getTransitionName(item),
    }
  }))

  /**
   * 点击遮罩时关闭弹层。
   *
   * @param id 弹层 id。
   */
  function handleMaskClick(id: string): void {
    const item = overlay.items.find(current => current.id === id)

    if (item?.options.maskClosable) {
      overlay.close(id)
    }
  }

  /**
   * 处理弹层离场后的清理。
   *
   * @param id 弹层 id。
   */
  function handleAfterLeave(id: string): void {
    overlay.afterLeave(id)

    if (!activeItems.value.some(item => item.show && !item.settled)) {
      restorePreviousFocus()
    }
  }

  /**
   * 记录打开弹层前的焦点元素。
   */
  function rememberPreviousFocus(): void {
    if (typeof document === 'undefined') {
      return
    }

    const activeElement = document.activeElement

    if (activeElement instanceof HTMLElement && !activeElement.closest('.overlay-vue-panel')) {
      previousActiveElement = activeElement
    }
  }

  /**
   * 恢复弹层打开前的焦点。
   */
  function restorePreviousFocus(): void {
    if (!previousActiveElement?.isConnected) {
      previousActiveElement = undefined
      return
    }

    previousActiveElement.focus()
    previousActiveElement = undefined
  }

  /**
   * 处理键盘关闭交互。
   *
   * @param event 键盘事件。
   */
  function handleKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Escape') {
      return
    }

    const topItem = [...overlay.items]
      .reverse()
      .find(item => item.show && !item.settled && item.options.closeOnEsc)

    if (topItem) {
      overlay.close(topItem.id)
    }
  }

  /**
   * 获取弹层进出场动画名称。
   *
   * @param item 当前弹层实例。
   * @returns 返回 Vue Transition 名称。
   */
  function getTransitionName(item: OverlayItem): string {
    return item.options.type === 'drawer'
      ? `overlay-vue-drawer-${resolveDrawerPosition(item, props)}`
      : 'overlay-vue-modal'
  }

  /**
   * 解析可自动补定位上下文的本地挂载元素。
   *
   * @param target Teleport 挂载目标。
   * @returns 返回可操作的 HTMLElement。
   */
  function resolveLocalTargetElement(target: ReturnType<typeof resolveOverlayTarget>): HTMLElement | undefined {
    if (typeof document === 'undefined' || typeof HTMLElement === 'undefined') {
      return undefined
    }

    if (isViewportOverlayTarget(target)) {
      return undefined
    }

    if (typeof target === 'string') {
      const element = document.querySelector(target)

      return element instanceof HTMLElement ? element : undefined
    }

    return target instanceof HTMLElement ? target : undefined
  }

  /**
   * 为本地挂载目标自动补足定位上下文。
   *
   * @param targets 当前活跃弹层使用到的本地挂载元素。
   */
  function syncLocalTargetPosition(targets: Set<HTMLElement>): void {
    if (typeof window === 'undefined') {
      return
    }

    for (const target of targets) {
      if (positionedTargets.has(target) || !isStaticPosition(window.getComputedStyle(target).position)) {
        continue
      }

      positionedTargets.set(target, target.style.position)
      target.style.position = 'relative'
    }

    for (const [target, previousPosition] of positionedTargets) {
      if (targets.has(target)) {
        continue
      }

      target.style.position = previousPosition
      positionedTargets.delete(target)
    }
  }

  onMounted(() => {
    window.addEventListener('keydown', handleKeydown)
  })

  watch(
    () => props.zIndex,
    value => setOverlayZIndex(value),
    { immediate: true },
  )

  watch(
    itemViews,
    (views) => {
      const targets = new Set<HTMLElement>()

      for (const view of views) {
        const target = resolveLocalTargetElement(view.target)

        if (target) {
          targets.add(target)
        }
      }

      syncLocalTargetPosition(targets)
    },
    { immediate: true },
  )

  watch(
    () => activeItems.value.some(item => item.show && !item.settled),
    (hasVisibleOverlay, hadVisibleOverlay) => {
      if (hasVisibleOverlay && !hadVisibleOverlay) {
        rememberPreviousFocus()
        return
      }

      if (!hasVisibleOverlay && hadVisibleOverlay) {
        void nextTick(restorePreviousFocus)
      }
    },
  )

  onBeforeUnmount(() => {
    window.removeEventListener('keydown', handleKeydown)
    syncLocalTargetPosition(new Set())
    restorePreviousFocus()
  })

  return {
    containerStyle,
    handleAfterLeave,
    handleMaskClick,
    itemViews,
  }
}
