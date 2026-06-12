import type { CompiledComponent } from '../types/compiled'
import type { ResolvedRuntimeComponentPatch, RuntimeComponentPatch, RuntimeContext } from '../types/runtime'
import { compileProps } from '../compiler/compileProps'
import { compileExpressionValue, hasTemplateExpression } from './expression'

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
  const component = context.compiled.components.get(id)

  if (!component) {
    return false
  }

  context.componentPatches[id] = mergeComponentPatch(component, context.componentPatches[id], patch)
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

  return patch.resolvedComponent
}

/**
 * 合并两次运行时组件更新。
 *
 * @param component 原始编译组件。
 * @param previous 已存在的组件更新。
 * @param patch 新的组件更新。
 * @returns 返回合并后的组件更新。
 */
function mergeComponentPatch(
  component: CompiledComponent,
  previous: ResolvedRuntimeComponentPatch | undefined,
  patch: RuntimeComponentPatch,
): ResolvedRuntimeComponentPatch {
  const nextPatch: RuntimeComponentPatch = {
    ...previous,
    ...patch,
    props: {
      ...(previous?.props || {}),
      ...(patch.props || {}),
    },
    events: {
      ...(previous?.events || {}),
      ...(patch.events || {}),
    },
  }

  const props = {
    ...component.props,
    ...nextPatch.props,
  }
  const compiledProps = compileProps(props)
  const dynamicValues = resolveDynamicValues(component, nextPatch)
  const dynamicResolvers = resolveDynamicFieldResolvers(component.dynamicFieldKeys, dynamicValues)

  const resolvedPatch: ResolvedRuntimeComponentPatch = {
    ...nextPatch,
    props: compiledProps.props,
    dynamic: {
      fields: Object.freeze(Object.keys(dynamicResolvers)),
      props: compiledProps.dynamicPropKeys,
    },
    dynamicValues,
    dynamicFieldKeys: component.dynamicFieldKeys,
    dynamicResolvers,
    staticProps: compiledProps.staticProps,
    dynamicProps: compiledProps.dynamicProps,
    resolvedComponent: component,
  }
  const resolvedComponent: CompiledComponent = {
    ...component,
    ...resolvedPatch,
    id: component.id,
    events: {
      ...component.events,
      ...resolvedPatch.events,
    },
    children: nextPatch.children || component.children,
    model: nextPatch.model || component.model,
  }

  return {
    ...resolvedPatch,
    resolvedComponent,
  }
}

/**
 * 合并运行时更新后的可配置动态字段原始值。
 *
 * @param component 原始编译组件。
 * @param patch 当前合并后的组件更新。
 * @returns 返回动态字段原始值。
 */
function resolveDynamicValues(component: CompiledComponent, patch: RuntimeComponentPatch): Record<string, unknown> {
  const dynamicValues: Record<string, unknown> = {}

  for (const field of component.dynamicFieldKeys) {
    dynamicValues[field] = field in patch
      ? patch[field as keyof RuntimeComponentPatch]
      : component.dynamicValues[field]
  }

  return dynamicValues
}

/**
 * 编译运行时更新后的字段解析器。
 *
 * @param dynamicFieldKeys 需要运行时动态求值的组件字段键名。
 * @param dynamicValues 当前动态字段原始值。
 * @returns 返回动态字段解析器集合。
 */
function resolveDynamicFieldResolvers(
  dynamicFieldKeys: readonly string[],
  dynamicValues: Record<string, unknown>,
): CompiledComponent['dynamicResolvers'] {
  const resolvers: CompiledComponent['dynamicResolvers'] = {}

  for (const field of dynamicFieldKeys) {
    const value = dynamicValues[field]

    if (hasTemplateExpression(value)) {
      resolvers[field] = compileExpressionValue(value)
    }
  }

  return resolvers
}
