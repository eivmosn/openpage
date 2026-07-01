import type { OverlayItem, OverlayProviderProps, OverlayTarget } from './types'

/**
 * 解析弹层最终挂载目标。
 *
 * @param item 当前弹层实例。
 * @param options OverlayProvider 传入的全局挂载配置。
 * @returns 返回单次配置优先后的 Teleport 挂载目标。
 */
export function resolveOverlayTarget(item: OverlayItem, options: Pick<OverlayProviderProps, 'drawer' | 'modal'>): OverlayTarget {
  if (item.options.to) {
    return item.options.to
  }

  const providerTarget = item.options.type === 'modal'
    ? options.modal?.to
    : options.drawer?.to

  return providerTarget ?? 'body'
}

/**
 * 判断弹层目标是否应按视口定位。
 *
 * @param target Teleport 挂载目标。
 * @returns 返回是否使用 viewport 作为定位与遮罩范围。
 */
export function isViewportOverlayTarget(target: OverlayTarget): boolean {
  return target === undefined || target === null || target === 'body'
}

/**
 * 判断目标元素是否缺少定位上下文。
 *
 * @param position getComputedStyle 返回的 position 值。
 * @returns 返回是否需要自动补 relative。
 */
export function isStaticPosition(position: string): boolean {
  return position === 'static'
}
