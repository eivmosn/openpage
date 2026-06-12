import type { Component } from 'vue'

/**
 * 解析包装组件名称，便于 Vue DevTools 中定位。
 *
 * @param component 被包装的组件。
 * @returns 返回组件名称。
 */
export function resolveComponentName(component: Component): string {
  return typeof component === 'object' && 'name' in component && component.name
    ? String(component.name)
    : 'Component'
}
