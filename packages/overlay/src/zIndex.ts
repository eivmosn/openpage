const DEFAULT_Z_INDEX = 2000
let overlayZIndex = DEFAULT_Z_INDEX

/**
 * 获取下一组弹层 z-index。
 *
 * @returns 返回遮罩层和内容层 z-index。
 */
export function nextOverlayZIndex(): { mask: number, panel: number } {
  return {
    mask: overlayZIndex,
    panel: overlayZIndex,
  }
}

/**
 * 设置弹层基础 z-index。
 *
 * @param value 新的基础 z-index。
 */
export function setOverlayZIndex(value = DEFAULT_Z_INDEX): void {
  overlayZIndex = value
}

/**
 * 重置弹层基础 z-index。
 *
 * @param value 重置后的基础 z-index。
 */
export function resetOverlayZIndex(value = DEFAULT_Z_INDEX): void {
  setOverlayZIndex(value)
}
