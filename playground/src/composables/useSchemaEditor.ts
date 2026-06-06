import type { PageSchema } from '@openpage/renderer'
import type { ShallowRef } from 'vue'
import { onBeforeUnmount, shallowRef, watch } from 'vue'

export interface SchemaEditorState {
  schema: ShallowRef<PageSchema>
  source: ShallowRef<string>
}

/**
 * 创建支持防抖解析的 Schema JSON 编辑状态。
 *
 * @param initialSchema 编辑器初始 Schema。
 * @returns 返回 JSON 文本和最后一次有效 Schema。
 */
export function useSchemaEditor(initialSchema: PageSchema): SchemaEditorState {
  const source = shallowRef(JSON.stringify(initialSchema, null, 2))
  const schema = shallowRef<PageSchema>(initialSchema)
  let parseTimer: ReturnType<typeof setTimeout> | undefined

  /**
   * 解析编辑器 JSON 并更新有效 Schema。
   *
   * @param value 当前编辑器 JSON 文本。
   */
  function parseSchema(value: string): void {
    try {
      schema.value = JSON.parse(value) as PageSchema
    }
    catch {
      // 保留最后一次有效 Schema，直到 JSON 再次可解析。
    }
  }

  watch(source, (value) => {
    clearTimeout(parseTimer)
    parseTimer = setTimeout(parseSchema, 180, value)
  })

  onBeforeUnmount(() => {
    clearTimeout(parseTimer)
  })

  return {
    schema,
    source,
  }
}
