<script setup lang="ts">
import type { CompiledComponent, RuntimeValidateOptions, RuntimeValidateTarget } from '@openpage/core'
import type { FormInst, FormItemInst, FormItemRule, FormValidationError } from 'naive-ui'
import type { UiFormProps } from '../../types'
import { getModelKey, getModelValue } from '@openpage/core'
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
    const paths = resolveValidatePaths(target, options)

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
function shouldValidateRule(rule: FormItemRule, paths: ValidatePathSet): boolean {
  if (typeof rule.key !== 'string') {
    return false
  }

  if (paths.ignored.has(rule.key)) {
    return false
  }

  return paths.included ? paths.included.has(rule.key) : true
}

/**
 * 解析本次校验需要覆盖的字段路径集合。
 *
 * @param target 组件标识、组件标识数组或空值。
 * @param options 当前校验配置。
 * @returns 不传目标且没有忽略项时返回空值；否则返回字段路径集合。
 */
function resolveValidatePaths(target?: RuntimeValidateTarget, options?: RuntimeValidateOptions): ValidatePathSet | undefined {
  if (target === undefined && !options?.ignore?.length) {
    return undefined
  }

  const included = target === undefined ? undefined : new Set<string>()
  const ignored = new Set<string>()
  const targets = Array.isArray(target) ? target : [target]

  for (const item of targets) {
    if (item !== undefined) {
      resolveValidatePathsByTarget(item, included)
    }
  }

  for (const item of options?.ignore || []) {
    resolveValidatePathsByTarget(item, ignored)
  }

  return {
    ignored,
    included,
  }
}

/**
 * 将组件标识解析为表单字段路径集合。
 *
 * @param target 组件 id、组件 name 或直接字段路径。
 * @param paths 需要写入的字段路径集合。
 */
function resolveValidatePathsByTarget(target: string, paths: Set<string> | undefined): void {
  if (!paths) {
    return
  }

  const component = resolveValidateComponent(target)

  if (!component) {
    paths.add(target)
    return
  }

  collectValidatePaths(component, paths)
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
 * 递归收集组件及其子组件的表单字段路径。
 *
 * @param component 当前组件。
 * @param paths 需要写入的字段路径集合。
 */
function collectValidatePaths(component: CompiledComponent, paths: Set<string>): void {
  if (component.model) {
    paths.add(getModelKey(component.model))
  }

  for (const childId of component.children) {
    const child = props.context.compiled.components.get(childId)

    if (child) {
      collectValidatePaths(child, paths)
    }
  }
}

interface ValidatePathSet {
  ignored: Set<string>
  included?: Set<string>
}

/**
 * 清除当前表单校验状态。
 *
 * @param target 需要重置的组件标识或标识数组，不传时重置整个表单。
 * @param options 当前重置配置。
 * @returns 返回重置是否完成。
 */
function reset(target?: RuntimeValidateTarget, options?: RuntimeValidateOptions): boolean {
  const paths = resolveValidatePaths(target, options)

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
function shouldHandlePath(path: string, paths: ValidatePathSet): boolean {
  if (paths.ignored.has(path)) {
    return false
  }

  return paths.included ? paths.included.has(path) : true
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
