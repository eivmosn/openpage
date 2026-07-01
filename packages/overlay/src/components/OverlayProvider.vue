<script setup lang="ts">
import type { OverlayProviderProps } from '../types'
import { useOverlayProvider } from '../composables/useOverlayProvider'
import OverlayPanel from './OverlayPanel.vue'

const props = defineProps<OverlayProviderProps>()

const {
  containerStyle,
  handleAfterLeave,
  handleMaskClick,
  itemViews,
} = useOverlayProvider(props)
</script>

<template>
  <slot />

  <Teleport
    v-for="view in itemViews"
    :key="view.item.id"
    :to="view.target"
  >
    <div
      class="overlay-vue-container"
      :class="{ 'is-local-target': view.isLocalTarget }"
      :style="containerStyle"
    >
      <Transition name="overlay-vue-mask">
        <div
          v-if="view.item.show"
          aria-hidden="true"
          class="overlay-vue-mask"
          :style="{ zIndex: view.item.zIndex }"
          @click="handleMaskClick(view.item.id)"
        />
      </Transition>

      <Transition
        :name="view.transitionName"
        @after-leave="handleAfterLeave(view.item.id)"
      >
        <OverlayPanel
          v-if="view.item.show"
          :key="view.item.id"
          :content-wrapper="contentWrapper"
          :content-wrapper-props="contentWrapperProps"
          :drawer="drawer"
          :item="view.item"
          :modal="modal"
        />
      </Transition>
    </div>
  </Teleport>
</template>
