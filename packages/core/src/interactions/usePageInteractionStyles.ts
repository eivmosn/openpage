import type { ComputedRef } from 'vue'
import type { CompiledPage } from '../types/compiled'
import { onBeforeUnmount, onMounted, watch } from 'vue'

interface StyleRegistryEntry {
  css: string
  owners: number
}

const styleRegistry = new Map<string, StyleRegistryEntry>()

/**
 * 管理页面级交互样式标签生命周期。
 *
 * @param compiled 当前编译后的页面结构。
 */
export function usePageInteractionStyles(compiled: ComputedRef<CompiledPage>): void {
  let retainedStyleId: string | undefined

  onMounted(() => {
    retainedStyleId = resolveStyleId(compiled.value.id)
    retainStyle(retainedStyleId)
    updateStyle(compiled.value)
  })

  watch(() => [compiled.value.id, compiled.value.interactionCss] as const, () => {
    if (!retainedStyleId) {
      return
    }

    const nextStyleId = resolveStyleId(compiled.value.id)
    if (nextStyleId !== retainedStyleId) {
      releaseStyle(retainedStyleId)
      retainedStyleId = nextStyleId
      retainStyle(retainedStyleId)
    }

    updateStyle(compiled.value)
  })

  onBeforeUnmount(() => {
    if (retainedStyleId) {
      releaseStyle(retainedStyleId)
    }
  })
}

/**
 * 增加页面样式标签使用计数。
 *
 * @param styleId 页面样式标签 id。
 */
function retainStyle(styleId: string): void {
  const entry = styleRegistry.get(styleId)
  styleRegistry.set(styleId, {
    css: entry?.css || '',
    owners: (entry?.owners || 0) + 1,
  })
}

/**
 * 更新页面级交互样式。
 *
 * @param compiled 当前编译后的页面结构。
 */
function updateStyle(compiled: CompiledPage): void {
  if (typeof document === 'undefined') {
    return
  }

  const styleId = resolveStyleId(compiled.id)
  const css = compiled.interactionCss
  const entry = styleRegistry.get(styleId)

  if (entry?.css === css) {
    return
  }

  const styleElement = resolveStyleElement(styleId, compiled.id)
  styleElement.textContent = css
  styleRegistry.set(styleId, {
    css,
    owners: entry?.owners || 1,
  })
}

/**
 * 减少页面样式标签使用计数并在无人使用时移除。
 *
 * @param styleId 页面样式标签 id。
 */
function releaseStyle(styleId: string): void {
  if (typeof document === 'undefined') {
    return
  }

  const entry = styleRegistry.get(styleId)

  if (!entry || entry.owners <= 1) {
    styleRegistry.delete(styleId)
    document.getElementById(styleId)?.remove()
    return
  }

  styleRegistry.set(styleId, {
    ...entry,
    owners: entry.owners - 1,
  })
}

/**
 * 获取或创建页面级交互样式标签。
 *
 * @param styleId 页面样式标签 id。
 * @param pageId 当前页面 id。
 * @returns 返回页面级样式标签。
 */
function resolveStyleElement(styleId: string, pageId: string): HTMLStyleElement {
  const existedElement = document.getElementById(styleId)

  if (existedElement instanceof HTMLStyleElement) {
    return existedElement
  }

  const styleElement = document.createElement('style')
  styleElement.id = styleId
  styleElement.dataset.openpageInteractionStyle = pageId
  document.head.appendChild(styleElement)
  return styleElement
}

/**
 * 生成页面级交互样式标签 id。
 *
 * @param pageId 当前页面 id。
 * @returns 返回安全的样式标签 id。
 */
function resolveStyleId(pageId: string): string {
  return `openpage-interaction-style-${pageId.replace(/[^\w-]/g, '-')}`
}
