import type { ScriptTransaction } from './transaction'

export interface CreateScriptScopeOptions {
  state: Record<string, unknown>
  stateProxy: Record<string, unknown>
  helpers?: Record<string, unknown>
  scope?: Record<string, unknown>
  globals?: Record<string, unknown>
  transaction: ScriptTransaction
}

const globalClearInterval = globalThis.clearInterval.bind(globalThis) as typeof globalThis.clearInterval
const globalClearTimeout = globalThis.clearTimeout.bind(globalThis) as typeof globalThis.clearTimeout
const globalSetInterval = globalThis.setInterval.bind(globalThis) as typeof globalThis.setInterval
const globalSetTimeout = globalThis.setTimeout.bind(globalThis) as typeof globalThis.setTimeout
const readonlyScopeKeys = new Set(['$event', 'ctx', 'state'])

const defaultGlobals: Record<string, unknown> = {
  Array,
  Boolean,
  Date,
  Error,
  Infinity,
  JSON,
  Map,
  Math,
  NaN: Number.NaN,
  Number,
  Object,
  Promise,
  RegExp,
  Set,
  String,
  TypeError,
  URL,
  URLSearchParams,
  WeakMap,
  WeakSet,
  clearInterval: globalClearInterval,
  clearTimeout: globalClearTimeout,
  console,
  decodeURIComponent,
  encodeURIComponent,
  isFinite: Number.isFinite,
  isNaN: Number.isNaN,
  parseFloat: Number.parseFloat,
  parseInt: Number.parseInt,
  setInterval: globalSetInterval,
  setTimeout: globalSetTimeout,
  undefined,
}

/**
 * 创建脚本 with 作用域代理。
 *
 * @param options 作用域创建配置。
 * @returns 返回脚本作用域代理。
 */
export function createScriptScope(options: CreateScriptScopeOptions): object {
  const localScope: Record<string, unknown> = {
    ...options.scope,
    state: options.stateProxy,
  }
  const helpers = options.helpers || {}
  const globals = {
    ...defaultGlobals,
    ...options.globals,
  }

  return new Proxy({}, {
    has(_target, key) {
      return key !== Symbol.unscopables
    },
    get(_target, key) {
      if (key === Symbol.unscopables) {
        return undefined
      }

      if (typeof key !== 'string') {
        return undefined
      }

      if (Object.hasOwn(localScope, key)) {
        return localScope[key]
      }

      if (Object.hasOwn(helpers, key)) {
        return createHelperProxy(key, helpers[key], options.transaction)
      }

      if (Object.hasOwn(globals, key)) {
        return globals[key]
      }

      throw new ReferenceError(`${key} is not defined`)
    },
    set(_target, key, value) {
      if (typeof key !== 'string') {
        return false
      }

      if (Object.hasOwn(localScope, key)) {
        if (readonlyScopeKeys.has(key)) {
          throw new TypeError(`${key} is readonly`)
        }

        localScope[key] = value
        return true
      }

      throw new ReferenceError(`${key} is not defined`)
    },
    deleteProperty(_target, key) {
      if (typeof key !== 'string') {
        return false
      }

      if (Object.hasOwn(localScope, key)) {
        if (readonlyScopeKeys.has(key)) {
          throw new TypeError(`${key} is readonly`)
        }

        delete localScope[key]
        return true
      }

      throw new ReferenceError(`${key} is not defined`)
    },
  })
}

/**
 * 为 helper 函数创建调用追踪代理。
 *
 * @param name helper 名称。
 * @param value helper 原始值。
 * @param transaction 当前脚本事务。
 * @returns 返回可追踪的 helper 值。
 */
function createHelperProxy(name: string, value: unknown, transaction: ScriptTransaction): unknown {
  if (typeof value !== 'function') {
    return value
  }

  return (...args: unknown[]) => {
    transaction.recordHelperCall(name)
    return value(...args)
  }
}
