import type { EffectScope, ShallowRef } from 'vue'
import type { CompiledComponent } from '../../types/compiled'
import type { RuntimeContext } from '../../types/runtime'
import { effectScope, watch } from 'vue'
import { getByPath, setByPath } from '../../utils/path'
import { resolveExpressionValue } from '../expression'

interface ComputedUpdateGuard {
  notifyPending: boolean
  pathUpdates: Map<string, number>
  resetPending: boolean
}

const MAX_COMPUTED_UPDATES_PER_FLUSH = 10
const updateGuards = new WeakMap<RuntimeContext, ComputedUpdateGuard>()

/**
 * 创建 Renderer 级计算字段调度器。
 *
 * 普通组件不会创建计算监听，每个计算字段仅创建一个依赖监听。
 *
 * @param context 当前渲染器运行时上下文引用。
 */
export function useComputedValues(context: ShallowRef<RuntimeContext | undefined>): void {
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
function createComputedScope(context: RuntimeContext): EffectScope {
  const scope = effectScope()

  scope.run(() => {
    for (const component of context.compiled.components.values()) {
      if (component.computedValue === undefined || !component.model?.path) {
        continue
      }

      watch(
        () => resolveExpressionValue(component.computedValue, context),
        value => syncComputedValue(component, context, value),
        {
          immediate: true,
        },
      )
    }
  })

  return scope
}

/**
 * 将计算结果同步到组件模型路径。
 *
 * @param component 当前计算字段组件。
 * @param context 当前渲染器运行时上下文。
 * @param value 最新计算结果。
 */
function syncComputedValue(component: CompiledComponent, context: RuntimeContext, value: unknown): void {
  const path = component.model?.path

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
function allowComputedUpdate(context: RuntimeContext, path: string): boolean {
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
function scheduleStateNotification(context: RuntimeContext): void {
  const guard = resolveUpdateGuard(context)

  if (guard.notifyPending) {
    return
  }

  guard.notifyPending = true
  queueMicrotask(() => {
    guard.notifyPending = false
    context.services.notifyStateChange()
  })
}

/**
 * 获取当前渲染器的计算字段更新保护状态。
 *
 * @param context 当前渲染器运行时上下文。
 * @returns 返回计算字段更新保护状态。
 */
function resolveUpdateGuard(context: RuntimeContext): ComputedUpdateGuard {
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
