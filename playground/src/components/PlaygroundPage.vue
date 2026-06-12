<script setup lang="ts">
import type { OpenPageComponents } from '@openpage/core'
import { Page } from '@openpage/core'
import { NButton, NTooltip, useMessage } from 'naive-ui'
import { computed, onBeforeUnmount, shallowRef, useTemplateRef } from 'vue'
import { useResizablePanels } from '../composables/useResizablePanels'
import { useSchemaEditor } from '../composables/useSchemaEditor'
import { useStateEditor } from '../composables/useStateEditor'
import { testSchema, testState } from '../schema'
import { createStressTestData } from '../stress/createStressTestData'
import MonacoEditor from './monaco-editor'

defineProps<{
  components?: OpenPageComponents
}>()

const message = useMessage()
const platform = computed(() => ({
  message,
}))

const playground = useTemplateRef<HTMLElement>('playground')
const { schema, source: schemaSource, syncSchemaSource } = useSchemaEditor(testSchema)
const { source: stateSource, state, syncStateSource } = useStateEditor(testState)
const { activeDivider, panelFlexBasis, isResizing, startResize } = useResizablePanels(playground)
const isLoadingMockState = shallowRef(false)
const isLoadingStressTest = shallowRef(false)
const stressFieldCount = shallowRef(500)
let mockRequestTimer: ReturnType<typeof setTimeout> | undefined

/**
 * 模拟接口延迟返回并替换外部受控 State。
 */
function loadMockState(): void {
  if (isLoadingMockState.value) {
    return
  }

  isLoadingMockState.value = true
  mockRequestTimer = setTimeout(() => {
    syncStateSource({
      ...state.value,
      a: 1280,
      b: 720,
    })
    isLoadingMockState.value = false
  }, 1200)
}

/**
 * 异步生成并渲染指定数量的表单字段压力测试。
 */
async function loadStressTest(): Promise<void> {
  if (isLoadingStressTest.value) {
    return
  }

  isLoadingStressTest.value = true

  try {
    const stressData = await createStressTestData(stressFieldCount.value)
    syncStateSource(stressData.state)
    syncSchemaSource(stressData.schema)
  }
  finally {
    isLoadingStressTest.value = false
  }
}

onBeforeUnmount(() => {
  clearTimeout(mockRequestTimer)
})
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
        <NTooltip :show-arrow="false">
          <template #trigger>
            <NButton
              :disabled="isLoadingStressTest"
              type="primary"
              @click="loadStressTest"
            >
              {{ isLoadingStressTest ? '生成中...' : `异步渲染 ${stressFieldCount} 字段` }}
            </NButton>
          </template>
          日常页面很少在单个表单中出现 500 个以上字段，1000 个字段更为少见。
        </NTooltip>
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
      <Page
        :components="components"
        :schema="schema"
        :state="state"
        :platform="platform"
        @update:state="syncStateSource"
      />
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
        <span>页面状态</span>
        <NButton
          :disabled="isLoadingMockState"
          type="primary"
          @click="loadMockState"
        >
          {{ isLoadingMockState ? '加载中...' : '异步模拟赋值' }}
        </NButton>
      </header>
      <MonacoEditor v-model="stateSource" language="json" />
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

.playground__editor-panel:last-of-type {
  flex-basis: var(--playground-right-basis);
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

.playground__preview-header {
  background: #f4f4f5;
  color: #52525b;
}

.playground__stress-count {
  margin-left: auto;
  width: 82px;
}

.playground__panel-header > .open-button {
  margin-left: auto;
}

.playground__preview-scrollbar {
  flex: 1;
  min-height: 0;
  min-width: 0;
}

.openpage-shell {
  max-width: 100%;
  min-height: 100%;
  min-width: 0;
  overflow-x: hidden;
  padding: 20px;
  width: 100%;
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
  .playground__preview-panel,
  .playground__editor-panel:last-of-type {
    flex-basis: 360px;
  }

  .playground__divider {
    display: none;
  }
}
</style>
