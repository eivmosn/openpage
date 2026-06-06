<script setup lang="ts">
import type { UiAdapter } from '@openpage/renderer'
import { Renderer } from '@openpage/renderer'
import { useMessage } from 'naive-ui'
import { computed, useTemplateRef } from 'vue'
import { useResizablePanels } from '../composables/useResizablePanels'
import { useSchemaEditor } from '../composables/useSchemaEditor'
import { useStateEditor } from '../composables/useStateEditor'
import { testSchema, testState } from '../schema'
import MonacoEditor from './monaco-editor'
import Scrollbar from './scrollbar/scrollbar.vue'

defineProps<{
  adapter: UiAdapter
}>()

const message = useMessage()
const platform = computed(() => ({
  message,
}))
const playground = useTemplateRef<HTMLElement>('playground')
const { schema, source: schemaSource } = useSchemaEditor(testSchema)
const { source: stateSource, state, syncStateSource } = useStateEditor(testState)
const { activeDivider, gridTemplateColumns, isResizing, startResize } = useResizablePanels(playground)
</script>

<template>
  <main
    ref="playground"
    class="playground"
    :class="{ 'playground--resizing': isResizing }"
    :style="{ '--playground-columns': gridTemplateColumns }"
  >
    <section class="playground__panel playground__editor-panel">
      <header class="playground__panel-header">
        Schema
      </header>
      <MonacoEditor v-model="schemaSource" language="json" />
    </section>

    <div
      class="playground__divider"
      :class="{ 'playground__divider--active': activeDivider === 0 }"
      role="separator"
      aria-orientation="vertical"
      @pointerdown="startResize(0, $event)"
    />

    <section class="playground__panel playground__preview-panel">
      <header class="playground__panel-header playground__preview-header">
        Preview
      </header>
      <Scrollbar>
        <div class="openpage-shell">
          <Renderer
            :adapter="adapter"
            :schema="schema"
            :state="state"
            :platform="platform"
            @update:state="syncStateSource"
          />
        </div>
      </Scrollbar>
    </section>

    <div
      class="playground__divider"
      :class="{ 'playground__divider--active': activeDivider === 1 }"
      role="separator"
      aria-orientation="vertical"
      @pointerdown="startResize(1, $event)"
    />

    <section class="playground__panel playground__editor-panel">
      <header class="playground__panel-header">
        State
      </header>
      <MonacoEditor v-model="stateSource" language="json" />
    </section>
  </main>
</template>

<style scoped>
.playground {
  display: grid;
  grid-template-columns: var(--playground-columns);
  height: 100vh;
  min-height: 0;
  overflow: hidden;
  width: 100%;
}

.playground--resizing {
  cursor: e-resize;
  user-select: none;
}

.playground--resizing :deep(*) {
  pointer-events: none;
}

.playground__divider {
  background: #eee;
  cursor: e-resize;
  min-height: 0;
  touch-action: none;
  transition: background-color 160ms ease;
}

.playground__divider:hover,
.playground__divider--active {
  background: #3b82f6;
}

.playground__panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
  min-width: 0;
  overflow: hidden;
}

.playground__editor-panel :deep(.monaco-editor-host) {
  flex: 1;
  height: auto;
}

.playground__preview-panel {
  background: #fafafa;
}

.playground__panel-header {
  align-items: center;
  background: #f4f4f5;
  color: #52525b;
  display: flex;
  flex: 0 0 36px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.06em;
  padding: 0 12px;
  text-transform: uppercase;
  border-bottom: 1px solid #eee;
}

.playground__preview-header {
  background: #f4f4f5;
  color: #52525b;
}

.playground__preview-panel :deep(.open-scrollbar) {
  flex: 1;
  min-height: 0;
}

.openpage-shell {
  background:
    linear-gradient(#f4f4f5 1px, transparent 1px),
    linear-gradient(90deg, #f4f4f5 1px, transparent 1px),
    #fafafa;
  background-size: 32px 32px;
  min-height: 100%;
  padding: 20px;
}

@media (max-width: 1100px) {
  .playground {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: repeat(3, minmax(360px, 1fr));
    overflow: auto;
  }

  .playground__divider {
    display: none;
  }
}
</style>
