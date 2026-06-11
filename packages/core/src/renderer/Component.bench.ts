import type { CompiledComponent } from '../types/compiled'
import type { RuntimeContext } from '../types/runtime'
import { bench, describe } from 'vitest'
import { h } from 'vue'
import { compileSchema } from '../compiler/compileSchema'
import { resolveRuntimeComponent, updateComponentById } from '../runtime/components'
import { resolveExpressionValue } from '../runtime/expression'
import { Component } from './Component'

const context = {
  state: {
    active: true,
    count: 12,
    theme: {
      color: '#146ef5',
    },
    user: {
      name: 'OpenPage',
    },
  },
} as unknown as RuntimeContext

const component = createComponent()
const dynamicComponent = createDynamicComponent()
const patchedContext = createPatchedContext()
const patchedComponent = patchedContext.compiled.components.get('patched-component')
const parentComponent = createParentComponent()

describe('component props evaluation', () => {
  bench('legacy full props scan', () => {
    evaluatePropsLegacy(component)
  })

  bench('compiled dynamic props only', () => {
    evaluatePropsCompiled(component)
  })
})

describe('large dynamic props evaluation', () => {
  bench('legacy full dynamic props scan', () => {
    evaluatePropsLegacy(dynamicComponent)
  })

  bench('compiled dynamic resolvers only', () => {
    evaluatePropsCompiled(dynamicComponent)
  })
})

describe('runtime patch resolution', () => {
  bench('legacy patched component merge on read', () => {
    if (!patchedComponent) {
      return
    }

    resolveRuntimeComponentLegacy(patchedContext, patchedComponent)
  })

  bench('cached patched component read', () => {
    if (!patchedComponent) {
      return
    }

    resolveRuntimeComponent(patchedContext, patchedComponent)
  })
})

describe('children vnode rendering', () => {
  const cachedRenderChildren = createCachedChildrenRenderer()

  bench('legacy children vnode map', () => {
    renderChildrenLegacy(parentComponent)
  })

  bench('cached children vnode map', () => {
    cachedRenderChildren(parentComponent)
  })
})

/**
 * 创建包含大量静态属性和少量动态表达式的组件。
 *
 * @returns 返回用于基准测试的编译组件。
 */
function createComponent(): CompiledComponent {
  const props: Record<string, unknown> = {}

  for (let index = 0; index < 120; index++) {
    props[`staticText${index}`] = `static-value-${index}`
    props[`staticObject${index}`] = {
      align: 'center',
      padding: index,
      tokens: [`token-${index}`, 'stable'],
    }
  }

  props.title = '{{ user.name }}'
  props.disabled = '{{ !active }}'
  props.color = '{{ theme.color }}'
  props.summary = {
    count: '{{ count }}',
    label: 'Total',
  }

  return createCompiledComponent('benchmark-component', props)
}

/**
 * 创建全部 props 都含动态表达式的大数据量组件。
 *
 * @returns 返回用于压力基准测试的全动态编译组件。
 */
function createDynamicComponent(): CompiledComponent {
  const props: Record<string, unknown> = {}

  for (let index = 0; index < 360; index++) {
    props[`dynamicText${index}`] = '{{ user.name + "-" + count }}'
    props[`dynamicObject${index}`] = {
      active: '{{ active }}',
      color: '{{ theme.color }}',
      nested: {
        label: '{{ user.name }}',
        rank: '{{ count + 1 }}',
      },
      tokens: ['{{ user.name }}', '{{ theme.color }}', index],
    }
  }

  return createCompiledComponent('dynamic-benchmark-component', props)
}

/**
 * 创建包含大量子组件的父组件。
 *
 * @returns 返回用于子组件渲染基准测试的父组件。
 */
function createParentComponent(): CompiledComponent {
  const compiled = compileSchema({
    id: 'children-benchmark-page',
    children: [{
      id: 'parent-component',
      type: 'container',
      props: {},
      children: Array.from({ length: 600 }, (_, index) => ({
        id: `child-${index}`,
        type: 'text',
        props: {
          value: `child-${index}`,
        },
      })),
    }],
  })
  const component = compiled.components.get('parent-component')

  if (!component) {
    throw new Error('Benchmark parent component not found')
  }

  return component
}

/**
 * 创建带运行时 patch 的上下文。
 *
 * @returns 返回用于 patch 解析基准测试的上下文。
 */
function createPatchedContext(): RuntimeContext {
  const compiled = compileSchema({
    id: 'patch-benchmark-page',
    children: [{
      id: 'patched-component',
      type: 'card',
      label: '{{ user.name }}',
      props: {
        title: '{{ user.name }}',
      },
    }],
  })
  const runtimeContext = {
    compiled,
    state: context.state,
    services: {
      notifyStateChange: () => {},
    },
    componentPatches: {},
  } as RuntimeContext

  updateComponentById(runtimeContext, 'patched-component', {
    disabled: '{{ !active }}',
    props: {
      description: '{{ user.name + count }}',
    },
  })

  return runtimeContext
}

/**
 * 根据 props 创建测试用编译组件。
 *
 * @param id 当前组件 id。
 * @param props 当前组件 props。
 * @returns 返回编译组件。
 */
function createCompiledComponent(id: string, props: Record<string, unknown>): CompiledComponent {
  const compiled = compileSchema({
    id,
    children: [{
      id,
      type: 'card',
      props,
    }],
  })
  const component = compiled.components.get(id)

  if (!component) {
    throw new Error(`Benchmark component not found: ${id}`)
  }

  return component
}

/**
 * 模拟旧实现：每次全量遍历所有 props 并递归解析。
 *
 * @param currentComponent 当前组件。
 * @returns 返回解析后的 props。
 */
function evaluatePropsLegacy(currentComponent: CompiledComponent): Record<string, unknown> {
  const props: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(currentComponent.props)) {
    props[key] = resolveExpressionValue(value, context)
  }

  return props
}

/**
 * 模拟新实现：复用静态 props，只解析编译期标记出的动态 props。
 *
 * @param currentComponent 当前组件。
 * @returns 返回解析后的 props。
 */
function evaluatePropsCompiled(currentComponent: CompiledComponent): Record<string, unknown> {
  const props = { ...currentComponent.staticProps }

  for (const [key, resolveValue] of currentComponent.dynamicProps) {
    props[key] = resolveValue(context)
  }

  return props
}

/**
 * 模拟旧实现：每次读取运行时组件都重新合并对象。
 *
 * @param runtimeContext 当前运行时上下文。
 * @param currentComponent 当前组件。
 * @returns 返回合并后的运行时组件。
 */
function resolveRuntimeComponentLegacy(runtimeContext: RuntimeContext, currentComponent: CompiledComponent): CompiledComponent {
  const patch = runtimeContext.componentPatches[currentComponent.id]

  if (!patch) {
    return currentComponent
  }

  return {
    ...currentComponent,
    ...patch,
    id: currentComponent.id,
    events: {
      ...currentComponent.events,
      ...patch.events,
    },
    children: patch.children || currentComponent.children,
    model: patch.model || currentComponent.model,
  }
}

/**
 * 模拟旧实现：每次都重新创建子组件 VNode 数组。
 *
 * @param currentComponent 当前父组件。
 * @returns 返回子组件 VNode 数组。
 */
function renderChildrenLegacy(currentComponent: CompiledComponent): unknown {
  return currentComponent.children.map(childId =>
    h(Component, {
      key: childId,
      id: childId,
    }),
  )
}

/**
 * 创建带 children 引用缓存的渲染函数。
 *
 * @returns 返回缓存渲染函数。
 */
function createCachedChildrenRenderer(): (currentComponent: CompiledComponent) => unknown {
  let cachedChildren: CompiledComponent['children'] | undefined
  let cachedChildrenVNodes: unknown

  return (currentComponent) => {
    if (cachedChildren === currentComponent.children) {
      return cachedChildrenVNodes
    }

    cachedChildren = currentComponent.children
    cachedChildrenVNodes = renderChildrenLegacy(currentComponent)
    return cachedChildrenVNodes
  }
}
