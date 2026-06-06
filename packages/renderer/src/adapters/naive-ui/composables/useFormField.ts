import type { ComputedRef } from 'vue'
import type { UiNodeProps } from '../../types'
import type { InputType } from '../utils/resolve'
import { computed } from 'vue'
import { resolveInputType } from '../utils/resolve'

export interface NaiveFormFieldBinding {
  disabled: ComputedRef<boolean>
  label: ComputedRef<string | undefined>
  path: ComputedRef<string | undefined>
  rawValue: ComputedRef<unknown>
  value: ComputedRef<string>
  type: ComputedRef<InputType>
  placeholder: ComputedRef<string>
  showFeedback: ComputedRef<boolean>
}

export interface UseFormFieldOptions {
  inputType?: InputType
}

/**
 * 创建 Naive UI 表单字段绑定。
 *
 * @param props 当前 UI 节点组件 props。
 * @param options 字段绑定配置。
 * @returns 返回表单字段绑定数据。
 */
export function useFormField(props: UiNodeProps, options: UseFormFieldOptions = {}): NaiveFormFieldBinding {
  const disabled = computed(resolveDisabled)
  const label = computed(resolveLabel)
  const path = computed(resolvePath)
  const rawValue = computed(resolveRawValue)
  const value = computed(resolveValue)
  const type = computed(resolveType)
  const placeholder = computed(resolvePlaceholder)
  const showFeedback = computed(resolveShowFeedback)

  /**
   * 解析字段是否禁用。
   *
   * @returns 返回节点顶层或 props 中配置的禁用状态。
   */
  function resolveDisabled(): boolean {
    return props.node.disabled === true || props.node.props.disabled === true
  }

  /**
   * 解析字段标签。
   *
   * @returns 返回字段标签。
   */
  function resolveLabel(): string | undefined {
    const labelValue = props.node.label || props.node.props.label
    return labelValue ? String(labelValue) : undefined
  }

  /**
   * 解析字段模型路径。
   *
   * @returns 返回字段模型路径。
   */
  function resolvePath(): string | undefined {
    return props.node.model?.path
  }

  /**
   * 解析字段当前原始值。
   *
   * @returns 返回字段当前原始值。
   */
  function resolveRawValue(): unknown {
    return props.value
  }

  /**
   * 解析字段当前值。
   *
   * @returns 返回字段当前字符串值。
   */
  function resolveValue(): string {
    return String(props.value || '')
  }

  /**
   * 解析字段输入类型。
   *
   * @returns 返回字段输入类型。
   */
  function resolveType(): InputType {
    return options.inputType || resolveInputType(props.node.props.inputType || props.node.type)
  }

  /**
   * 解析字段占位文本。
   *
   * @returns 返回字段占位文本。
   */
  function resolvePlaceholder(): string {
    return String(props.node.props.placeholder || '')
  }

  /**
   * 解析是否展示校验反馈。
   *
   * @returns 返回是否展示校验反馈。
   */
  function resolveShowFeedback(): boolean {
    return props.node.props.showFeedback !== false
  }

  return {
    disabled,
    label,
    path,
    rawValue,
    value,
    type,
    placeholder,
    showFeedback,
  }
}
