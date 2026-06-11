import type { CompiledPage } from '../types/compiled'
import type { ComponentSchema, PageSchema } from '../types/schema'
import { bench, describe } from 'vitest'
import { h } from 'vue'
import { compileSchema } from '../compiler/compileSchema'
import { Component } from './Component'

const schema = createLargePageSchema(1000)
const compiled = compileSchema(schema)
const renderRootChildrenCached = createRootChildrenRenderer()
const massiveSchema = createLargePageSchema(10000)
const massiveCompiled = compileSchema(massiveSchema)
const renderMassiveRootChildrenCached = createRootChildrenRenderer()

describe('large page tree benchmark', () => {
  bench('compile 1000 component page schema', () => {
    compileSchema(schema)
  })

  bench('legacy root vnode map for 1000 components', () => {
    renderRootChildrenLegacy(compiled)
  })

  bench('cached root vnode map for 1000 components', () => {
    renderRootChildrenCached(compiled)
  })

  bench('recursive vnode tree walk for 1000 components', () => {
    renderComponentTree(compiled, compiled.children)
  })
})

describe('massive page tree benchmark', () => {
  bench('compile 10000 component page schema', () => {
    compileSchema(massiveSchema)
  })

  bench('legacy root vnode map for 10000 components', () => {
    renderRootChildrenLegacy(massiveCompiled)
  })

  bench('cached root vnode map for 10000 components', () => {
    renderMassiveRootChildrenCached(massiveCompiled)
  })

  bench('recursive vnode tree walk for 10000 components', () => {
    renderComponentTree(massiveCompiled, massiveCompiled.children)
  })
})

/**
 * 创建指定组件数量的大页面 Schema。
 *
 * @param count 组件数量。
 * @returns 返回大页面 Schema。
 */
function createLargePageSchema(count: number): PageSchema {
  return {
    id: 'large-page-benchmark',
    children: Array.from({ length: count }, (_, index): ComponentSchema => ({
      id: `component-${index}`,
      type: index % 5 === 0 ? 'container' : 'text',
      label: '{{ user.name }}',
      visible: '{{ active }}',
      props: {
        hover: 'lift',
        title: '{{ user.name + "-" + count }}',
        description: {
          color: '{{ theme.color }}',
          index,
        },
      },
    })),
  }
}

/**
 * 模拟旧实现：每次都重新创建页面顶层 VNode。
 *
 * @param currentCompiled 当前编译页面。
 * @returns 返回顶层 VNode 数组。
 */
function renderRootChildrenLegacy(currentCompiled: CompiledPage): unknown {
  return currentCompiled.children.map(id =>
    h(Component, {
      key: id,
      id,
    }),
  )
}

/**
 * 创建页面顶层 VNode 缓存渲染函数。
 *
 * @returns 返回缓存渲染函数。
 */
function createRootChildrenRenderer(): (currentCompiled: CompiledPage) => unknown {
  let cachedChildren: string[] | undefined
  let cachedChildrenVNodes: unknown

  return (currentCompiled) => {
    if (cachedChildren === currentCompiled.children) {
      return cachedChildrenVNodes
    }

    cachedChildren = currentCompiled.children
    cachedChildrenVNodes = renderRootChildrenLegacy(currentCompiled)
    return cachedChildrenVNodes
  }
}

/**
 * 递归模拟完整组件树 VNode 创建。
 *
 * @param currentCompiled 当前编译页面。
 * @param componentIds 当前层级组件 id 列表。
 * @returns 返回递归创建的 VNode 数组。
 */
function renderComponentTree(currentCompiled: CompiledPage, componentIds: readonly string[]): unknown {
  return componentIds.map((id) => {
    const component = currentCompiled.components.get(id)

    return h(Component, {
      key: id,
      id,
    }, component?.children.length
      ? { default: () => renderComponentTree(currentCompiled, component.children) }
      : undefined)
  })
}
