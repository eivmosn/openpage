<script setup lang="ts">
import type { FormInst } from 'naive-ui'
import type { UiComponentProps } from '../../types'
import { NForm } from 'naive-ui'
import { computed, ref, watchEffect } from 'vue'

defineOptions({
  name: 'OpenPageNaiveForm',
})

const props = defineProps<UiComponentProps>()

const formRef = ref<FormInst | null>(null)
const model = computed(() => props.context.state)

watchEffect((onCleanup) => {
  const formName = props.component.name

  if (!formName) {
    return
  }

  const unregister = props.context.services.registerEventHandler?.(formName, 'submit', submitForm)
  onCleanup(() => unregister?.())
})

/**
 * 执行表单提交校验和提交事件。
 *
 * @returns 返回表单校验是否通过。
 */
async function submitForm(): Promise<boolean> {
  try {
    await formRef.value?.validate()
    await props.emitComponentEvent('submit')
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
