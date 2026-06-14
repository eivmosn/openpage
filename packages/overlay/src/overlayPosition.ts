import type { CSSProperties } from 'vue'
import type { OverlayDrawerPosition, OverlayItem, OverlayModalPosition, OverlayOffset, OverlayProviderDrawerOptions, OverlayProviderModalOptions } from './types'

export interface OverlayPositionOptions {
  modal?: OverlayProviderModalOptions
  drawer?: OverlayProviderDrawerOptions
}

export interface ResolvedModalPlacement {
  className: string
  position: OverlayModalPosition
  style: CSSProperties
}

/**
 * 解析 drawer 的最终位置。
 *
 * @param item 当前弹层实例。
 * @param options OverlayProvider 传入的全局位置配置。
 * @returns 返回单次配置优先后的 drawer 位置。
 */
export function resolveDrawerPosition(item: OverlayItem, options: OverlayPositionOptions): OverlayDrawerPosition {
  if (item.options.position && isDrawerPosition(item.options.position)) {
    return item.options.position
  }

  return options.drawer?.position ?? 'right'
}

/**
 * 解析 modal 的最终位置和偏移样式。
 *
 * @param item 当前弹层实例。
 * @param options OverlayProvider 传入的全局位置配置。
 * @returns 返回 modal 的 class、样式和动画 transform。
 */
export function resolveModalPlacement(item: OverlayItem, options: OverlayPositionOptions): ResolvedModalPlacement {
  const position = resolveModalPosition(item, options)
  const offset = normalizeOffset(item.options.offset ?? options.modal?.offset)
  const style: CSSProperties = {}
  const top = resolveOffsetValue(offset[0])
  const right = resolveOffsetValue(offset[1])
  const bottom = resolveOffsetValue(offset[2])
  const left = resolveOffsetValue(offset[3])

  if (position === 'center') {
    style.left = '50%'
    style.top = top === undefined ? '50%' : `${top}px`

    if (top !== undefined) {
      style.maxHeight = `calc(100vh - ${top + 24}px)`
    }

    return createModalPlacement(position, style, top === undefined ? 'translate(-50%, -50%)' : 'translateX(-50%)')
  }

  if (position === 'top-left') {
    style.left = `${left ?? 24}px`
    style.top = `${top ?? 24}px`
    style.maxHeight = `calc(100vh - ${(top ?? 24) + 24}px)`
    return createModalPlacement(position, style, 'none')
  }

  if (position === 'top-right') {
    style.left = 'auto'
    style.right = `${right ?? 24}px`
    style.top = `${top ?? 24}px`
    style.maxHeight = `calc(100vh - ${(top ?? 24) + 24}px)`
    return createModalPlacement(position, style, 'none')
  }

  if (position === 'bottom-left') {
    style.bottom = `${bottom ?? 24}px`
    style.left = `${left ?? 24}px`
    style.maxHeight = `calc(100vh - ${(bottom ?? 24) + 24}px)`
    style.top = 'auto'
    return createModalPlacement(position, style, 'none')
  }

  if (position === 'bottom-right') {
    style.bottom = `${bottom ?? 24}px`
    style.left = 'auto'
    style.right = `${right ?? 24}px`
    style.maxHeight = `calc(100vh - ${(bottom ?? 24) + 24}px)`
    style.top = 'auto'
    return createModalPlacement(position, style, 'none')
  }

  if (position === 'left') {
    style.left = `${left ?? 24}px`
    style.top = '50%'
    return createModalPlacement(position, style, 'translateY(-50%)')
  }

  if (position === 'right') {
    style.left = 'auto'
    style.right = `${right ?? 24}px`
    style.top = '50%'
    return createModalPlacement(position, style, 'translateY(-50%)')
  }

  style.bottom = `${bottom ?? 24}px`
  style.left = '50%'
  style.top = 'auto'
  return createModalPlacement(position, style, 'translateX(-50%)')
}

/**
 * 判断 drawer 是否横向展示。
 *
 * @param position drawer 位置。
 * @returns 返回 drawer 是否是左右方向。
 */
export function isHorizontalDrawer(position: OverlayDrawerPosition): boolean {
  return position === 'left' || position === 'right'
}

/**
 * 判断传入位置是否属于 drawer。
 *
 * @param position 待判断的位置。
 * @returns 返回是否是 drawer 支持的位置。
 */
function isDrawerPosition(position: string): position is OverlayDrawerPosition {
  return position === 'right' || position === 'left' || position === 'top' || position === 'bottom'
}

/**
 * 解析 modal 的最终位置。
 *
 * @param item 当前弹层实例。
 * @param options OverlayProvider 传入的全局位置配置。
 * @returns 返回单次配置优先后的 modal 位置。
 */
function resolveModalPosition(item: OverlayItem, options: OverlayPositionOptions): OverlayModalPosition {
  return isModalPosition(item.options.position)
    ? item.options.position
    : options.modal?.position ?? 'center'
}

/**
 * 判断传入位置是否属于 modal。
 *
 * @param position 待判断的位置。
 * @returns 返回是否是 modal 支持的位置。
 */
function isModalPosition(position: string | undefined): position is OverlayModalPosition {
  return position === 'center'
    || position === 'top-left'
    || position === 'top-right'
    || position === 'bottom-left'
    || position === 'bottom-right'
    || position === 'left'
    || position === 'right'
    || position === 'bottom'
}

/**
 * 创建 modal 定位结果。
 *
 * @param position modal 位置。
 * @param style 初始定位样式。
 * @param baseTransform 基础 transform。
 * @returns 返回完整 modal 定位结果。
 */
function createModalPlacement(position: OverlayModalPosition, style: CSSProperties, baseTransform: string): ResolvedModalPlacement {
  const cssVariables = style as Record<string, string>
  cssVariables['--op-overlay-modal-transform'] = baseTransform
  cssVariables['--op-overlay-modal-enter-transform'] = joinTransform(baseTransform, 'scale(0.5)')
  cssVariables['--op-overlay-modal-leave-transform'] = joinTransform(baseTransform, 'scale(0.5)')
  cssVariables['--op-overlay-modal-active-transform'] = joinTransform(baseTransform, 'scale(1)')

  return {
    className: `is-modal-position-${position}`,
    position,
    style,
  }
}

/**
 * 拼接基础 transform 和缩放 transform。
 *
 * @param baseTransform 基础位移 transform。
 * @param scaleTransform 缩放 transform。
 * @returns 返回合法 CSS transform。
 */
function joinTransform(baseTransform: string, scaleTransform: string): string {
  return baseTransform === 'none' ? scaleTransform : `${baseTransform} ${scaleTransform}`
}

/**
 * 规范化偏移数组，缺省项保持为空。
 *
 * @param offset 需要规范化的偏移数组。
 * @returns 返回固定四项的偏移数组。
 */
function normalizeOffset(offset?: OverlayOffset): [number | null, number | null, number | null, number | null] {
  return [
    offset?.[0] ?? null,
    offset?.[1] ?? null,
    offset?.[2] ?? null,
    offset?.[3] ?? null,
  ]
}

/**
 * 解析单个偏移值。
 *
 * @param value 传入的偏移值。
 * @returns 返回非负偏移像素；未配置时返回空值。
 */
function resolveOffsetValue(value: number | null): number | undefined {
  return value === null ? undefined : Math.max(0, value)
}
