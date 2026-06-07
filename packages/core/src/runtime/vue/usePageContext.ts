import type { InjectionKey } from 'vue'
import type { PageContext } from '../../types/page'
import { inject, provide } from 'vue'

export const pageContextKey: InjectionKey<PageContext> = Symbol('openpage-page-context')

/**
 * 向页面组件树提供页面渲染上下文。
 *
 * @param context 当前页面渲染上下文。
 */
export function providePageContext(context: PageContext): void {
  provide(pageContextKey, context)
}

/**
 * 获取当前页面组件树注入的渲染上下文。
 *
 * @returns 返回当前注入的页面渲染上下文。
 */
export function usePageContext(): PageContext {
  const context = inject(pageContextKey)

  if (!context) {
    throw new Error('[openpage] page renderer context not found')
  }

  return context
}
