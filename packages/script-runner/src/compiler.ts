import type { CompileScriptOptions, ScriptRunner } from './types'

const defaultScriptCache = new Map<string, ScriptRunner>()

/**
 * 编译用户脚本字符串为可复用执行函数。
 *
 * @param script 用户提供的脚本文本。
 * @param options 编译缓存配置。
 * @returns 返回可执行脚本函数。
 */
export function compileScript(script: string, options: CompileScriptOptions = {}): ScriptRunner {
  const cache = options.cache === undefined ? defaultScriptCache : options.cache

  if (cache) {
    const cachedRunner = cache.get(script)

    if (cachedRunner) {
      return cachedRunner
    }
  }

  const runner = createScriptRunner(script)

  if (cache) {
    cache.set(script, runner)
  }

  return runner
}

/**
 * 清理默认脚本编译缓存。
 */
export function clearScriptCache(): void {
  defaultScriptCache.clear()
}

/**
 * 创建底层脚本执行函数。
 *
 * @param script 用户提供的脚本文本。
 * @returns 返回底层执行函数。
 */
function createScriptRunner(script: string): ScriptRunner {
  // eslint-disable-next-line no-new-func
  return new Function(
    'scope',
    `with (scope) { return (async () => { ${script}\n })() }`,
  ) as ScriptRunner
}
