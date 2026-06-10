import type { ScriptErrorMessageFormatter, ScriptExecutionPhase } from './types'

export class ScriptExecutionError extends Error {
  readonly phase: ScriptExecutionPhase
  readonly originalError: unknown

  /**
   * 创建脚本执行错误对象。
   *
   * @param phase 错误发生阶段，区分编译期和运行期。
   * @param error 原始错误对象。
   * @param formatErrorMessage 自定义错误文案格式化方法。
   */
  constructor(
    phase: ScriptExecutionPhase,
    error: unknown,
    formatErrorMessage?: ScriptErrorMessageFormatter,
  ) {
    super(formatScriptErrorMessage(phase, error, formatErrorMessage))
    this.name = 'ScriptExecutionError'
    this.phase = phase
    this.originalError = error

    if (error instanceof Error && error.stack) {
      this.stack = error.stack
    }
  }
}

/**
 * 将未知错误包装成统一的脚本执行错误。
 *
 * @param phase 错误发生阶段。
 * @param error 原始错误对象。
 * @param formatErrorMessage 自定义错误文案格式化方法。
 * @returns 返回统一的脚本执行错误。
 */
export function createScriptExecutionError(
  phase: ScriptExecutionPhase,
  error: unknown,
  formatErrorMessage?: ScriptErrorMessageFormatter,
): ScriptExecutionError {
  return error instanceof ScriptExecutionError
    ? error
    : new ScriptExecutionError(phase, error, formatErrorMessage)
}

/**
 * 格式化脚本错误文案。
 *
 * @param phase 错误发生阶段。
 * @param error 原始错误对象。
 * @param formatErrorMessage 自定义错误文案格式化方法。
 * @returns 返回可读错误文案。
 */
function formatScriptErrorMessage(
  phase: ScriptExecutionPhase,
  error: unknown,
  formatErrorMessage?: ScriptErrorMessageFormatter,
): string {
  const message = error instanceof Error ? error.message : String(error)

  if (formatErrorMessage) {
    return formatErrorMessage({
      phase,
      error,
      message,
    })
  }

  return `[openpage/script-runner] ${phase} error: ${message}`
}
