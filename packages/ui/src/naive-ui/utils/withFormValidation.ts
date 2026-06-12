import type { Component, ComputedRef, InjectionKey } from 'vue'
import { useFormItem } from 'naive-ui/es/_mixins'
import { computed, defineComponent, h, inject, provide } from 'vue'
import { resolveComponentName } from './resolveComponentName'
import { uiComponentProps } from './uiComponentProps'

export type FormValidationStatus = 'success' | 'error' | 'warning'

export interface FormValidationBinding {
  status: ComputedRef<FormValidationStatus | undefined>
  statusClass: ComputedRef<string | undefined>
  triggerBlur: () => void
  triggerChange: () => void
  triggerFocus: () => void
  triggerInput: () => void
}

export interface WithFormValidationOptions {
  classPrefix?: string
}

const formValidationInjectionKey: InjectionKey<FormValidationBinding> = Symbol('openpage-naive-form-validation')

/**
 * 为组件注入标准表单校验上下文。
 *
 * @param component 需要接入校验状态的真实组件。
 * @param options 校验上下文配置。
 * @returns 返回带校验上下文的高阶组件。
 */
export function withFormValidation(component: Component, options: WithFormValidationOptions = {}): Component {
  return defineComponent({
    name: `OpenPageNaiveFormValidation${resolveComponentName(component)}`,
    inheritAttrs: false,
    props: uiComponentProps,
    setup(props, { slots }) {
      const formItem = useFormItem({}, {})
      const validation = createFormValidationBinding(formItem, options)

      provide(formValidationInjectionKey, validation)

      return () => h(component, props, slots)
    },
  })
}

/**
 * 获取当前组件可用的表单校验上下文。
 *
 * @returns 返回校验状态、状态类名和校验触发器。
 */
export function useFormValidation(): FormValidationBinding {
  return inject(formValidationInjectionKey, createEmptyFormValidationBinding, true)
}

/**
 * 创建 Naive FormItem 校验绑定。
 *
 * @param formItem Naive UI 表单项上下文。
 * @param options 校验上下文配置。
 * @returns 返回标准校验绑定对象。
 */
function createFormValidationBinding(
  formItem: ReturnType<typeof useFormItem>,
  options: WithFormValidationOptions,
): FormValidationBinding {
  const classPrefix = options.classPrefix || 'openpage-form-control'
  const status = computed(() => formItem.mergedStatusRef.value as FormValidationStatus | undefined)
  const statusClass = computed(() => status.value ? `${classPrefix}--${status.value}` : undefined)

  return {
    status,
    statusClass,
    triggerBlur: formItem.nTriggerFormBlur,
    triggerChange: formItem.nTriggerFormChange,
    triggerFocus: formItem.nTriggerFormFocus,
    triggerInput: formItem.nTriggerFormInput,
  }
}

/**
 * 创建空表单校验绑定，用于组件未被高阶组件包裹时兜底。
 *
 * @returns 返回无副作用的校验绑定对象。
 */
function createEmptyFormValidationBinding(): FormValidationBinding {
  const status = computed(() => undefined)
  const statusClass = computed(() => undefined)

  return {
    status,
    statusClass,
    triggerBlur: noop,
    triggerChange: noop,
    triggerFocus: noop,
    triggerInput: noop,
  }
}

/**
 * 空操作函数，用于没有表单上下文时保持调用安全。
 */
function noop(): void {}
