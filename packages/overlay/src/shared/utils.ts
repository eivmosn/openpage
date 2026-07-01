/**
 * 将数字或 CSS 长度转换为样式值。
 *
 * @param value 需要格式化的尺寸值。
 * @returns 返回可用于 CSS 的尺寸字符串。
 */
export function formatCssUnit(value?: number | string): string {
  if (value === undefined || value === null || value === '') {
    return ''
  }

  return typeof value === 'number' ? `${value}px` : value
}

/**
 * 将数值限制在指定区间。
 *
 * @param value 需要限制的数值。
 * @param minimum 最小值。
 * @param maximum 最大值。
 * @returns 返回限制后的数值。
 */
export function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), Math.max(minimum, maximum))
}

/**
 * 判断点击目标是否是交互控件。
 *
 * @param target 事件目标。
 * @returns 返回目标是否位于交互控件内。
 */
export function isInteractiveTarget(target: EventTarget | null): boolean {
  return target instanceof Element && Boolean(target.closest('button, a, input, textarea, select, [role="button"]'))
}
