/**
 * 脚本状态路径中的单段键名。
 */
export type ScriptPathKey = string | number

/**
 * 脚本访问或写入状态时形成的路径。
 */
export type ScriptPath = ScriptPathKey[]

/**
 * 脚本对状态产生的变更类型。
 */
export type ScriptPatchType = 'set' | 'delete'

/**
 * 脚本执行期间记录到的一次状态变更。
 */
export interface StatePatch {
  /**
   * 状态变更类型。
   */
  type: ScriptPatchType

  /**
   * 被变更的状态路径。
   */
  path: ScriptPath

  /**
   * 新值，仅 set 类型存在。
   */
  value?: unknown

  /**
   * 变更前的旧值，用于调试和失败回滚。
   */
  oldValue?: unknown
}

/**
 * 编译后的脚本执行函数。
 */
export interface ScriptRunner {
  /**
   * 使用指定作用域执行脚本。
   *
   * @param scope 脚本 with 作用域代理。
   * @returns 返回脚本执行结果。
   */
  (scope: object): Promise<unknown>
}

/**
 * 脚本编译配置。
 */
export interface CompileScriptOptions {
  /**
   * 编译缓存。默认使用包内置全局缓存；传 false 时禁用缓存。
   */
  cache?: Map<string, ScriptRunner> | false
}

/**
 * 脚本错误发生阶段。
 */
export type ScriptExecutionPhase = 'compile' | 'runtime'

/**
 * 脚本错误格式化上下文。
 */
export interface ScriptErrorMessageContext {
  /**
   * 错误发生阶段。
   */
  phase: ScriptExecutionPhase

  /**
   * 原始错误对象。
   */
  error: unknown

  /**
   * 从原始错误中提取出的基础错误文案。
   */
  message: string
}

/**
 * 自定义脚本错误文案格式化方法。
 */
export interface ScriptErrorMessageFormatter {
  /**
   * 根据错误上下文返回最终错误文案。
   *
   * @param context 错误格式化上下文。
   * @returns 返回最终错误文案。
   */
  (context: ScriptErrorMessageContext): string
}

/**
 * runScript 的执行配置。
 */
export interface ScriptRunOptions<
  TState extends Record<string, unknown> = Record<string, unknown>,
  THelpers extends Record<string, unknown> = Record<string, unknown>,
> {
  /**
   * 脚本可读写的状态对象。
   *
   * 脚本中访问 `form.name`、`rows[0].amount` 这类字段时，最终都来自该对象。
   */
  state: TState

  /**
   * 注入给脚本调用的 helper 函数或常量。
   *
   * 例如 `{ sum, runApi, message }` 会让脚本内可以直接调用 `sum(...)`。
   */
  helpers?: THelpers

  /**
   * 注入给脚本的临时局部变量。
   *
   * 适合传入 `event`、`rowData`、`payload` 这类单次执行上下文。
   */
  scope?: Record<string, unknown>

  /**
   * 允许脚本访问的额外全局变量。
   *
   * 默认已包含 `Math`、`Date`、`JSON`、`console` 等常用 JS 全局对象。
   */
  globals?: Record<string, unknown>

  /**
   * 脚本失败时是否回滚本次执行产生的状态写入。
   *
   * 默认启用；传 false 时脚本失败也保留已经写入的状态。
   */
  transaction?: boolean

  /**
   * 是否记录调试信息。
   *
   * 开启后会在结果中返回 `reads` 和 `helperCalls`，用于可视化调试面板。
   */
  debug?: boolean

  /**
   * 脚本失败时是否直接抛出错误。
   *
   * 默认不抛出，而是返回 `{ ok: false, error }`，避免脚本错误影响页面运行。
   */
  throwOnError?: boolean

  /**
   * 自定义脚本错误文案格式化方法。
   *
   * 适合在上层统一注入页面、组件、事件或 API 信息，生成更清晰的调试日志。
   */
  formatErrorMessage?: ScriptErrorMessageFormatter
}

/**
 * runScript 的执行结果。
 */
export interface ScriptRunResult {
  /**
   * 脚本是否执行成功。
   */
  ok: boolean

  /**
   * 脚本 return 的值。
   *
   * 大多数低代码脚本只修改状态不 return，此时该字段为 undefined。
   */
  value?: unknown

  /**
   * 脚本编译或运行失败时的错误对象。
   */
  error?: Error

  /**
   * 脚本执行期间产生的状态变更。
   */
  patches: StatePatch[]

  /**
   * 调试模式下记录的状态读取路径。
   */
  reads?: ScriptPath[]

  /**
   * 调试模式下记录的 helper 调用名称。
   */
  helperCalls?: string[]

  /**
   * 脚本执行耗时，单位毫秒。
   */
  duration: number
}
