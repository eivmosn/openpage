import type { CompiledComponent } from '../types/compiled'
import type { RuntimeContext, RuntimeValidateOptions, RuntimeValidateTarget } from '../types/runtime'

export interface RuntimeModelPathSet {
  ignored: Set<string>
  included?: Set<string>
}

/**
 * 解析运行时目标组件对应的模型路径集合。
 *
 * @param context 当前渲染器运行时上下文。
 * @param target 组件 id、组件 name、模型路径或数组。
 * @param options 当前操作配置。
 * @returns 返回模型路径集合；无目标且无忽略项时返回空值。
 */
export function resolveRuntimeModelPaths(
  context: RuntimeContext,
  target?: RuntimeValidateTarget,
  options?: RuntimeValidateOptions,
): RuntimeModelPathSet | undefined {
  if (target === undefined && !options?.ignore?.length) {
    return undefined
  }

  const included = target === undefined ? undefined : new Set<string>()
  const ignored = new Set<string>()
  const targets = Array.isArray(target) ? target : [target]

  for (const item of targets) {
    if (item !== undefined) {
      resolveModelPathsByTarget(context, item, included)
    }
  }

  for (const item of options?.ignore || []) {
    resolveModelPathsByTarget(context, item, ignored)
  }

  return {
    ignored,
    included,
  }
}

/**
 * 判断模型路径是否属于当前操作范围。
 *
 * @param path 当前模型路径。
 * @param paths 当前模型路径集合。
 * @returns 返回当前模型路径是否需要处理。
 */
export function shouldHandleRuntimeModelPath(path: string, paths: RuntimeModelPathSet): boolean {
  if (paths.ignored.has(path)) {
    return false
  }

  return paths.included ? paths.included.has(path) : true
}

/**
 * 将目标标识解析为模型路径集合。
 *
 * @param context 当前渲染器运行时上下文。
 * @param target 组件 id、组件 name 或模型路径。
 * @param paths 需要写入的模型路径集合。
 */
function resolveModelPathsByTarget(context: RuntimeContext, target: string, paths: Set<string> | undefined): void {
  if (!paths) {
    return
  }

  const component = resolveTargetComponent(context, target)

  if (!component) {
    paths.add(target)
    return
  }

  collectComponentModelPaths(component, paths)
}

/**
 * 查找目标组件。
 *
 * @param context 当前渲染器运行时上下文。
 * @param target 组件 id 或组件 name。
 * @returns 返回匹配到的组件。
 */
function resolveTargetComponent(context: RuntimeContext, target: string): CompiledComponent | undefined {
  const directComponent = context.compiled.components.get(target)

  if (directComponent) {
    return directComponent
  }

  const namedComponentId = context.compiled.componentNames.get(target)

  return namedComponentId
    ? context.compiled.components.get(namedComponentId)
    : undefined
}

/**
 * 收集组件子树模型路径。
 *
 * @param component 当前组件。
 * @param paths 需要写入的模型路径集合。
 */
function collectComponentModelPaths(
  component: CompiledComponent,
  paths: Set<string>,
): void {
  for (const path of component.modelPaths) {
    paths.add(path)
  }
}
