import type { ScriptRunner, ScriptRunOptions, ScriptRunResult } from './types'
import { compileScript } from './compiler'
import { createScriptExecutionError } from './error'
import { createScriptScope } from './scope'
import { createStateProxy } from './stateProxy'
import { ScriptTransaction } from './transaction'

/**
 * 执行脚本字符串或已编译脚本。
 *
 * 脚本会在代理作用域中运行，可直接读写 options.state 顶层字段，
 * 也可以直接调用 options.helpers 提供的方法。默认情况下，脚本报错
 * 不会向外冒泡，而是返回失败结果并回滚本次写入。
 *
 * @param script 脚本字符串或已编译脚本函数。
 * @param options 脚本执行配置，包括 state、helpers、scope、debug 等。
 * @returns 返回脚本执行结果。
 */
export async function runScript<
  TState extends Record<string, unknown>,
  THelpers extends Record<string, unknown> = Record<string, unknown>,
>(
  script: string | ScriptRunner,
  options: ScriptRunOptions<TState, THelpers>,
): Promise<ScriptRunResult> {
  const startedAt = getCurrentTime()
  let transaction: ScriptTransaction | undefined

  try {
    const runner = typeof script === 'string' ? compileScript(script) : script
    transaction = new ScriptTransaction({
      state: options.state,
      debug: options.debug,
    })

    const stateProxy = createStateProxy(options.state, transaction)
    const scope = createScriptScope({
      state: options.state,
      stateProxy,
      helpers: options.helpers,
      scope: options.scope,
      globals: options.globals,
      transaction,
    })

    const value = await runner(scope)
    transaction.commit()

    return createResult({
      ok: true,
      value,
      transaction,
      duration: getCurrentTime() - startedAt,
      debug: options.debug,
    })
  }
  catch (error) {
    const phase = transaction ? 'runtime' : 'compile'
    const wrappedError = createScriptExecutionError(phase, error, options.formatErrorMessage)

    if (transaction && options.transaction !== false) {
      transaction.rollback()
    }
    else {
      transaction?.close()
    }

    if (options.throwOnError) {
      throw wrappedError
    }

    return createResult({
      ok: false,
      error: wrappedError,
      transaction,
      duration: getCurrentTime() - startedAt,
      debug: options.debug,
    })
  }
}

interface CreateResultOptions {
  ok: boolean
  value?: unknown
  error?: Error
  transaction?: ScriptTransaction
  duration: number
  debug?: boolean
}

/**
 * 创建标准脚本执行结果。
 *
 * @param options 结果创建配置。
 * @returns 返回脚本执行结果。
 */
function createResult(options: CreateResultOptions): ScriptRunResult {
  return {
    ok: options.ok,
    value: options.value,
    error: options.error,
    patches: options.transaction?.getPatches() || [],
    reads: options.debug ? options.transaction?.getReads() || [] : undefined,
    helperCalls: options.debug ? options.transaction?.getHelperCalls() || [] : undefined,
    duration: options.duration,
  }
}

/**
 * 获取当前高精度时间。
 *
 * @returns 返回当前时间戳。
 */
function getCurrentTime(): number {
  return globalThis.performance?.now() || Date.now()
}
