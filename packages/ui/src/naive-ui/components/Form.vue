<script setup lang="ts">
import type { CompiledComponent, RuntimeValidateTarget } from '@openpage/core'
import type { FormInst, FormItemRule, FormValidationError } from 'naive-ui'
import type { UiFormProps } from '../../types'
import { getModelKey, getModelValue } from '@openpage/core'
import { NForm } from 'naive-ui'
import { computed, onBeforeUnmount, useTemplateRef } from 'vue'

defineOptions({
  name: 'OpenPageNaiveForm',
  inheritAttrs: false,
})

const props = defineProps<UiFormProps>()
const formRef = useTemplateRef<FormInst>('form')
const formModel = computed(resolveFormModel)

registerFormService(props.context, {
  reset,
  validate,
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
 * @returns 返回表单是否校验通过。
 */
async function validate(target?: RuntimeValidateTarget): Promise<boolean> {
  try {
    const paths = resolveValidatePaths(target)

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
 * @param paths 本次需要校验的字段路径集合。
 * @returns 返回当前规则是否需要执行。
 */
function shouldValidateRule(rule: FormItemRule, paths: Set<string>): boolean {
  return typeof rule.key === 'string' && paths.has(rule.key)
}

/**
 * 解析本次校验需要覆盖的字段路径集合。
 *
 * @param target 组件标识、组件标识数组或空值。
 * @returns 不传目标时返回空值；传入目标时返回字段路径集合。
 */
function resolveValidatePaths(target?: RuntimeValidateTarget): Set<string> | undefined {
  if (target === undefined) {
    return undefined
  }

  const paths = new Set<string>()
  const targets = Array.isArray(target) ? target : [target]

  for (const item of targets) {
    const path = resolveValidatePath(item)

    if (path) {
      paths.add(path)
    }
  }

  return paths
}

/**
 * 将组件标识解析为表单字段路径。
 *
 * @param target 组件 id、组件 name 或直接字段路径。
 * @returns 返回可交给 Naive UI 表单项识别的字段路径。
 */
function resolveValidatePath(target: string): string {
  const component = resolveValidateComponent(target)

  if (component?.model) {
    return getModelKey(component.model)
  }

  return target
}

/**
 * 按组件 id 或组件 name 查找需要校验的组件。
 *
 * @param target 组件 id 或组件 name。
 * @returns 返回匹配到的编译后组件。
 */
function resolveValidateComponent(target: string): CompiledComponent | undefined {
  const directComponent = props.context.compiled.components.get(target)

  if (directComponent) {
    return directComponent
  }

  const namedComponentId = props.context.compiled.componentNames.get(target)

  return namedComponentId
    ? props.context.compiled.components.get(namedComponentId)
    : undefined
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
