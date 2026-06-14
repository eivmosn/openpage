import type { CompiledComponent, CompiledModelComponent, CompiledPage } from '../types/compiled'
import type { ComponentSchema, PageSchema } from '../types/schema'
import type { CompileSchemaOptions } from './options'
import { markRaw } from 'vue'
import { collectPageInteractionCss, createInteractionClassName, hasInteractionProps } from '../interactions/css'
import { compileExpressionValue, hasTemplateExpression } from '../runtime/expression'
import { getModelKey } from '../runtime/model'
import { compileProps } from './compileProps'
import { resolveCompileSchemaOptions } from './options'

/**
 * 将页面 Schema 编译为运行时使用的扁平组件结构。
 *
 * @param schema 原始页面 Schema。
 * @param options Schema 编译配置。
 * @returns 返回编译后的页面结构。
 */
export function compileSchema(schema: PageSchema, options?: CompileSchemaOptions): CompiledPage {
  const compileOptions = resolveCompileSchemaOptions(options)
  const components = new Map<string, CompiledComponent>()
  const componentNames = new Map<string, string>()
  const children = compileChildren(schema.id, schema.children, components, componentNames, compileOptions.dynamicFieldKeys)
  const componentIndexes = collectComponentIndexes(components)

  return markRaw({
    id: schema.id,
    title: schema.title,
    children,
    components: markRaw(components),
    componentNames: markRaw(componentNames),
    ...componentIndexes,
    interactionCss: collectPageInteractionCss(schema),
  })
}

/**
 * 编译页面顶层子组件列表。
 *
 * @param pageId 当前页面 id。
 * @param children 原始页面 Schema 的顶层子组件列表。
 * @param components 编译组件索引表。
 * @param componentNames 编译组件名称索引表。
 * @param dynamicFieldKeys 需要运行时动态求值的组件字段键名。
 * @returns 返回顶层子组件 id 列表。
 */
function compileChildren(
  pageId: string,
  children: ComponentSchema[],
  components: Map<string, CompiledComponent>,
  componentNames: Map<string, string>,
  dynamicFieldKeys: readonly string[],
): string[] {
  return children.map(child => compileComponent(pageId, child, components, componentNames, dynamicFieldKeys))
}

/**
 * 编译单个组件并递归收集子组件。
 *
 * @param pageId 当前页面 id。
 * @param component 原始组件 Schema。
 * @param components 编译组件索引表。
 * @param componentNames 编译组件名称索引表。
 * @param dynamicFieldKeys 需要运行时动态求值的组件字段键名。
 * @returns 返回当前组件 id。
 */
function compileComponent(
  pageId: string,
  component: ComponentSchema,
  components: Map<string, CompiledComponent>,
  componentNames: Map<string, string>,
  dynamicFieldKeys: readonly string[],
): string {
  const children = (component.children || []).map(child => compileComponent(pageId, child, components, componentNames, dynamicFieldKeys))
  const model = resolveComponentModel(component)
  const modelPaths = resolveComponentModelPaths(model, children, components)
  const props = component.props || {}
  const interactionClassName = hasInteractionProps(props)
    ? createInteractionClassName(pageId, component.id)
    : undefined
  const compiledProps = compileProps(props)
  const dynamicResolvers = resolveDynamicFieldResolvers(component, dynamicFieldKeys)

  components.set(component.id, markRaw({
    // 组件唯一结构标识，运行时通过 components.get(id) O(1) 读取组件配置。
    id: component.id,
    // UI 组件类型，用于从 context.components 中选择真实组件。
    type: component.type,
    // 业务名称，用于 componentNames 建立 name -> id 索引和页面状态路径绑定。
    name: component.name,
    // 兼容保留的展示标题字段，动态表达式会在 dynamicResolvers 中预编译。
    label: component.label,
    // 可配置动态字段的原始值集合，静态字段运行时直接复用这里的值。
    dynamicValues: markRaw(resolveDynamicValues(component, dynamicFieldKeys)),
    // 当前编译配置关注的动态字段列表，新增动态字段只需要维护该列表。
    dynamicFieldKeys,
    // 兼容保留的显隐字段，最终渲染值会由 Component 统一解析后覆盖。
    visible: component.visible,
    // 兼容保留的禁用字段，最终渲染值会由 Component 统一解析后覆盖。
    disabled: component.disabled,
    // 默认值配置，创建上下文时会按 model 写入空状态。
    defaultValue: component.defaultValue,
    // description label 的描述
    description: component.description,
    // 计算值表达式，由 useComputedValues 集中创建 watcher 并同步到 model。
    computedValue: component.computedValue,
    // 表单必填配置，支持静态布尔值和动态表达式。
    required: component.required,
    // 标签宽度
    labelWidth: component.labelWidth,
    // 原始 props，保留给 patch 合并和调试读取。
    props: compiledProps.props,
    // 不含模板表达式的 props，渲染时可直接复用，避免重复深解析。
    staticProps: compiledProps.staticProps,
    // 含模板表达式的 props resolver 列表，渲染时只执行这些动态项。
    dynamicProps: compiledProps.dynamicProps,
    // 子组件 id 列表，渲染时用这些 id 递归创建 Component。
    children,
    // 事件配置，运行时触发时交给 runActions 执行。
    events: markRaw(component.events || {}),
    // 自动推导出的状态绑定路径，例如 username、search.keyword 或 start,end。
    model,
    // 当前组件子树内所有模型路径，供 validate/reset 等运行时范围操作直接命中。
    modelPaths,
    // 动态字段索引摘要，主要用于调试和运行时快速判断哪些字段/props 是动态的。
    dynamic: markRaw({
      fields: Object.freeze(Object.keys(dynamicResolvers)),
      props: compiledProps.dynamicPropKeys,
    }),
    // 动态字段预编译 resolver，避免渲染时重复解析表达式字符串。
    dynamicResolvers: markRaw(dynamicResolvers),
    // 页面级稳定交互样式类名，与 interactionCss 中生成的选择器对应。
    interactionClassName,
  }))

  if (component.name) {
    componentNames.set(component.name, component.id)
  }

  return component.id
}

/**
 * 收集当前页面运行时热路径索引。
 *
 * @param components 编译组件索引表。
 * @returns 返回运行时可直接消费的组件索引。
 */
function collectComponentIndexes(
  components: Map<string, CompiledComponent>,
): Pick<CompiledPage, 'computedComponents' | 'defaultValueComponents' | 'modelComponents'> {
  const modelComponents: CompiledModelComponent[] = []
  const computedComponents: CompiledComponent[] = []
  const defaultValueComponents: CompiledComponent[] = []

  for (const component of components.values()) {
    if (!component.model) {
      continue
    }

    modelComponents.push(component as CompiledModelComponent)

    if (component.computedValue !== undefined) {
      computedComponents.push(component)
    }

    if (component.defaultValue !== undefined) {
      defaultValueComponents.push(component)
    }
  }

  return markRaw({
    computedComponents: markRaw(Object.freeze(computedComponents)),
    defaultValueComponents: markRaw(Object.freeze(defaultValueComponents)),
    modelComponents: markRaw(Object.freeze(modelComponents)),
  })
}

/**
 * 收集当前组件子树内所有模型路径。
 *
 * @param model 当前组件模型配置。
 * @param children 当前组件子组件 id 列表。
 * @param components 编译组件索引表。
 * @returns 返回当前组件及子组件的模型路径列表。
 */
function resolveComponentModelPaths(
  model: CompiledComponent['model'],
  children: readonly string[],
  components: Map<string, CompiledComponent>,
): readonly string[] {
  const paths: string[] = []

  if (model) {
    paths.push(getModelKey(model))
  }

  for (const childId of children) {
    const child = components.get(childId)

    if (child?.modelPaths.length) {
      paths.push(...child.modelPaths)
    }
  }

  return markRaw(Object.freeze(paths))
}

/**
 * 根据组件字段名称生成模型路径。
 *
 * @param component 当前 Schema 组件。
 * @returns 返回自动生成的模型绑定配置。
 */
function resolveComponentModel(component: ComponentSchema): CompiledComponent['model'] {
  if (!component.name) {
    return undefined
  }

  const paths = resolveNamePathList(component.name)

  if (paths) {
    return {
      paths,
    }
  }

  return {
    path: component.name,
  }
}

/**
 * 将组件 name 解析为多状态路径列表。
 *
 * @param name 组件名称配置。
 * @returns 返回多路径列表；不是多路径配置时返回空值。
 */
function resolveNamePathList(name: string): readonly string[] | undefined {
  if (!name.includes(',')) {
    return undefined
  }

  const paths = name
    .split(',')
    .map(path => path.trim())
    .filter(path => path.length > 0)

  return paths.length > 1 ? Object.freeze(paths) : undefined
}

/**
 * 收集组件中可配置动态字段的原始值。
 *
 * @param component 当前 Schema 组件。
 * @param dynamicFieldKeys 需要运行时动态求值的组件字段键名。
 * @returns 返回组件动态字段原始值。
 */
function resolveDynamicValues(component: ComponentSchema, dynamicFieldKeys: readonly string[]): Record<string, unknown> {
  const dynamicValues: Record<string, unknown> = {}

  for (const field of dynamicFieldKeys) {
    dynamicValues[field] = component[field as keyof ComponentSchema]
  }

  return dynamicValues
}

/**
 * 编译组件字段级动态表达式解析器。
 *
 * @param component 当前 Schema 组件。
 * @param dynamicFieldKeys 需要运行时动态求值的组件字段键名。
 * @returns 返回组件字段级动态表达式解析器。
 */
function resolveDynamicFieldResolvers(component: ComponentSchema, dynamicFieldKeys: readonly string[]): CompiledComponent['dynamicResolvers'] {
  const resolvers: CompiledComponent['dynamicResolvers'] = {}

  for (const field of dynamicFieldKeys) {
    const value = component[field as keyof ComponentSchema]

    if (hasTemplateExpression(value)) {
      resolvers[field] = compileExpressionValue(value)
    }
  }

  return resolvers
}
