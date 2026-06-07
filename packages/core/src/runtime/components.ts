import type { CompiledComponent } from '../types/compiled'
import type { RuntimeComponentPatch, RuntimeContext } from '../types/runtime'

/**
 * 通过组件 id 获取运行时组件。
 *
 * @param context 当前渲染器运行时上下文。
 * @param id 需要查询的组件 id。
 * @returns 返回合并运行时更新后的组件，未找到时返回 undefined。
 */
export function getComponentById(context: RuntimeContext, id: string): CompiledComponent | undefined {
  const component = context.compiled.components.get(id)

  if (!component) {
    return undefined
  }

  return resolveRuntimeComponent(context, component)
}

/**
 * 通过组件名称获取运行时组件。
 *
 * @param context 当前渲染器运行时上下文。
 * @param name 需要查询的组件名称。
 * @returns 返回合并运行时更新后的组件，未找到时返回 undefined。
 */
export function getComponentByName(context: RuntimeContext, name: string): CompiledComponent | undefined {
  const id = context.compiled.componentNames.get(name)

  if (!id) {
    return undefined
  }

  return getComponentById(context, id)
}

/**
 * 通过组件 id 更新运行时组件信息。
 *
 * @param context 当前渲染器运行时上下文。
 * @param id 需要更新的组件 id。
 * @param patch 需要合并到组件上的运行时更新。
 * @returns 返回是否更新成功。
 */
export function updateComponentById(context: RuntimeContext, id: string, patch: RuntimeComponentPatch): boolean {
  if (!context.compiled.components.has(id)) {
    return false
  }

  context.componentPatches[id] = mergeComponentPatch(context.componentPatches[id], patch)
  return true
}

/**
 * 通过组件名称更新运行时组件信息。
 *
 * @param context 当前渲染器运行时上下文。
 * @param name 需要更新的组件名称。
 * @param patch 需要合并到组件上的运行时更新。
 * @returns 返回是否更新成功。
 */
export function updateComponentByName(context: RuntimeContext, name: string, patch: RuntimeComponentPatch): boolean {
  const id = context.compiled.componentNames.get(name)

  if (!id) {
    return false
  }

  return updateComponentById(context, id, patch)
}

/**
 * 合并编译组件和运行时组件更新。
 *
 * @param context 当前渲染器运行时上下文。
 * @param component 原始编译组件。
 * @returns 返回可用于渲染的运行时组件。
 */
export function resolveRuntimeComponent(context: RuntimeContext, component: CompiledComponent): CompiledComponent {
  const patch = context.componentPatches[component.id]

  if (!patch) {
    return component
  }

  return {
    ...component,
    ...patch,
    id: component.id,
    props: {
      ...component.props,
      ...patch.props,
    },
    events: {
      ...component.events,
      ...patch.events,
    },
    children: patch.children || component.children,
    model: patch.model || component.model,
  }
}

/**
 * 合并两次运行时组件更新。
 *
 * @param previous 已存在的组件更新。
 * @param patch 新的组件更新。
 * @returns 返回合并后的组件更新。
 */
function mergeComponentPatch(previous: RuntimeComponentPatch | undefined, patch: RuntimeComponentPatch): RuntimeComponentPatch {
  return {
    ...previous,
    ...patch,
    props: {
      ...previous?.props,
      ...patch.props,
    },
    events: {
      ...previous?.events,
      ...patch.events,
    },
  }
}
