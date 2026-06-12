<script setup lang="ts">
import type { FormInst } from 'naive-ui'
import type { UiFormWrapperProps } from '../../types'
import { NForm } from 'naive-ui'
import { onBeforeUnmount, useTemplateRef } from 'vue'

defineOptions({
  name: 'OpenPageNaiveForm',
  inheritAttrs: false,
})

const props = defineProps<UiFormWrapperProps>()
const formRef = useTemplateRef<FormInst>('form')

registerFormService(props.context, {
  reset,
  submit,
})

onBeforeUnmount(() => {
  unregisterFormService(props.context, reset)
})

/**
 * 注册当前组件库表单服务。
 *
 * @param context 当前 OpenPage 运行时上下文。
 * @param service 当前表单服务。
 */
function registerFormService(
  context: UiFormWrapperProps['context'],
  service: NonNullable<UiFormWrapperProps['context']['services']['form']>,
): void {
  context.services.form = service
}

/**
 * 移除当前组件注册的表单服务。
 *
 * @param context 当前 OpenPage 运行时上下文。
 * @param reset 当前组件注册的重置方法，用于避免误删其他表单服务。
 */
function unregisterFormService(
  context: UiFormWrapperProps['context'],
  reset: NonNullable<UiFormWrapperProps['context']['services']['form']>['reset'],
): void {
  if (context.services.form?.reset === reset) {
    context.services.form = undefined
  }
}

/**
 * 校验当前表单。
 *
 * @returns 返回表单是否校验通过。
 */
async function submit(): Promise<boolean> {
  try {
    await formRef.value?.validate()
    return true
  }
  catch {
    return false
  }
}

/**
 * 清除当前表单校验状态。
 *
 * @returns 返回重置是否完成。
 */
function reset(): boolean {
  formRef.value?.restoreValidation()
  return true
}
</script>

<template>
  <NForm
    ref="form"
    :model="props.context.state"
    label-placement="left"
    label-width="88"
    require-mark-placement="right-hanging"
    :show-feedback="false"
  >
    <slot />
  </NForm>
</template>
