<script setup lang="ts">
import type { RuntimeModelPathSet, RuntimeValidateOptions, RuntimeValidateTarget } from '@openpage/core'
import type { FormInst, FormItemInst, FormItemRule, FormValidationError } from 'naive-ui'
import type { UiFormProps } from '../../types'
import { getModelKey, getModelValue, resolveRuntimeModelPaths, shouldHandleRuntimeModelPath } from '@openpage/core'
import { NForm } from 'naive-ui'
import { computed, onBeforeUnmount, provide, useTemplateRef } from 'vue'
import { naiveFormItemRegistryKey } from '../utils/formItemRegistry'

defineOptions({
  name: 'OpenPageNaiveForm',
  inheritAttrs: false,
})

const props = defineProps<UiFormProps>()
const formRef = useTemplateRef<FormInst>('form')
const formModel = computed(resolveFormModel)
const formItems = new Map<string, Set<FormItemInst>>()

registerFormService(props.context, {
  reset,
  validate,
})
provide(naiveFormItemRegistryKey, {
  register: registerFormItem,
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
  context: UiFormProps['context'],
  service: NonNullable<UiFormProps['context']['services']['form']>,
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
  context: UiFormProps['context'],
  reset: NonNullable<UiFormProps['context']['services']['form']>['reset'],
): void {
  if (context.services.form?.reset === reset) {
    context.services.form = undefined
  }
}

/**
 * 校验当前表单。
 *
 * @param target 需要校验的组件标识或标识数组，不传时校验整个表单。
 * @param options 当前校验配置。
 * @returns 返回表单是否校验通过。
 */
async function validate(target?: RuntimeValidateTarget, options?: RuntimeValidateOptions): Promise<boolean> {
  try {
    const paths = resolveRuntimeModelPaths(props.context, target, options)

    await formRef.value?.validate(undefined, paths
      ? rule => shouldValidateRule(rule, paths)
      : undefined)

    return true
  }
  catch (error) {
    const message = resolveValidationMessage(error)

    if (message) {
      props.context.services.message?.error?.(message)
    }

    return false
  }
}

/**
 * 判断当前规则是否属于本次目标校验范围。
 *
 * @param rule 当前 Naive UI 表单项规则。
 * @param paths 本次字段校验配置。
 * @returns 返回当前规则是否需要执行。
 */
function shouldValidateRule(rule: FormItemRule, paths: RuntimeModelPathSet): boolean {
  if (typeof rule.key !== 'string') {
    return false
  }

  return shouldHandleRuntimeModelPath(rule.key, paths)
}

/**
 * 清除当前表单校验状态。
 *
 * @param target 需要重置的组件标识或标识数组，不传时重置整个表单。
 * @param options 当前重置配置。
 * @returns 返回重置是否完成。
 */
function reset(target?: RuntimeValidateTarget, options?: RuntimeValidateOptions): boolean {
  const paths = resolveRuntimeModelPaths(props.context, target, options)

  if (!paths) {
    formRef.value?.restoreValidation()
    return true
  }

  for (const [path, items] of formItems) {
    if (!shouldHandlePath(path, paths)) {
      continue
    }

    for (const item of items) {
      item.restoreValidation()
    }
  }

  return true
}

/**
 * 判断当前字段路径是否属于本次操作范围。
 *
 * @param path 当前表单字段路径。
 * @param paths 本次字段操作配置。
 * @returns 返回当前字段是否需要处理。
 */
function shouldHandlePath(path: string, paths: RuntimeModelPathSet): boolean {
  return shouldHandleRuntimeModelPath(path, paths)
}

/**
 * 注册 Naive UI 表单项实例。
 *
 * @param path 当前表单项字段路径。
 * @param item 当前 Naive UI 表单项实例。
 * @returns 返回当前表单项的注销函数。
 */
function registerFormItem(path: string, item: FormItemInst): () => void {
  let items = formItems.get(path)

  if (!items) {
    items = new Set<FormItemInst>()
    formItems.set(path, items)
  }

  items.add(item)

  return () => {
    items?.delete(item)

    if (items?.size === 0) {
      formItems.delete(path)
    }
  }
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

  for (const component of props.context.compiled.modelComponents) {
    model[getModelKey(component.model)] = getModelValue(props.context.state, component.model)
  }

  for (const patch of Object.values(props.context.componentPatches)) {
    const patchedComponent = patch?.resolvedComponent

    if (patchedComponent?.model) {
      model[getModelKey(patchedComponent.model)] = getModelValue(props.context.state, patchedComponent.model)
    }
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
