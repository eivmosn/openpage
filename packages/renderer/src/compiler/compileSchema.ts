import type { CompiledNode, CompiledPage } from '../types/compiled'
import type { NodeSchema, PageSchema } from '../types/schema'
import { markRaw } from 'vue'

const FORM_FIELD_NODE_TYPES = new Set([
  'input',
  'autoComplete',
  'textarea',
  'password',
  'inputNumber',
  'inputOTP',
  'mention',
  'select',
  'treeSelect',
  'datetime',
  'date',
  'timePicker',
  'switch',
  'checkboxGroup',
  'radioGroup',
  'colorPicker',
  'dynamicTags',
  'rate',
  'slider',
])

/**
 * 将页面 Schema 编译为运行时使用的扁平节点结构。
 *
 * @param schema 原始页面 Schema。
 * @returns 返回编译后的页面结构。
 */
export function compileSchema(schema: PageSchema): CompiledPage {
  const nodes = new Map<string, CompiledNode>()
  const nodeNames = new Map<string, string>()
  const children = compileChildren(schema.children, nodes, nodeNames, false)

  return markRaw({
    id: schema.id,
    title: schema.title,
    children,
    nodes: markRaw(nodes),
    nodeNames: markRaw(nodeNames),
  })
}

/**
 * 编译页面顶层子节点列表。
 *
 * @param children 原始页面 Schema 的顶层子节点列表。
 * @param nodes 编译节点索引表。
 * @param nodeNames 编译节点名称索引表。
 * @param insideForm 当前节点是否位于表单容器内。
 * @returns 返回顶层子节点 id 列表。
 */
function compileChildren(
  children: NodeSchema[],
  nodes: Map<string, CompiledNode>,
  nodeNames: Map<string, string>,
  insideForm: boolean,
): string[] {
  return children.map(child => compileNode(child, nodes, nodeNames, insideForm))
}

/**
 * 编译单个节点并递归收集子节点。
 *
 * @param node 原始节点 Schema。
 * @param nodes 编译节点索引表。
 * @param nodeNames 编译节点名称索引表。
 * @param insideForm 当前节点是否位于表单容器内。
 * @returns 返回当前节点 id。
 */
function compileNode(
  node: NodeSchema,
  nodes: Map<string, CompiledNode>,
  nodeNames: Map<string, string>,
  insideForm: boolean,
): string {
  const formField = insideForm && FORM_FIELD_NODE_TYPES.has(node.type)
  const childrenInsideForm = insideForm || node.type === 'form'
  const children = (node.children || []).map(child => compileNode(child, nodes, nodeNames, childrenInsideForm))
  const model = node.model || resolveModelFromProps(node) || resolveModelFromName(node, formField)

  nodes.set(node.id, markRaw({
    id: node.id,
    type: node.type,
    name: node.name,
    label: node.label,
    visible: node.visible,
    disabled: node.disabled,
    required: node.required,
    defaultValue: node.defaultValue,
    computedValue: node.computedValue,
    props: markRaw(node.props || {}),
    children,
    events: markRaw(node.events || {}),
    formField,
    model,
  }))

  if (node.name) {
    nodeNames.set(node.name, node.id)
  }

  return node.id
}

/**
 * 从节点 props 中解析模板变量绑定。
 *
 * @param node 原始节点 Schema。
 * @returns 返回解析出的模型绑定配置。
 */
function resolveModelFromProps(node: NodeSchema): CompiledNode['model'] {
  const value = node.props?.value

  if (typeof value !== 'string') {
    return undefined
  }

  const path = resolveTemplatePath(value)

  if (!path) {
    return undefined
  }

  return { path }
}

/**
 * 从输入类节点名称推导默认模型路径。
 *
 * @param node 原始节点 Schema。
 * @param formField 当前节点是否为表单字段。
 * @returns 返回解析出的模型绑定配置。
 */
function resolveModelFromName(node: NodeSchema, formField: boolean): CompiledNode['model'] {
  if (!node.name || !formField) {
    return undefined
  }

  return { path: `form.${node.name}` }
}

/**
 * 解析形如 {{ form.username[0].email }} 的模板路径。
 *
 * @param value Schema 中配置的模板字符串。
 * @returns 返回模板路径
 */
function resolveTemplatePath(value: string): string | undefined {
  const matched = value.match(
    /^\{\{\s*([A-Z_$][\w$]*(?:\.[A-Z_$][\w$]*|\[\d+\]|\[['"][^'"\]]+['"]\])*)\s*\}\}$/i,
  )
  return matched?.[1]
}
