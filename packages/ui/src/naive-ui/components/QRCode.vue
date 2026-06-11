<script setup lang="ts">
import type { UiComponentProps } from '../../types'
import { NQrCode } from 'naive-ui'
import { computed } from 'vue'
import { useFormField } from '../composables/useFormField'

defineOptions({
  name: 'OpenPageNaiveQrCode',
  inheritAttrs: false,
})

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
  <div class="openpage-naive-qr-code-field">
    <div
      v-if="field.label.value"
      class="openpage-naive-qr-code-label"
    >
      {{ field.label.value }}
    </div>
    <NQrCode
      v-bind="props.component.props"
      class="openpage-naive-qr-code"
      :value="value"
      color="#409eff"
      background-color="#F5F5F5"
    />
  </div>
</template>

<style scoped>
.openpage-naive-qr-code-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.openpage-naive-qr-code-label {
  color: rgba(31, 41, 55, 0.82);
  font-size: 14px;
  line-height: 1.4;
}

.openpage-naive-qr-code {
  box-sizing: content-box;
}
</style>
