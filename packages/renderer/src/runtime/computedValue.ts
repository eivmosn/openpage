import type { EffectScope, ShallowRef } from 'vue'
import type { CompiledNode } from '../types/compiled'
import type { RendererContext } from '../types/runtime'
import { effectScope, watch } from 'vue'
import { getByPath, setByPath } from '../utils/path'
import { evaluateValue } from './expression'

interface ComputedUpdateGuard {
  notifyPending: boolean
  pathUpdates: Map<string, number>
  resetPending: boolean
}

const MAX_COMPUTED_UPDATES_PER_FLUSH = 10
const updateGuards = new WeakMap<RendererContext, ComputedUpdateGuard>()

/**
 * 创建 Renderer 级计算字段调度器。
 *
 * 普通节点不会创建计算监听，每个计算字段仅创建一个依赖监听。
 *
 * @param context 当前渲染器运行时上下文引用。
 */
export function useComputedValues(context: ShallowRef<RendererContext | undefined>): void {
  let computedScope: EffectScope | undefined

  watch(
    context,
    (runtimeContext, _previous, onCleanup) => {
      computedScope?.stop()
      computedScope = undefined

      if (!runtimeContext) {
        return
      }

      const stopSchemaWatch = watch(
        () => runtimeContext.compiled,
        () => {
          computedScope?.stop()
          computedScope = createComputedScope(runtimeContext)
        },
        {
          immediate: true,
        },
      )

      onCleanup(() => {
        stopSchemaWatch()
        computedScope?.stop()
        computedScope = undefined
      })
    },
    {
      immediate: true,
    },
  )
}

/**
 * 为当前编译产物中的计算字段创建依赖监听作用域。
 *
 * @param context 当前渲染器运行时上下文。
 * @returns 返回计算字段监听作用域。
 */
function createComputedScope(context: RendererContext): EffectScope {
  const scope = effectScope()

  scope.run(() => {
    for (const node of context.compiled.nodes.values()) {
      if (node.computedValue === undefined || !node.model?.path) {
        continue
      }

      watch(
        () => evaluateValue(node.computedValue, context),
        value => syncComputedValue(node, context, value),
        {
          immediate: true,
        },
      )
    }
  })

  return scope
}

/**
 * 将计算结果同步到节点模型路径。
 *
 * @param node 当前计算字段节点。
 * @param context 当前渲染器运行时上下文。
 * @param value 最新计算结果。
 */
function syncComputedValue(node: CompiledNode, context: RendererContext, value: unknown): void {
  const path = node.model?.path

  if (!path || Object.is(getByPath(context.state, path), value) || !allowComputedUpdate(context, path)) {
    return
  }

  setByPath(context.state, path, value)
  scheduleStateNotification(context)
}

/**
 * 限制同一轮响应式更新中重复写入同一计算字段路径。
 *
 * @param context 当前渲染器运行时上下文。
 * @param path 当前计算字段模型路径。
 * @returns 返回当前路径是否允许写入。
 */
function allowComputedUpdate(context: RendererContext, path: string): boolean {
  const guard = resolveUpdateGuard(context)
  const updateCount = (guard.pathUpdates.get(path) || 0) + 1

  if (updateCount > MAX_COMPUTED_UPDATES_PER_FLUSH) {
    console.error(`[openpage] computed value circular dependency detected: ${path}`)
    return false
  }

  guard.pathUpdates.set(path, updateCount)

  if (!guard.resetPending) {
    guard.resetPending = true
    queueMicrotask(() => {
      guard.pathUpdates.clear()
      guard.resetPending = false
    })
  }

  return true
}

/**
 * 合并同一轮多个计算字段产生的 State 更新通知。
 *
 * @param context 当前渲染器运行时上下文。
 */
function scheduleStateNotification(context: RendererContext): void {
  const guard = resolveUpdateGuard(context)

  if (guard.notifyPending) {
    return
  }

  guard.notifyPending = true
  queueMicrotask(() => {
    guard.notifyPending = false
    context.notifyStateChange()
  })
}

/**
 * 获取当前渲染器的计算字段更新保护状态。
 *
 * @param context 当前渲染器运行时上下文。
 * @returns 返回计算字段更新保护状态。
 */
function resolveUpdateGuard(context: RendererContext): ComputedUpdateGuard {
  const existedGuard = updateGuards.get(context)

  if (existedGuard) {
    return existedGuard
  }

  const guard: ComputedUpdateGuard = {
    notifyPending: false,
    pathUpdates: new Map(),
    resetPending: false,
  }
  updateGuards.set(context, guard)
  return guard
}
