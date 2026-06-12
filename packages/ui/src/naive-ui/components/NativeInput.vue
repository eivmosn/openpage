<script setup lang="ts">
import type { UiComponentProps } from '../../types'
import { computed } from 'vue'
import { useFormField } from '../composables/useFormField'
import { useFormValidation } from '../utils/withFormValidation'

defineOptions({
  name: 'OpenPageNaiveNativeInput',
  inheritAttrs: false,
})

const props = defineProps<UiComponentProps>()
const field = useFormField(props)
const validation = useFormValidation()
const inputAttrs = computed(resolveInputAttrs)
const readonly = computed(() => props.component.computedValue !== undefined || props.component.props.readonly === true)

/**
 * 解析可透传给原生 input 的属性。
 *
 * @returns 返回过滤后的原生 input 属性，避免把校验规则等配置污染到 DOM。
 */
function resolveInputAttrs(): Record<string, unknown> {
  const {
    autocomplete,
    autofocus,
    inputmode,
    maxlength,
    minlength,
    name,
    pattern,
    spellcheck,
    step,
  } = props.component.props

  return {
    autocomplete,
    autofocus,
    inputmode,
    maxlength,
    minlength,
    name,
    pattern,
    spellcheck,
    step,
  }
}

/**
 * 处理原生输入事件并同步 OpenPage 模型。
 *
 * @param event 原生 input 事件。
 */
async function handleInput(event: Event): Promise<void> {
  const nextValue = (event.target as HTMLInputElement).value

  props.updateModelValue(nextValue)
  validation.triggerInput()
  await props.emitComponentEvent('oninput', nextValue)
}

/**
 * 处理原生变更事件并触发表单 change 校验。
 *
 * @param event 原生 change 事件。
 */
async function handleChange(event: Event): Promise<void> {
  const nextValue = (event.target as HTMLInputElement).value

  validation.triggerChange()
  await props.emitComponentEvent('onchange', nextValue)
}

/**
 * 处理原生聚焦事件并触发表单 focus 校验。
 */
function handleFocus(): void {
  validation.triggerFocus()
}

/**
 * 处理原生失焦事件并触发表单 blur 校验。
 */
function handleBlur(): void {
  validation.triggerBlur()
}
</script>

<template>
  <input
    v-bind="inputAttrs"
    class="openpage-native-input"
    :class="validation.statusClass.value"
    :disabled="field.disabled.value"
    :placeholder="field.placeholder.value"
    :readonly="readonly"
    :type="field.type.value"
    :value="field.value.value"
    @blur="handleBlur"
    @change="handleChange"
    @focus="handleFocus"
    @input="handleInput"
  >
</template>

<style scoped>
.openpage-native-input {
  box-sizing: border-box;
  width: 100%;
  height: 34px;
  padding: 0 12px;
  color: rgb(51 54 57);
  background-color: #fff;
  border: 1px solid rgb(224 224 230);
  border-radius: 3px;
  outline: none;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    background-color 0.2s ease;
}

.openpage-native-input:hover {
  border-color: rgb(54 163 247);
}

.openpage-native-input:focus {
  border-color: rgb(24 160 88);
  box-shadow: 0 0 0 2px rgb(24 160 88 / 20%);
}

.openpage-native-input--error {
  border-color: rgb(208 48 80);
}

.openpage-native-input--error:hover,
.openpage-native-input--error:focus {
  border-color: rgb(222 74 108);
}

.openpage-native-input--error:focus {
  box-shadow: 0 0 0 2px rgb(208 48 80 / 20%);
}

.openpage-native-input--warning {
  border-color: rgb(240 160 32);
}

.openpage-native-input--warning:hover,
.openpage-native-input--warning:focus {
  border-color: rgb(244 179 61);
}

.openpage-native-input--warning:focus {
  box-shadow: 0 0 0 2px rgb(240 160 32 / 20%);
}

.openpage-native-input--success {
  border-color: rgb(24 160 88);
}

.openpage-native-input--success:hover,
.openpage-native-input--success:focus {
  border-color: rgb(54 179 113);
}

.openpage-native-input--success:focus {
  box-shadow: 0 0 0 2px rgb(24 160 88 / 20%);
}

.openpage-native-input:disabled {
  color: rgb(194 194 194);
  cursor: not-allowed;
  background-color: rgb(250 250 252);
}
</style>
