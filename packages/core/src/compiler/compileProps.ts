import type { CompiledDynamicProp } from '../types/compiled'
import { markRaw } from 'vue'
import { compileExpressionValue, hasTemplateExpression } from '../runtime/expression'

export interface CompiledProps {
  dynamicPropKeys: readonly string[]
  dynamicProps: readonly CompiledDynamicProp[]
  props: Record<string, unknown>
  staticProps: Record<string, unknown>
}

const INTERACTION_PROP_KEYS = new Set(['active', 'focus', 'focusWithin', 'hover'])

/**
 * 编译组件 props，拆分静态属性和需要运行时求值的动态属性。
 *
 * @param props 原始组件 props。
 * @returns 返回可供渲染热路径直接使用的 props 编译结果。
 */
export function compileProps(props: Record<string, unknown>): CompiledProps {
  const dynamicPropKeys: string[] = []
  const dynamicProps: CompiledDynamicProp[] = []
  const staticProps: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(props)) {
    if (INTERACTION_PROP_KEYS.has(key)) {
      continue
    }

    if (hasTemplateExpression(value)) {
      dynamicPropKeys.push(key)
      dynamicProps.push(markRaw([key, compileExpressionValue(value)] as const))
      continue
    }

    staticProps[key] = value
  }

  return markRaw({
    dynamicPropKeys: Object.freeze(dynamicPropKeys),
    dynamicProps: markRaw(Object.freeze(dynamicProps)),
    props: markRaw(props),
    staticProps: markRaw(staticProps),
  })
}
