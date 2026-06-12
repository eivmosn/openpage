<script setup lang="ts">
import type { FormInst, FormValidationError } from 'naive-ui'
import type { UiFormWrapperProps } from '../../types'
import { getModelKey, getModelValue } from '@openpage/core'
import { NForm } from 'naive-ui'
import { computed, onBeforeUnmount, useTemplateRef } from 'vue'

defineOptions({
  name: 'OpenPageNaiveForm',
  inheritAttrs: false,
})

const props = defineProps<UiFormWrapperProps>()
const formRef = useTemplateRef<FormInst>('form')
const formModel = computed(resolveFormModel)

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
async function submit(): Promise<{ message?: string, valid: boolean }> {
  try {
    await formRef.value?.validate()
    return {
      valid: true,
    }
  }
  catch (error) {
    return {
      message: resolveValidationMessage(error),
      valid: false,
    }
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

/**
 * 解析 Naive UI 表单校验模型。
 *
 * @returns 返回包含单路径字段和多路径虚拟字段的表单模型。
 */
function resolveFormModel(): Record<string, unknown> {
  const model: Record<string, unknown> = {
    ...props.context.state,
  }

  for (const component of props.context.compiled.components.values()) {
    if (!component.model) {
      continue
    }

    model[getModelKey(component.model)] = getModelValue(props.context.state, component.model)
  }

  return model
}

/**
 * 解析校验错误文案。
 *
 * @param error Naive UI 校验抛出的错误。
 * @returns 返回第一条可展示的校验文案。
 */
function resolveValidationMessage(error: unknown): string | undefined {
  if (!Array.isArray(error)) {
    return undefined
  }

  for (const errors of error as FormValidationError[]) {
    const message = errors[0]?.message

    if (typeof message === 'string' && message.length > 0) {
      return message
    }
  }

  return undefined
}
</script>

<template>
  <NForm
    ref="form"
    class="openpage-naive-form"
    :model="formModel"
    label-placement="left"
    label-width="88"
    require-mark-placement="right-hanging"
    :show-feedback="false"
  >
    <slot />
  </NForm>
</template>

<style scoped>
.openpage-naive-form {
  box-sizing: border-box;
  height: 100%;
  min-height: 0;
  min-width: 0;
  width: 100%;
}
</style>
