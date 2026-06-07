<script setup lang="ts">
import type { UiComponentProps } from '../../types'
import { NFormItem, NQrCode } from 'naive-ui'
import { computed } from 'vue'
import { useFormField } from '../composables/useFormField'

defineOptions({ name: 'OpenPageNaiveQrCode' })

const props = defineProps<UiComponentProps>()
const field = useFormField(props)
const value = computed(resolveValue)

/**
 * 解析二维码展示值。
 *
 * @returns 返回二维码使用的字符串值。
 */
function resolveValue(): string {
  return String(props.value ?? props.component.props.value ?? '')
}
</script>

<template>
  <NFormItem :label="field.label.value">
    <NQrCode
      v-bind="props.component.props"
      class="openpage-naive-qr-code"
      :value="value"
      color="#409eff"
      background-color="#F5F5F5"
    />
  </NFormItem>
</template>

<style scoped>
.openpage-naive-qr-code {
  box-sizing: content-box;
}
</style>
