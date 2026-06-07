import type { CompiledComponent, CompiledPage } from '../types/compiled'
import type { ComponentSchema, PageSchema } from '../types/schema'
import { markRaw } from 'vue'

/**
 * 将页面 Schema 编译为运行时使用的扁平组件结构。
 *
 * @param schema 原始页面 Schema。
 * @returns 返回编译后的页面结构。
 */
export function compileSchema(schema: PageSchema): CompiledPage {
  const components = new Map<string, CompiledComponent>()
  const componentNames = new Map<string, string>()
  const children = compileChildren(schema.children, components, componentNames)

  return markRaw({
    id: schema.id,
    title: schema.title,
    children,
    components: markRaw(components),
    componentNames: markRaw(componentNames),
  })
}

/**
 * 编译页面顶层子组件列表。
 *
 * @param children 原始页面 Schema 的顶层子组件列表。
 * @param components 编译组件索引表。
 * @param componentNames 编译组件名称索引表。
 * @returns 返回顶层子组件 id 列表。
 */
function compileChildren(
  children: ComponentSchema[],
  components: Map<string, CompiledComponent>,
  componentNames: Map<string, string>,
  formName?: string,
): string[] {
  return children.map(child => compileComponent(child, components, componentNames, formName))
}

/**
 * 编译单个组件并递归收集子组件。
 *
 * @param component 原始组件 Schema。
 * @param components 编译组件索引表。
 * @param componentNames 编译组件名称索引表。
 * @param formName 当前组件所属表单的数据字段名称。
 * @returns 返回当前组件 id。
 */
function compileComponent(
  component: ComponentSchema,
  components: Map<string, CompiledComponent>,
  componentNames: Map<string, string>,
  formName?: string,
): string {
  const childFormName = component.type === 'form' ? component.name : formName
  const children = (component.children || []).map(child => compileComponent(child, components, componentNames, childFormName))
  const model = resolveModelFromName(component, formName)

  components.set(component.id, markRaw({
    id: component.id,
    type: component.type,
    name: component.name,
    label: component.label,
    visible: component.visible,
    disabled: component.disabled,
    required: component.required,
    defaultValue: component.defaultValue,
    computedValue: component.computedValue,
    props: markRaw(component.props || {}),
    children,
    events: markRaw(component.events || {}),
    model,
  }))

  if (component.name) {
    componentNames.set(component.name, component.id)
  }

  return component.id
}

/**
 * 根据所属表单名称和组件字段名称生成模型路径。
 *
 * @param component 当前 Schema 组件。
 * @param formName 当前组件所属表单的数据字段名称。
 * @returns 返回自动生成的模型绑定配置。
 */
function resolveModelFromName(component: ComponentSchema, formName?: string): CompiledComponent['model'] {
  if (component.type === 'form' || !formName || !component.name) {
    return undefined
  }

  return {
    path: `${formName}.${component.name}`,
  }
}
