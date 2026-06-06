<script lang="ts">
import type { UiNodeProps } from '../../types'
import { NInput } from 'naive-ui'
import { createFieldComponent } from '../../factory'
import { resolveInputType } from '../utils/resolve'

/**
 * 解析 Naive UI 输入框特有属性。
 *
 * @param props 当前 OpenPage UI 节点属性。
 * @returns 返回输入框特有属性。
 */
function resolveInputProps(props: UiNodeProps): Record<string, unknown> {
  return {
    type: resolveInputType(props.node.props.inputType || props.node.type),
    inputProps: {
      autocomplete: 'current-password',
    },
  }
}

/**
 * 将输入框模型值标准化为字符串。
 *
 * @param props 当前 OpenPage UI 节点属性。
 * @returns 返回适合 Naive UI 输入框的字符串值。
 */
function resolveInputValue(props: UiNodeProps): string {
  return String(props.value || '')
}

export default createFieldComponent({
  name: 'OpenPageNaiveInput',
  component: NInput,
  valueProp: 'value',
  updateEvent: 'onUpdate:value',
  nodeEvent: 'oninput',
  resolveProps: resolveInputProps,
  resolveValue: resolveInputValue,
})
</script>
