import type { Component, InjectionKey } from 'vue'
import type { OverlayAction, OverlayConfirmHandler, OverlayContext, OverlayItem, OverlayOptions, OverlayResolvedOptions, OverlayResult } from './types'
import { inject, markRaw, nextTick, reactive } from 'vue'
import { nextOverlayZIndex } from './zIndex'

export const overlayContextKey: InjectionKey<OverlayContext> = Symbol('overlayContext')

const defaultOptions: OverlayResolvedOptions = {
  type: 'modal',
  placement: 'right',
  title: '',
  width: 520,
  height: '',
  minWidth: 320,
  minHeight: 240,
  maskClosable: true,
  closeOnEsc: true,
  closable: true,
  showFooter: true,
  showCancel: true,
  showConfirm: true,
  cancelText: '取消',
  confirmText: '确认',
  fullscreen: true,
  resizable: true,
  bodyFullHeight: false,
  bodyScrollable: true,
  bodyPadding: true,
  footer: undefined,
}

const overlays = reactive<OverlayItem[]>([])

/**
 * 创建弹层实例 id。
 *
 * @returns 返回唯一弹层 id。
 */
function createId(): string {
  return `overlay_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

/**
 * 从弹层列表中移除指定实例。
 *
 * @param id 弹层 id。
 */
function remove(id: string): void {
  const index = overlays.findIndex(item => item.id === id)

  if (index > -1) {
    overlays.splice(index, 1)
  }
}

/**
 * 将指定弹层切换到展示状态。
 *
 * @param id 弹层 id。
 */
function show(id: string): void {
  const item = overlays.find(item => item.id === id)

  if (!item || item.settled) {
    return
  }

  item.show = true
}

/**
 * 完成指定弹层并返回结果。
 *
 * @param id 弹层 id。
 * @param action 用户触发的结束动作。
 * @param value confirm 动作携带的业务值。
 */
function finish<T = unknown>(id: string, action: OverlayAction, value?: T): void {
  const item = overlays.find(item => item.id === id)

  if (!item || item.settled) {
    return
  }

  const wasShown = item.show
  item.settled = true
  item.show = false
  item.resolve({ action, value })

  if (!wasShown) {
    nextTick(() => remove(id))
  }
}

/**
 * 获取当前最上层弹层。
 *
 * @returns 返回最上层弹层实例。
 */
function getTopOverlay(): OverlayItem | undefined {
  return [...overlays]
    .reverse()
    .find(item => item.show && !item.settled)
}

/**
 * 触发指定弹层的确认处理。
 *
 * @param id 弹层 id。
 */
async function triggerConfirm(id: string): Promise<void> {
  const item = overlays.find(item => item.id === id)

  if (!item || item.settled || item.confirmLoading) {
    return
  }

  if (!item.confirmHandler) {
    finish(id, 'confirm')
    return
  }

  item.confirmLoading = true

  try {
    const value = await item.confirmHandler()

    if (value === false) {
      return
    }

    finish(id, 'confirm', value)
  }
  finally {
    const current = overlays.find(item => item.id === id)

    if (current) {
      current.confirmLoading = false
    }
  }
}

export const overlay = {
  items: overlays,

  /**
   * 打开一个 overlay 弹层。
   *
   * @param component 要渲染到弹层 body 内的 Vue 组件。
   * @param props 传给弹层 body 组件的 props。
   * @param options 弹层配置，例如 type、title、width、showFooter、bodyFullHeight 等。
   * @returns Promise，弹层关闭后返回用户动作和确认值。
   */
  open<T = unknown>(
    component: Component,
    props: Record<string, unknown> = {},
    options: OverlayOptions = {},
  ): Promise<OverlayResult<T>> {
    const id = createId()
    const zIndex = nextOverlayZIndex()

    return new Promise<OverlayResult<T>>((resolve) => {
      const item: OverlayItem = {
        id,
        show: false,
        settled: false,
        confirmLoading: false,
        component: markRaw(component),
        props,
        options: {
          ...defaultOptions,
          ...options,
        },
        zIndex: zIndex.mask,
        panelZIndex: zIndex.panel,
        resolve: resolve as OverlayItem['resolve'],
      }

      overlays.push(item)
      nextTick(() => show(id))
    })
  },

  /**
   * 关闭指定弹层；不传 id 时关闭最上层弹层。
   *
   * @param id 可选的弹层 id。
   */
  close(id?: string): void {
    const targetId = id ?? getTopOverlay()?.id

    if (targetId) {
      finish(targetId, 'close')
    }
  },

  /**
   * 取消指定弹层。
   *
   * @param id 弹层 id。
   */
  cancel(id: string): void {
    finish(id, 'cancel')
  },

  /**
   * 确认指定弹层。
   *
   * @param id 弹层 id。
   * @param value 确认时返回给调用方的数据。
   */
  confirm<T = unknown>(id: string, value?: T): void {
    finish(id, 'confirm', value)
  },

  triggerConfirm,

  /**
   * 设置指定弹层确认按钮的 loading 状态。
   *
   * @param id 弹层 id。
   * @param loading 是否显示 loading。
   */
  setConfirmLoading(id: string, loading: boolean): void {
    const item = overlays.find(item => item.id === id)

    if (item) {
      item.confirmLoading = loading
    }
  },

  /**
   * 设置或清空指定弹层的确认处理函数。
   *
   * @param id 弹层 id。
   * @param handler 确认处理函数；不传时清空。
   */
  setConfirmHandler<T = unknown>(id: string, handler?: OverlayConfirmHandler<T>): void {
    const item = overlays.find(item => item.id === id)

    if (item) {
      item.confirmHandler = handler as OverlayConfirmHandler | undefined
    }
  },

  /**
   * 弹层离场动画结束后移除实例。
   *
   * @param id 弹层 id。
   */
  afterLeave(id: string): void {
    remove(id)
  },

  /** 关闭所有弹层。 */
  closeAll(): void {
    overlays.slice().forEach(item => finish(item.id, 'close'))
  },
}

/** 获取全局 overlay 控制器。 */
export function useOverlay(): typeof overlay {
  return overlay
}

/**
 * 获取当前弹层 body 组件内的上下文控制器。
 *
 * @returns 返回当前弹层上下文控制器。
 */
export function useOverlayContext<T = unknown>(): OverlayContext<T> {
  const context = inject<OverlayContext<T> | null>(overlayContextKey, null)

  if (!context) {
    throw new Error('useOverlayContext must be used inside an overlay component.')
  }

  return context
}
