import type { FormItemRule } from 'naive-ui'
import type { ComputedRef } from 'vue'
import type { UiComponentProps } from '../../types'
import type { InputType } from '../utils/resolve'
import { getModelKey } from '@openpage/core'
import { computed } from 'vue'
import { resolveInputType } from '../utils/resolve'

export interface NaiveFormFieldBinding {
  disabled: ComputedRef<boolean>
  label: ComputedRef<string | undefined>
  path: ComputedRef<string | undefined>
  rawValue: ComputedRef<unknown>
  required: ComputedRef<boolean>
  rule: ComputedRef<FormItemRule | FormItemRule[] | undefined>
  labelWidth: ComputedRef<number | string | undefined>
  value: ComputedRef<string>
  type: ComputedRef<InputType>
  placeholder: ComputedRef<string>
  showFeedback: ComputedRef<boolean>
  description: ComputedRef<string>
}

export interface UseFormFieldOptions {
  inputType?: InputType
}

/**
 * 创建 Naive UI 表单字段绑定。
 *
 * @param props 当前 UI 组件组件 props。
 * @param options 字段绑定配置。
 * @returns 返回表单字段绑定数据。
 */
export function useFormField(props: UiComponentProps, options: UseFormFieldOptions = {}): NaiveFormFieldBinding {
  const disabled = computed(resolveDisabled)
  const label = computed(resolveLabel)
  const path = computed(resolvePath)
  const rawValue = computed(resolveRawValue)
  const required = computed(resolveRequired)
  const rule = computed(resolveRule)
  const labelWidth = computed(resolveLabelWidth)
  const value = computed(resolveValue)
  const type = computed(resolveType)
  const placeholder = computed(resolvePlaceholder)
  const showFeedback = computed(resolveShowFeedback)

  const description = computed(() => props.component.description as string)

  /**
   * 解析字段是否禁用。
   *
   * @returns 返回组件顶层或 props 中配置的禁用状态。
   */
  function resolveDisabled(): boolean {
    return props.component.disabled === true || props.component.props.disabled === true
  }

  /**
   * 解析字段标签。
   *
   * @returns 返回字段标签。
   */
  function resolveLabel(): string | undefined {
    const labelValue = props.component.label || props.component.props.label
    return labelValue ? String(labelValue) : undefined
  }

  /**
   * 解析字段模型路径。
   *
   * @returns 返回字段模型路径。
   */
  function resolvePath(): string | undefined {
    const model = props.component.model

    return model ? getModelKey(model) : undefined
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
   * 解析字段是否必填。
   *
   * @returns 返回字段是否需要必填校验。
   */
  function resolveRequired(): boolean {
    return props.component.required === true || props.component.props.required === true
  }

  /**
   * 解析字段标签宽度。
   *
   * @returns 返回字段标签宽度配置。
   */
  function resolveLabelWidth(): number | string | undefined {
    return props.component.labelWidth
  }

  /**
   * 解析字段校验规则。
   *
   * @returns 返回 Naive UI 表单项校验规则。
   */
  function resolveRule(): FormItemRule | FormItemRule[] | undefined {
    const rawRule = props.component.props.rule
    const rules: FormItemRule[] = []

    if (required.value) {
      rules.push({
        required: true,
        message: String(props.component.props.message || `${label.value || '该字段'}不能为空`),
        trigger: ['blur', 'change'],
        validator: validateRequiredValue,
      })
    }

    if (rawRule && typeof rawRule === 'object') {
      if (Array.isArray(rawRule)) {
        rules.push(...rawRule.filter(isFormItemRule))
      }
      else if (isFormItemRule(rawRule)) {
        rules.push(rawRule)
      }
    }

    return rules.length ? rules : undefined
  }

  /**
   * 校验必填字段值。
   *
   * @param _rule 当前校验规则。
   * @param value 当前字段值。
   * @returns 返回是否校验通过。
   */
  function validateRequiredValue(_rule: FormItemRule, value: unknown): boolean {
    if (Array.isArray(value)) {
      return value.length > 0 && value.every(item => item !== undefined && item !== null && item !== '')
    }

    return value !== undefined && value !== null && value !== ''
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
    return options.inputType || resolveInputType(props.component.props.inputType || props.component.type)
  }

  /**
   * 解析字段占位文本。
   *
   * @returns 返回字段占位文本。
   */
  function resolvePlaceholder(): string {
    return String(props.component.props.placeholder || '')
  }

  /**
   * 解析是否展示校验反馈。
   *
   * @returns 返回是否展示校验反馈。
   */
  function resolveShowFeedback(): boolean {
    return false
  }

  return {
    disabled,
    label,
    path,
    rawValue,
    required,
    rule,
    labelWidth,
    value,
    type,
    placeholder,
    showFeedback,
    description,
  }
}

/**
 * 判断配置值是否可以作为 Naive UI 表单项规则。
 *
 * @param rule 需要判断的规则配置。
 * @returns 返回是否为对象规则。
 */
function isFormItemRule(rule: unknown): rule is FormItemRule {
  return Boolean(rule) && typeof rule === 'object'
}
