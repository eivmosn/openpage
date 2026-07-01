<script setup lang="ts">
import type { OverlayFooterContext, OverlayItem } from '../types'
import { computed } from 'vue'
import { overlay } from '../composables/useOverlay'
import OverlayRenderContent from './OverlayRenderContent'

const props = defineProps<{
  item: OverlayItem
}>()

const footerContext = computed<OverlayFooterContext>(() => ({
  item: props.item,
  close: closeOverlay,
  cancel: cancelOverlay,
  confirm: confirmOverlay,
  triggerConfirm,
}))

/**
 * 关闭当前弹层。
 */
function closeOverlay(): void {
  overlay.close(props.item.id)
}

/**
 * 取消当前弹层。
 */
function cancelOverlay(): void {
  overlay.cancel(props.item.id)
}

/**
 * 确认当前弹层。
 *
 * @param value 确认时返回给调用方的数据。
 */
function confirmOverlay(value?: unknown): void {
  overlay.confirm(props.item.id, value)
}

/**
 * 触发当前弹层的确认处理。
 */
function triggerConfirm(): void {
  void overlay.triggerConfirm(props.item.id)
}
</script>

<template>
  <OverlayRenderContent
    v-if="item.options.footer"
    :content="item.options.footer(footerContext)"
  />
  <div v-else class="overlay-vue-footer-actions">
    <button
      v-if="item.options.showCancel"
      class="overlay-vue-button overlay-vue-button--default"
      :disabled="item.confirmLoading"
      type="button"
      @click="footerContext.cancel"
    >
      {{ item.options.cancelText }}
    </button>
    <button
      v-if="item.options.showConfirm"
      class="overlay-vue-button overlay-vue-button--primary"
      :aria-busy="item.confirmLoading ? 'true' : undefined"
      :disabled="item.confirmLoading"
      type="button"
      @click="footerContext.triggerConfirm"
    >
      {{ item.confirmLoading ? '处理中...' : item.options.confirmText }}
    </button>
  </div>
</template>
