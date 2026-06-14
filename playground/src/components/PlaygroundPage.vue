<script setup lang="ts">
import type { OpenPageComponents } from '@openpage/core'
import { Page } from '@openpage/core'
import { useMessage } from 'naive-ui'
import { markRaw, useTemplateRef } from 'vue'
import { useResizablePanels } from '../composables/useResizablePanels'
import { useSchemaEditor } from '../composables/useSchemaEditor'
import { testSchema, testState } from '../schema'
import MonacoEditor from './monaco-editor'

defineProps<{
  components?: OpenPageComponents
}>()

const message = useMessage()
const ctx = markRaw({
  message,
  theme: 'playground',
})

const playground = useTemplateRef<HTMLElement>('playground')
const { schema, source: schemaSource } = useSchemaEditor(testSchema)
const { activeDivider, panelFlexBasis, isResizing, startResize } = useResizablePanels(playground)
const initState = testState
</script>

<template>
  <main
    ref="playground"
    class="playground"
    :class="{ 'playground--resizing': isResizing }"
    :style="panelFlexBasis"
  >
    <section class="playground__panel playground__editor-panel">
      <header class="playground__panel-header">
        <span>页面配置</span>
      </header>
      <MonacoEditor v-model="schemaSource" language="json" />
    </section>

    <div
      class="playground__divider"
      :class="{ 'playground__divider--active': activeDivider }"
      role="separator"
      aria-orientation="vertical"
      @pointerdown="startResize"
    />

    <section class="playground__panel playground__preview-panel">
      <Page
        :components="components"
        :ctx="ctx"
        :init-state="initState"
        :schema="schema"
      />
    </section>
  </main>
</template>

<style scoped>
.playground {
  display: flex;
  flex-direction: row;
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
  flex: 0 0 2px;
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
  flex: 0 1 auto;
  min-height: 0;
  min-width: 0;
  overflow: hidden;
    background:
    linear-gradient(#f4f4f5 1px, transparent 1px),
    linear-gradient(90deg, #f4f4f5 1px, transparent 1px),
    #fafafa;
  background-size: 32px 32px;
  box-sizing: border-box;
}

.playground__editor-panel:first-of-type {
  flex-basis: var(--playground-left-basis);
}

.playground__preview-panel {
  flex-basis: var(--playground-center-basis);
}

.playground__editor-panel :deep(.monaco-editor-host) {
  flex: 1;
  height: auto;
}

.playground__panel-header {
  align-items: center;
  background: #f4f4f5;
  border-bottom: 1px solid #eee;
  color: #52525b;
  display: flex;
  flex: 0 0 auto;
  font-size: 12px;
  font-weight: 600;
  gap: 6px;
  letter-spacing: 0.06em;
  padding: 6px 12px;
  text-transform: uppercase;
}

@media (max-width: 1100px) {
  .playground {
    flex-direction: column;
    overflow: auto;
  }

  .playground__panel {
    flex: 0 0 auto;
    min-height: 360px;
  }

  .playground__editor-panel:first-of-type,
  .playground__preview-panel {
    flex-basis: 360px;
  }

  .playground__divider {
    display: none;
  }
}
</style>
