<script setup lang="ts">
import type { UiAdapter } from '@openpage/renderer'
import { Renderer } from '@openpage/renderer'
import { useMessage } from 'naive-ui'
import { computed, useTemplateRef } from 'vue'
import { useResizableSplit } from '../composables/useResizableSplit'
import { useSchemaEditor } from '../composables/useSchemaEditor'
import { testSchema } from '../schema'
import MonacoEditor from './monaco-editor'
import Scrollbar from './scrollbar/scrollbar.vue'

defineProps<{
  adapter: UiAdapter
}>()

const message = useMessage()
const splitContainer = useTemplateRef<HTMLElement>('splitContainer')
const platform = computed(() => ({
  message,
}))
const { schema, source } = useSchemaEditor(testSchema)
const { isResizing, leftPanelStyle, startResize } = useResizableSplit(splitContainer)
</script>

<template>
  <main ref="splitContainer" class="playground" :class="{ 'playground--resizing': isResizing }">
    <section class="playground__editor-panel" :style="leftPanelStyle">
      <MonacoEditor v-model="source" language="json" />
    </section>

    <div class="playground__divider" role="separator" aria-orientation="vertical" @pointerdown="startResize" />

    <div class="view-panel">
      <Scrollbar>
        <div class="openpage-shell">
          <Renderer :adapter="adapter" :schema="schema" :platform="platform" />
        </div>
      </Scrollbar>
    </div>
  </main>
</template>

<style scoped>
.playground {
  display: flex;
  height: 100vh;
  min-height: 0;
  overflow: hidden;
  width: 100%;
}

.playground__divider:hover,
.playground--resizing .playground__divider {
  background: #3b82f6;
}

.playground--resizing {
  cursor: col-resize;
  user-select: none;
}

.playground__editor-panel,
.playground__preview-panel {
  background: #18181b;
  display: flex;
  min-height: 0;
  min-width: 0;
  overflow: hidden;
}

.playground__editor-panel {
  flex: 0 0 auto;
  flex-direction: column;
}

.playground__preview-panel {
  flex: 1;
  flex-direction: column;
  background:
    linear-gradient(#f4f4f5 1px, transparent 1px),
    linear-gradient(90deg, #f4f4f5 1px, transparent 1px),
    #fafafa;
  background-size: 32px 32px;
}

.playground__divider {
  align-items: center;
  background: #d4d4d8;
  cursor: col-resize;
  display: flex;
  flex: 0 0 2px;
  justify-content: center;
  position: relative;
  touch-action: none;
  transition: background-color 160ms ease;
  z-index: 2;
}

.view-panel {
  flex: 1;
  min-height: 0;
}

.open-shell {
  padding: 10px;
}
</style>
