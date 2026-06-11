import type { RuntimeContext } from '../types/runtime'
import type { ValueRuntimeHelpers } from './helpers'
import { getCachedValue } from '../utils/cache'
import { setByPath } from '../utils/path'
import { valueRuntimeHelpers } from './helpers'

type ExpressionRunner = (
  state: Record<string, unknown>,
  helpers: ValueRuntimeHelpers,
  scope: Record<string, unknown>,
) => unknown

export type ExpressionValueResolver = (
  context: RuntimeContext,
  scope?: Record<string, unknown>,
) => unknown

const expressionCache = new Map<string, ExpressionRunner>()
const stateScopeCache = new WeakMap<Record<string, unknown>, Record<string, unknown>>()

/**
 * 判断配置值是否为模板表达式。
 *
 * @param value 需要判断的配置值。
 * @returns 返回是否为模板表达式。
 */
export function isTemplateExpression(value: unknown): value is string {
  if (typeof value !== 'string') {
    return false
  }

  return parseTemplateExpression(value) !== undefined
}

/**
 * 判断任意配置值中是否包含模板表达式。
 *
 * @param value 需要判断的配置值。
 * @returns 返回值本身或嵌套结构中是否包含模板表达式。
 */
export function hasTemplateExpression(value: unknown): boolean {
  if (isTemplateExpression(value)) {
    return true
  }

  if (Array.isArray(value)) {
    return value.some(item => hasTemplateExpression(item))
  }

  if (isPlainRecord(value)) {
    return Object.values(value).some(item => hasTemplateExpression(item))
  }

  return false
}

/**
 * 解析模板表达式内容。
 *
 * @param value 模板表达式字符串。
 * @returns 返回表达式内容。
 */
export function parseTemplateExpression(value: string): string | undefined {
  const trimmedValue = value.trim()

  if (!trimmedValue.startsWith('{{') || !trimmedValue.endsWith('}}')) {
    return undefined
  }

  return trimmedValue.slice(2, -2).trim()
}

/**
 * 解析任意配置值中的模板表达式。
 *
 * @param value 需要解析的配置值。
 * @param context 当前渲染器运行时上下文。
 * @param scope 当前表达式的局部变量。
 * @returns 返回解析后的配置值。
 */
export function resolveExpressionValue(
  value: unknown,
  context: RuntimeContext,
  scope: Record<string, unknown> = {},
): unknown {
  if (isTemplateExpression(value)) {
    return evaluateExpression(value, context, scope)
  }

  if (Array.isArray(value)) {
    return value.map(item => resolveExpressionValue(item, context, scope))
  }

  if (isPlainRecord(value)) {
    return evaluateRecord(value, context, scope)
  }

  return value
}

/**
 * 将配置值编译为可复用的运行时解析函数。
 *
 * @param value 需要编译的配置值。
 * @returns 返回运行时可直接执行的值解析函数。
 */
export function compileExpressionValue(value: unknown): ExpressionValueResolver {
  if (typeof value === 'string') {
    const expression = parseTemplateExpression(value)

    if (expression) {
      const runExpression = getCachedValue(expressionCache, expression, () => compileExpression(expression))
      return (context, scope = {}) => runExpression(createStateScope(context.state), valueRuntimeHelpers, scope)
    }
  }

  if (Array.isArray(value)) {
    const itemResolvers = value.map(item => compileExpressionValue(item))
    return (context, scope = {}) => itemResolvers.map(resolveItem => resolveItem(context, scope))
  }

  if (isPlainRecord(value)) {
    const entries = Object.entries(value).map(([key, entryValue]) => [
      key,
      compileExpressionValue(entryValue),
    ] as const)

    return (context, scope = {}) => {
      const resolvedRecord: Record<string, unknown> = {}

      for (const [key, resolveEntry] of entries) {
        resolvedRecord[key] = resolveEntry(context, scope)
      }

      return resolvedRecord
    }
  }

  return () => value
}

/**
 * 计算对象配置。
 *
 * @param record 需要计算的对象配置。
 * @param context 当前渲染器运行时上下文。
 * @param scope 当前表达式的局部变量。
 * @returns 返回计算后的对象配置。
 */
export function evaluateRecord(
  record: Record<string, unknown>,
  context: RuntimeContext,
  scope: Record<string, unknown> = {},
): Record<string, unknown> {
  const evaluatedRecord: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(record)) {
    evaluatedRecord[key] = resolveExpressionValue(value, context, scope)
  }

  return evaluatedRecord
}

/**
 * 执行 set 映射配置。
 *
 * @param setters set 映射配置。
 * @param context 当前渲染器运行时上下文。
 */
export function runSetters(setters: Record<string, unknown> | undefined, context: RuntimeContext): void {
  if (!setters) {
    return
  }

  for (const [path, value] of Object.entries(setters)) {
    setByPath(context.state, path, resolveExpressionValue(value, context))
  }

  context.services.notifyStateChange()
}

/**
 * 计算模板表达式。
 *
 * @param value 模板表达式字符串。
 * @param context 当前渲染器运行时上下文。
 * @param scope 当前表达式的局部变量。
 * @returns 返回表达式计算结果。
 */
function evaluateExpression(
  value: string,
  context: RuntimeContext,
  scope: Record<string, unknown>,
): unknown {
  const expression = parseTemplateExpression(value)

  if (!expression) {
    return value
  }

  const runExpression = getCachedValue(expressionCache, expression, () => compileExpression(expression))
  return runExpression(createStateScope(context.state), valueRuntimeHelpers, scope)
}

/**
 * 创建表达式专用 State 作用域。
 *
 * 低代码表达式允许直接写 `a + b`，字段初始化前缺失变量应解析为 undefined，
 * 但不能遮蔽 Math、Date 等全局对象，也不能遮蔽函数入参 state/helpers/scope。
 *
 * @param state 当前运行时状态对象。
 * @returns 返回带缺失变量兜底能力的 State 代理。
 */
function createStateScope(state: Record<string, unknown>): Record<string, unknown> {
  const cachedScope = stateScopeCache.get(state)

  if (cachedScope) {
    return cachedScope
  }

  const stateScope = new Proxy(state, {
    has(target, key) {
      if (typeof key === 'symbol') {
        return Reflect.has(target, key)
      }

      if (Reflect.has(target, key)) {
        return true
      }

      if (isReservedExpressionIdentifier(key) || Reflect.has(globalThis, key)) {
        return false
      }

      return true
    },
  })

  stateScopeCache.set(state, stateScope)
  return stateScope
}

/**
 * 判断标识符是否应交给函数词法作用域或全局作用域解析。
 *
 * @param key 当前表达式标识符。
 * @returns 返回是否为表达式执行器保留标识符。
 */
function isReservedExpressionIdentifier(key: string): boolean {
  return key === 'state' || key === 'helpers' || key === 'scope'
}

/**
 * 编译模板表达式执行函数。
 *
 * @param expression 模板表达式内容。
 * @returns 返回可复用的表达式执行函数。
 */
function compileExpression(expression: string): ExpressionRunner {
  // eslint-disable-next-line no-new-func
  return new Function(
    'state',
    'helpers',
    'scope',
    `with (state) { with (helpers) { with (scope) { return (${expression}) } } }`,
  ) as ExpressionRunner
}

/**
 * 判断配置值是否为普通对象。
 *
 * @param value 需要判断的配置值。
 * @returns 返回是否为普通对象。
 */
function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype
}
