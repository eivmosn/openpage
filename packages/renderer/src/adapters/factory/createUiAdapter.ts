import type { CreatedUiAdapter, CreateUiAdapterOptions } from './types'

/**
 * 创建通用 UI 适配器。
 *
 * @param options 适配器名称、组件映射和可选表单项组件。
 * @returns 返回可供 Renderer 使用的 UI 适配器。
 */
export function createUiAdapter(options: CreateUiAdapterOptions): CreatedUiAdapter {
  return {
    name: options.name,
    components: options.components,
    formItem: options.formItem,
  }
}
