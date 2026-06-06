/**
 * 获取缓存值，缓存未命中时创建并写入。
 *
 * @param cache 当前缓存容器。
 * @param key 当前缓存键。
 * @param createValue 缓存未命中时的创建函数。
 * @param maxSize 缓存允许保存的最大条目数量。
 * @returns 返回缓存值。
 */
export function getCachedValue<Key, Value>(
  cache: Map<Key, Value>,
  key: Key,
  createValue: () => Value,
  maxSize = 500,
): Value {
  const cachedValue = cache.get(key)

  if (cachedValue !== undefined) {
    return cachedValue
  }

  const value = createValue()

  if (cache.size >= maxSize) {
    const oldestKey = cache.keys().next().value

    if (oldestKey !== undefined) {
      cache.delete(oldestKey)
    }
  }

  cache.set(key, value)
  return value
}
