<script setup lang="ts">
import type { MonacoDisposable, MonacoEditor } from './editor'
import { onBeforeUnmount, onMounted, useTemplateRef, watch } from 'vue'
import { createMonaco } from './editor'

defineOptions({
  name: 'PlaygroundMonacoEditor',
})

const props = withDefaults(defineProps<{
  language?: string
}>(), {
  language: 'json',
})

const model = defineModel<string>({
  default: '',
})

const editorElement = useTemplateRef<HTMLDivElement>('editorElement')
let editorInstance: MonacoEditor | undefined
let contentSubscription: MonacoDisposable | undefined
let disposed = false

/**
 * 将外部模型值同步到 Monaco Editor。
 *
 * @param value 最新的编辑器文本。
 */
function syncEditorValue(value: string): void {
  if (!editorInstance || editorInstance.getValue() === value) {
    return
  }

  editorInstance.setValue(value)
}

watch(model, syncEditorValue)

onMounted(async () => {
  if (!editorElement.value) {
    return
  }

  const monaco = await createMonaco()

  if (disposed || !editorElement.value) {
    return
  }

  editorInstance = monaco.editor.create(editorElement.value, {
    automaticLayout: true,
    cursorBlinking: 'smooth',
    fontFamily: 'JetBrains Mono, Cascadia Code, Consolas, monospace',
    fontSize: 13,
    formatOnPaste: true,
    formatOnType: true,
    minimap: {
      enabled: false,
    },
    padding: {
      bottom: 16,
      top: 16,
    },
    scrollBeyondLastLine: false,
    smoothScrolling: true,
    wordWrap: 'on',
  })

  const textModel = monaco.editor.createModel(model.value, props.language)
  editorInstance.setModel(textModel)
  const currentEditor = editorInstance

  contentSubscription = currentEditor.onDidChangeModelContent(() => {
    model.value = currentEditor.getValue()
  })
})

onBeforeUnmount(() => {
  disposed = true
  contentSubscription?.dispose()
  editorInstance?.getModel()?.dispose()
  editorInstance?.dispose()
})
</script>

<template>
  <div
    ref="editorElement"
    class="monaco-editor-host"
  />
</template>

<style scoped>
.monaco-editor-host {
  height: 100%;
  min-height: 0;
  width: 100%;
}
</style>
