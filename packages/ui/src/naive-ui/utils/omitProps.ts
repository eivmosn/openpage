/**
 * 从对象中剔除指定 key，返回新的浅拷贝对象。
 *
 * @param props 需要剔除字段的源对象。
 * @param keys 需要从源对象中剔除的字段列表。
 * @returns 返回不包含指定字段的新对象。
 */
export function omitProps<const T extends Record<string, unknown>, const K extends keyof T>(
  props: T,
  keys: readonly K[],
): Omit<T, K> {
  const result = { ...props }

  for (const key of keys) {
    delete result[key]
  }

  return result
}
