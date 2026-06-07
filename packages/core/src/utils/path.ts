import { getCachedValue } from './cache'

/**
 * 通过点路径读取对象上的值。
 * 支持：
 * form.username
 * form.table[0].username
 * form.table[0].children[1].name
 *
 * @param source 需要读取的源对象。
 * @param path 点分隔的数据路径。
 * @returns 返回路径对应的值，路径不存在时返回 undefined。
 */

type PathKey = string | number

type PathTarget = Record<string, unknown> | unknown[]

const UNSAFE_KEYS = new Set(['__proto__', 'prototype', 'constructor'])
const pathCache = new Map<string, readonly PathKey[]>()

export function getByPath(
  source: Record<string, unknown>,
  path: string,
): unknown {
  const keys = parsePath(path)

  return keys.reduce<unknown>((current, key) => {
    if (isUnsafeKey(key)) {
      return undefined
    }

    if (current !== null && typeof current === 'object') {
      return (current as Record<string, unknown> | unknown[])[key as never]
    }

    return undefined
  }, source)
}

function parsePath(path: string): readonly PathKey[] {
  return getCachedValue(pathCache, path, () => createPathKeys(path))
}

/**
 * 解析数据路径键列表。
 *
 * @param path 点分隔的数据路径。
 * @returns 返回只读路径键列表。
 */
function createPathKeys(path: string): readonly PathKey[] {
  const keys: PathKey[] = []

  const regexp = /([^[.\]]+)|\[(\d+)\]/g

  path.replace(regexp, (_, key: string, index: string) => {
    if (index !== undefined) {
      keys.push(Number(index))
    }
    else {
      keys.push(key)
    }

    return ''
  })

  return Object.freeze(keys)
}

function isObject(value: unknown): value is PathTarget {
  return value !== null && typeof value === 'object'
}

function isUnsafeKey(key: PathKey): boolean {
  return typeof key === 'string' && UNSAFE_KEYS.has(key)
}

function setTargetValue(
  target: PathTarget,
  key: PathKey,
  value: unknown,
): void {
  ;(target as Record<string | number, unknown>)[key] = value
}

/**
 * 通过点路径写入对象值，缺失的中间对象会自动创建。
 * 支持 form.table[0].children[1].name 这样的路径，数组会在遇到数字 key 时自动创建。
 *
 * @param source 需要写入的目标对象。
 * @param path 点分隔的数据路径。
 * @param value 需要写入的新值。
 */
export function setByPath(
  source: Record<string, unknown>,
  path: string,
  value: unknown,
): void {
  const keys = parsePath(path)

  if (!keys.length) {
    return
  }

  let current: PathTarget = source

  for (let index = 0; index < keys.length; index++) {
    const key = keys[index]

    if (isUnsafeKey(key)) {
      return
    }

    const isLast = index === keys.length - 1

    if (isLast) {
      current[key as keyof PathTarget] = value as never
      return
    }

    const nextKey = keys[index + 1]

    const currentValue = current[key as keyof PathTarget]

    if (!isObject(currentValue)) {
      setTargetValue(
        current,
        key,
        typeof nextKey === 'number' ? [] : {},
      )
    }

    current = current[key as keyof PathTarget] as PathTarget
  }
}
