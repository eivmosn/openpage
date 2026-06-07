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

const expressionCache = new Map<string, ExpressionRunner>()

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

  const trimmedValue = value.trim()
  return trimmedValue.startsWith('{{') && trimmedValue.endsWith('}}')
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
 * 计算任意配置值。
 *
 * @param value 需要计算的配置值。
 * @param context 当前渲染器运行时上下文。
 * @param scope 当前表达式的局部变量。
 * @returns 返回计算后的配置值。
 */
export function evaluateValue(
  value: unknown,
  context: RuntimeContext,
  scope: Record<string, unknown> = {},
): unknown {
  if (isTemplateExpression(value)) {
    return evaluateExpression(value, context, scope)
  }

  if (Array.isArray(value)) {
    return value.map(item => evaluateValue(item, context, scope))
  }

  if (isPlainRecord(value)) {
    return evaluateRecord(value, context, scope)
  }

  return value
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
  return Object.fromEntries(
    Object.entries(record).map(([key, value]) => [key, evaluateValue(value, context, scope)]),
  )
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
    setByPath(context.state, path, evaluateValue(value, context))
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
  return runExpression(context.state, valueRuntimeHelpers, scope)
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
