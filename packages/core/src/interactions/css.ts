import type { ComponentSchema, PageSchema } from '../types/schema'
import type { InteractionPreset, InteractionStyleObject, ResolvedInteractionStyle } from './types'
import { interactionPresets } from './presets'

const INTERACTION_KEYS = ['active', 'focus', 'focusWithin', 'hover'] as const
const STATE_SELECTORS: Record<(typeof INTERACTION_KEYS)[number], string> = {
  active: ':active',
  focus: ':focus',
  focusWithin: ':focus-within',
  hover: ':hover',
}

/**
 * 生成页面组件的稳定交互样式类名。
 *
 * @param pageId 当前页面 id。
 * @param componentId 当前组件 id。
 * @returns 返回经过安全处理的交互样式类名。
 */
export function createInteractionClassName(pageId: string, componentId: string): string {
  return `${sanitizeIdentifier(pageId)}-${sanitizeIdentifier(componentId)}`
}

/**
 * 移除不会传递给真实组件的交互配置。
 *
 * @param props 当前组件属性。
 * @returns 返回移除交互配置后的组件属性。
 */
export function omitInteractionProps(props: Record<string, unknown>): Record<string, unknown> {
  const {
    active: _active,
    focus: _focus,
    focusWithin: _focusWithin,
    hover: _hover,
    ...restProps
  } = props

  return restProps
}

/**
 * 收集页面内所有组件的交互 CSS。
 *
 * @param schema 当前页面 Schema。
 * @returns 返回页面级交互 CSS。
 */
export function collectPageInteractionCss(schema: PageSchema): string {
  const blocks: string[] = []
  const animatedClasses: string[] = []

  /**
   * 递归收集组件交互样式。
   *
   * @param component 当前 Schema 组件。
   */
  function walk(component: ComponentSchema): void {
    const className = createInteractionClassName(schema.id, component.id)
    const css = createComponentInteractionCss(className, component.props || {})

    if (css) {
      blocks.push(css)
      animatedClasses.push(`.${className}`)
    }

    component.children?.forEach(walk)
  }

  schema.children.forEach(walk)

  if (animatedClasses.length > 0) {
    blocks.push(createReducedMotionCss(animatedClasses))
  }

  return blocks.join('\n')
}

/**
 * 创建单个组件的交互 CSS。
 *
 * @param className 组件交互类名。
 * @param props 当前组件属性。
 * @returns 返回组件交互 CSS。
 */
function createComponentInteractionCss(className: string, props: Record<string, unknown>): string {
  const blocks: string[] = []
  const baseStyle: InteractionStyleObject = {}

  for (const key of INTERACTION_KEYS) {
    const resolvedStyle = resolveInteractionStyle(props[key])
    Object.assign(baseStyle, resolvedStyle.base)

    const stateCss = styleObjectToCss(resolvedStyle.state)
    if (stateCss) {
      blocks.push(`.${className}${STATE_SELECTORS[key]} {\n${stateCss}\n}`)
    }
  }

  const baseCss = styleObjectToCss(baseStyle)
  if (baseCss) {
    blocks.unshift(`.${className} {\n${baseCss}\n}`)
  }

  return blocks.join('\n')
}

/**
 * 解析交互预设或自定义样式。
 *
 * @param value Schema 中配置的交互样式。
 * @returns 返回基础样式与状态样式。
 */
function resolveInteractionStyle(value: unknown): ResolvedInteractionStyle {
  if (typeof value === 'string') {
    return interactionPresets[value as InteractionPreset] || interactionPresets.none
  }

  if (isStyleObject(value)) {
    return {
      base: {},
      state: value,
    }
  }

  return interactionPresets.none
}

/**
 * 将样式对象转换为 CSS 声明。
 *
 * @param style 当前样式对象。
 * @returns 返回 CSS 声明文本。
 */
function styleObjectToCss(style: InteractionStyleObject): string {
  return Object.entries(style)
    .filter(isValidStyleEntry)
    .map(([key, value]) => `  ${toKebabCase(key)}: ${String(value)};`)
    .join('\n')
}

/**
 * 判断样式键值是否可安全生成 CSS。
 *
 * @param entry 当前样式键值。
 * @returns 返回当前样式键值是否合法。
 */
function isValidStyleEntry(entry: [string, InteractionStyleObject[string]]): boolean {
  const [key, value] = entry
  return /^[A-Z-][\w-]*$/i.test(key)
    && value !== undefined
    && value !== null
    && !/[{}]/.test(String(value))
}

/**
 * 判断值是否为交互样式对象。
 *
 * @param value 当前配置值。
 * @returns 返回是否为交互样式对象。
 */
function isStyleObject(value: unknown): value is InteractionStyleObject {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

/**
 * 将驼峰样式名转换为短横线格式。
 *
 * @param value 当前样式名。
 * @returns 返回短横线格式样式名。
 */
function toKebabCase(value: string): string {
  return value.replace(/[A-Z]/g, match => `-${match.toLowerCase()}`)
}

/**
 * 将任意 id 转换为可用于 CSS 类名的标识。
 *
 * @param value 当前 id。
 * @returns 返回安全 CSS 标识。
 */
function sanitizeIdentifier(value: string): string {
  return value.replace(/[^\w-]/g, '-')
}

/**
 * 创建减少动态效果的无障碍 CSS。
 *
 * @param selectors 当前页面包含动画的组件选择器。
 * @returns 返回减少动态效果媒体查询。
 */
function createReducedMotionCss(selectors: string[]): string {
  return `@media (prefers-reduced-motion: reduce) {\n  ${selectors.join(',\n  ')} {\n    animation: none !important;\n    transition: none !important;\n  }\n}`
}
