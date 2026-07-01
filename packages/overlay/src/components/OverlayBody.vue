<script setup lang="ts">
import type { OverlayConfirmHandler, OverlayItem } from '../types'
import { getCurrentScope, onBeforeUnmount, onScopeDispose, provide } from 'vue'
import { overlay, overlayContextKey } from '../composables/useOverlay'

const props = defineProps<{
  item: OverlayItem
}>()

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
 * 注册确认按钮点击时执行的处理函数。
 *
 * @param handler 确认处理函数。
 */
function handleConfirm(handler: OverlayConfirmHandler): void {
  overlay.setConfirmHandler(props.item.id, handler)

  if (getCurrentScope()) {
    onScopeDispose(() => overlay.setConfirmHandler(props.item.id))
  }
}

/**
 * 设置确认按钮 loading 状态。
 *
 * @param loading 是否显示 loading。
 */
function setConfirmLoading(loading: boolean): void {
  overlay.setConfirmLoading(props.item.id, loading)
}

/**
 * 设置或清空确认处理函数。
 *
 * @param handler 确认处理函数；不传时清空。
 */
function setConfirmHandler(handler?: OverlayConfirmHandler): void {
  overlay.setConfirmHandler(props.item.id, handler)
}

provide(overlayContextKey, {
  id: props.item.id,
  close: closeOverlay,
  cancel: cancelOverlay,
  confirm: confirmOverlay,
  onConfirm: handleConfirm,
  setConfirmLoading,
  setConfirmHandler,
})

onBeforeUnmount(() => {
  overlay.setConfirmHandler(props.item.id)
})
</script>

<template>
  <div v-if="item.options.bodyFullHeight" class="overlay-vue-body-full">
    <component :is="item.component" v-bind="item.props" />
  </div>
  <component :is="item.component" v-else v-bind="item.props" />
</template>
