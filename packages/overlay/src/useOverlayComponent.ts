import type { OverlayComponentEmit, OverlayComponentProps, OverlayComponentSlots, OverlayOptions, OverlayResult, OverlayType } from './types'
import { onBeforeUnmount, watch } from 'vue'
import OverlaySlotContent from './OverlaySlotContent'
import { overlay } from './useOverlay'

interface UseOverlayComponentOptions {
  type: OverlayType
  props: OverlayComponentProps & { modelValue?: boolean }
  emit: OverlayComponentEmit
  slots: Readonly<OverlayComponentSlots>
}

/**
 * 为组件式 Modal/Drawer 创建打开、关闭和事件同步逻辑。
 *
 * @param options 组件式弹层运行参数。
 */
export function useOverlayComponent(options: UseOverlayComponentOptions): void {
  let activeId: string | undefined
  let closingFromModel = false

  /**
   * 创建当前组件 props 对应的 overlay.open 配置。
   *
   * @returns 返回单次弹层配置。
   */
  function createOverlayOptions(): OverlayOptions {
    return {
      type: options.type,
      to: options.props.to,
      title: options.props.title,
      width: options.props.width,
      height: options.props.height,
      radius: options.props.radius,
      position: options.props.position,
      offset: options.props.offset,
      minWidth: options.props.minWidth,
      minHeight: options.props.minHeight,
      maskClosable: options.props.maskClosable,
      closeOnEsc: options.props.closeOnEsc,
      closable: options.props.closable,
      showFooter: options.props.showFooter,
      showCancel: options.props.showCancel,
      showConfirm: options.props.showConfirm,
      cancelText: options.props.cancelText,
      confirmText: options.props.confirmText,
      fullscreen: options.props.fullscreen,
      extra: options.props.extra ?? options.slots.extra,
      actionClassName: options.props.actionClassName,
      resizable: options.props.resizable,
      bodyFullHeight: options.props.bodyFullHeight,
      bodyScrollable: options.props.bodyScrollable,
      bodyPadding: options.props.bodyPadding,
      footer: options.props.footer ?? options.slots.footer,
    }
  }

  /** 打开当前组件对应的弹层实例。 */
  function openOverlay(): void {
    if (activeId) {
      return
    }

    const controller = overlay.openWithController(
      OverlaySlotContent,
      { render: () => options.slots.default?.() },
      createOverlayOptions(),
    )

    activeId = controller.id
    void controller.result.then(handleOverlayResult)
  }

  /** 关闭当前组件对应的弹层实例。 */
  function closeOverlay(): void {
    if (!activeId) {
      return
    }

    closingFromModel = true
    overlay.close(activeId)
  }

  /**
   * 处理弹层关闭结果并同步组件事件。
   *
   * @param result 弹层关闭结果。
   */
  function handleOverlayResult(result: OverlayResult): void {
    activeId = undefined

    if (options.props.modelValue) {
      options.emit('update:modelValue', false)
    }

    options.emit('afterClose', result)

    if (result.action === 'close') {
      options.emit('close', result)
      return
    }

    if (result.action === 'cancel') {
      options.emit('cancel', result)
      return
    }

    options.emit('confirm', result)
  }

  watch(
    () => options.props.modelValue,
    (visible) => {
      if (visible) {
        closingFromModel = false
        openOverlay()
        return
      }

      if (closingFromModel) {
        closingFromModel = false
        return
      }

      closeOverlay()
    },
    { immediate: true },
  )

  onBeforeUnmount(() => {
    closeOverlay()
  })
}
