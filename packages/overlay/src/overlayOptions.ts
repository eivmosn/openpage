import type { OverlayOptions, OverlayResolvedOptions } from './types'
import { markRaw } from 'vue'

/** overlay.open 的默认配置。 */
export const defaultOptions: OverlayResolvedOptions = {
  type: 'modal',
  to: undefined,
  title: '',
  width: 520,
  height: '',
  offset: undefined,
  position: undefined,
  radius: undefined,
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
  extra: undefined,
  actionClassName: undefined,
  resizable: true,
  bodyFullHeight: false,
  bodyScrollable: true,
  bodyPadding: true,
  footer: undefined,
}

/**
 * 让弹层承载的外部对象跳过 Vue 深层代理。
 *
 * @param value 需要存入弹层实例的对象。
 * @returns 返回标记为 raw 的同一个对象。
 */
export function markOverlayObjectRaw<T extends object>(value: T): T {
  return markRaw(value)
}

/**
 * 合并弹层默认配置，并忽略调用方传入的 undefined 字段。
 *
 * @param options 调用方传入的弹层配置。
 * @returns 返回完整弹层配置。
 */
export function resolveOverlayOptions(options: OverlayOptions): OverlayResolvedOptions {
  const resolvedOptions = { ...defaultOptions }

  for (const [key, value] of Object.entries(options)) {
    if (value !== undefined) {
      ;(resolvedOptions as Record<string, unknown>)[key] = value
    }
  }

  return resolvedOptions
}
