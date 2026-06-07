export interface ValueRuntimeHelpers {
  sum: (...values: unknown[]) => number | undefined
}

export const valueRuntimeHelpers: ValueRuntimeHelpers = {
  sum,
}

/**
 * 对有效数字值求和，所有参数均为空时返回 undefined。
 *
 * @param values 需要参与求和的值列表。
 * @returns 返回求和结果，无有效数字时返回 undefined。
 */
function sum(...values: unknown[]): number | undefined {
  const numbers = values
    .filter(value => value !== undefined && value !== null && value !== '')
    .map(toFiniteNumber)
    .filter(value => value !== undefined)

  if (!numbers.length) {
    return undefined
  }

  return numbers.reduce((total, value) => total + value, 0)
}

/**
 * 将值转换为有限数字。
 *
 * @param value 需要转换的值。
 * @returns 返回有限数字，无法转换时返回 undefined。
 */
function toFiniteNumber(value: unknown): number | undefined {
  const numberValue = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(numberValue) ? numberValue : undefined
}
