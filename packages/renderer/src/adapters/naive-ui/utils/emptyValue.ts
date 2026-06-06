export type NullableStringValue = string | null
export type NullableSelectValue = string | number | null

/**
 * 将业务空字符串转换为 Naive UI 标准空值。
 *
 * @param value 业务侧字段值。
 * @returns 返回 Naive UI 可安全接收的字符串空值。
 */
export function toNaiveNullableString(value: unknown): NullableStringValue {
  if (typeof value !== 'string') {
    return null
  }

  return value.trim() ? value : null
}

/**
 * 将业务空字符串转换为 Naive UI 选择类组件空值。
 *
 * @param value 业务侧字段值。
 * @returns 返回 Naive UI 选择类组件可安全接收的值。
 */
export function toNaiveNullableSelectValue(value: unknown): NullableSelectValue {
  if (typeof value === 'number') {
    return value
  }

  return toNaiveNullableString(value)
}

/**
 * 将 Naive UI 空值转换为业务空字符串。
 *
 * @param value Naive UI 组件上报的值。
 * @returns 返回业务侧使用的字符串空值。
 */
export function toBusinessStringValue(value: NullableStringValue): string {
  return value ?? ''
}

/**
 * 将 Naive UI 选择类组件空值转换为业务空字符串。
 *
 * @param value Naive UI 选择类组件上报的值。
 * @returns 返回业务侧使用的选择值。
 */
export function toBusinessSelectValue(value: NullableSelectValue): string | number {
  return value ?? ''
}
