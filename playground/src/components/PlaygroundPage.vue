<script setup lang="ts">
import type { UiAdapter } from '@openpage/core'
import { Page } from '@openpage/core'
import { NButton, NTooltip, useMessage } from 'naive-ui'
import { computed, onBeforeUnmount, shallowRef, useTemplateRef } from 'vue'
import { useResizablePanels } from '../composables/useResizablePanels'
import { useSchemaEditor } from '../composables/useSchemaEditor'
import { useStateEditor } from '../composables/useStateEditor'
import { testSchema, testState } from '../schema'
import { createStressTestData } from '../stress/createStressTestData'
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
const { schema, source: schemaSource, syncSchemaSource } = useSchemaEditor(testSchema)
const { source: stateSource, state, syncStateSource } = useStateEditor(testState)
const { activeDivider, gridTemplateColumns, isResizing, startResize } = useResizablePanels(playground)
const isLoadingMockState = shallowRef(false)
const isLoadingStressTest = shallowRef(false)
const stressFieldCount = shallowRef(1_000)
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
      form: {
        ...(state.value.form as Record<string, unknown>),
        a: 1280,
        b: 720,
      },
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
    :style="{ '--playground-columns': gridTemplateColumns }"
  >
    <section class="playground__panel playground__editor-panel">
      <header class="playground__panel-header">
        <span>Schema</span>
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
      <Scrollbar>
        <div class="openpage-shell">
          <Page
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
        <span>State</span>
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
