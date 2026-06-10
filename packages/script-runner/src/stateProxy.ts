import type { ScriptTransaction } from './transaction'
import type { ScriptPath, ScriptPathKey } from './types'

/**
 * 为状态对象创建脚本可访问代理。
 *
 * @param state 原始状态对象。
 * @param transaction 当前脚本事务。
 * @returns 返回状态代理对象。
 */
export function createStateProxy<TState extends Record<string, unknown>>(
  state: TState,
  transaction: ScriptTransaction,
): TState {
  const cache = new WeakMap<object, object>()
  return createObjectProxy(state, [], transaction, cache) as TState
}

/**
 * 创建对象或数组代理。
 *
 * @param target 原始对象或数组。
 * @param path 当前对象所在状态路径。
 * @param transaction 当前脚本事务。
 * @param cache 对象代理缓存，保证同一对象代理稳定。
 * @returns 返回代理对象。
 */
function createObjectProxy(
  target: object,
  path: ScriptPath,
  transaction: ScriptTransaction,
  cache: WeakMap<object, object>,
): object {
  const cachedProxy = cache.get(target)

  if (cachedProxy) {
    return cachedProxy
  }

  const proxy = new Proxy(target, {
    get(currentTarget, key, receiver) {
      if (key === Symbol.unscopables || key === 'then') {
        return undefined
      }

      if (key === 'toJSON') {
        return () => currentTarget
      }

      const nextPath = appendPath(path, key)

      if (nextPath) {
        transaction.recordRead(nextPath)
      }

      const value = Reflect.get(currentTarget, key, receiver)

      if (shouldProxyValue(value)) {
        return createObjectProxy(value, nextPath || path, transaction, cache)
      }

      return value
    },
    set(_currentTarget, key, value) {
      const nextPath = appendPath(path, key)

      if (!nextPath) {
        return false
      }

      transaction.set(nextPath, value)
      return true
    },
    deleteProperty(_currentTarget, key) {
      const nextPath = appendPath(path, key)

      if (!nextPath) {
        return false
      }

      transaction.delete(nextPath)
      return true
    },
    ownKeys(currentTarget) {
      return Reflect.ownKeys(currentTarget)
    },
    has(currentTarget, key) {
      return key in currentTarget
    },
    getOwnPropertyDescriptor(currentTarget, key) {
      const descriptor = Reflect.getOwnPropertyDescriptor(currentTarget, key)

      if (!descriptor) {
        return undefined
      }

      return {
        ...descriptor,
        configurable: true,
      }
    },
  })

  cache.set(target, proxy)
  return proxy
}

/**
 * 追加属性键到状态路径。
 *
 * @param path 当前路径。
 * @param key 当前属性键。
 * @returns 返回追加后的路径，symbol 键返回 undefined。
 */
function appendPath(path: ScriptPath, key: PropertyKey): ScriptPath | undefined {
  if (typeof key === 'symbol') {
    return undefined
  }

  return [...path, normalizePathKey(key)]
}

/**
 * 规范化状态路径键。
 *
 * @param key 属性键。
 * @returns 返回状态路径键。
 */
function normalizePathKey(key: string | number): ScriptPathKey {
  if (typeof key === 'number') {
    return key
  }

  return /^\d+$/.test(key) ? Number(key) : key
}

/**
 * 判断值是否需要继续创建深层代理。
 *
 * @param value 需要判断的值。
 * @returns 返回是否需要代理。
 */
function shouldProxyValue(value: unknown): value is object {
  if (!value || typeof value !== 'object') {
    return false
  }

  if (Array.isArray(value)) {
    return true
  }

  return Object.getPrototypeOf(value) === Object.prototype
}
