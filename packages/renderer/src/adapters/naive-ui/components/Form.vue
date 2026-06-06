<script setup lang="ts">
import type { FormInst } from 'naive-ui'
import type { RendererEventHandler } from '../../../types/runtime'
import type { UiNodeProps } from '../../types'
import { NForm } from 'naive-ui'
import { computed, onBeforeUnmount, ref, watchEffect } from 'vue'

defineOptions({
  name: 'OpenPageNaiveForm',
})

const props = defineProps<UiNodeProps>()

const formRef = ref<FormInst | null>(null)
const model = computed(() => props.context.state)

watchEffect((onCleanup) => {
  const formName = props.node.name

  if (!formName) {
    return
  }

  const events = resolveFormEvents(formName)
  events.set('submit', submitForm)

  onCleanup(() => {
    events.delete('submit')

    if (events.size === 0) {
      props.context.eventHandlers.delete(formName)
    }
  })
})

onBeforeUnmount(() => {
  const formName = props.node.name

  if (!formName) {
    return
  }

  props.context.eventHandlers.delete(formName)
})

/**
 * 获取指定表单名称的事件集合。
 *
 * @param formName 需要注册事件的表单名称。
 * @returns 返回当前表单名称对应的事件集合。
 */
function resolveFormEvents(formName: string): Map<string, RendererEventHandler> {
  const existedEvents = props.context.eventHandlers.get(formName)

  if (existedEvents) {
    return existedEvents
  }

  const events = new Map<string, RendererEventHandler>()
  props.context.eventHandlers.set(formName, events)

  return events
}

/**
 * 执行表单提交校验和提交事件。
 *
 * @returns 返回表单校验是否通过。
 */
async function submitForm(): Promise<boolean> {
  try {
    await formRef.value?.validate()
    await props.emitNodeEvent('submit')
    return true
  }
  catch {
    return false
  }
}
</script>

<template>
  <NForm
    ref="formRef"
    label-placement="left"
    :model="model"
    :label-width="108"
    require-mark-placement="right-hanging"
    size="medium"
  >
    <slot />
  </NForm>
</template>
