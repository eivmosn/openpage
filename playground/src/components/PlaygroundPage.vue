<script setup lang="ts">
import type { UiAdapter } from '@openpage/renderer'
import { Renderer } from '@openpage/renderer'
import { useMessage } from 'naive-ui'
import { computed } from 'vue'
import { testSchema } from '../schema'

defineProps<{
  adapter: UiAdapter
}>()

const message = useMessage()

const platform = computed(() => ({
  message,
}))
</script>

<template>
  <main class="openpage-shell">
    <Renderer
      :adapter="adapter"
      :schema="testSchema"
      :platform="platform"
    />
  </main>
</template>
