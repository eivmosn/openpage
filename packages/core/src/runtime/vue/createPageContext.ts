import type { CompiledPage } from '../../types/compiled'
import type { PageContext } from '../../types/page'
import type { RuntimeClosePageService, RuntimeComponentPatch, RuntimeContextValue, RuntimeOpenPageOptions, RuntimeOpenPageService, RuntimeParentPageContext, RuntimeServices, RuntimeValidateOptions, RuntimeValidateTarget } from '../../types/runtime'
import type { OpenPageComponents } from '../../types/ui'
import { markRaw, reactive, readonly, shallowReactive } from 'vue'
import { getByPath, setByPath } from '../../utils/path'
import { getComponentById, getComponentByName, updateComponentById, updateComponentByName } from '../components'
import { applyComponentDefaultValues } from '../defaults'
import { valueRuntimeHelpers } from '../helpers'

export interface CreatePageContextOptions {
  closePage?: RuntimeClosePageService
  ctx: RuntimeContextValue
  openPage?: RuntimeOpenPageService
  params?: Record<string, unknown>
  parent?: RuntimeParentPageContext
}

/**
 * 创建渲染器运行时上下文。
 *
 * @param compiled 当前编译后的页面结构。
 * @param state 当前页面初始状态。
 * @param components 当前 UI 组件映射。
 * @param options 页面运行时选项。
 * @returns 返回可响应更新的渲染器运行时上下文。
 */
export function createPageContext(
  compiled: CompiledPage,
  state: Record<string, unknown>,
  components: OpenPageComponents,
  options: CreatePageContextOptions,
): PageContext {
  const runtimeCtx = shallowReactive<RuntimeContextValue>({})
  const services = shallowReactive<RuntimeServices>({
    closePage: options.closePage,
    message: runtimeCtx.message,
    notifyStateChange: () => {},
    openPage: options.openPage,
    parent: options.parent,
  })
  const context = shallowReactive<PageContext>({
    compiled,
    ctx: runtimeCtx,
    params: options.params || {},
    readonlyCtx: readonly(runtimeCtx) as Readonly<RuntimeContextValue>,
    state: createReactiveState(state),
    components: markRaw(components),
    services,
    componentPatches: reactive({}),
  })

  updatePageRuntimeOptions(context, options)
  applyComponentDefaultValues(context)
  services.notifyStateChange = () => {}

  return context
}

/**
 * 更新页面运行时选项，并重新生成当前页面可用的 ctx 方法。
 *
 * @param context 需要更新的渲染器运行时上下文。
 * @param options 最新页面运行时选项。
 */
export function updatePageRuntimeOptions(
  context: PageContext,
  options: CreatePageContextOptions,
): void {
  context.params = options.params || {}
  context.services.closePage = options.closePage
  context.services.openPage = options.openPage
  context.services.parent = options.parent

  Object.keys(context.ctx).forEach((key) => {
    delete context.ctx[key]
  })

  Object.assign(context.ctx, options.ctx, {
    ...valueRuntimeHelpers,
    closePage: (result?: unknown) => {
      context.services.closePage?.(result)
    },
    getComponentById: (id: string) => getComponentById(context, id),
    getComponentByName: (name: string) => getComponentByName(context, name),
    getState: (path: string) => getByPath(context.state, path),
    message: options.ctx.message,
    openPage: async (openOptions: RuntimeOpenPageOptions) => {
      if (!context.services.openPage) {
        context.services.message?.warning?.('当前页面未配置打开页面能力')
        return { action: 'close' }
      }

      return await context.services.openPage(openOptions, context)
    },
    parentParams: context.services.parent?.params || {},
    reset: async (target?: RuntimeValidateTarget, resetOptions?: RuntimeValidateOptions) => await reset(context, target, resetOptions),
    setParentState: (pathOrPatch: string | Record<string, unknown>, value?: unknown) => {
      const parent = context.services.parent

      if (!parent) {
        context.services.message?.warning?.('当前页面没有可写入的父页面状态')
        return
      }

      applySetState(parent.state, parent.setState, pathOrPatch, value)
    },
    updateComponentById: (id: string, patch: RuntimeComponentPatch) => updateComponentById(context, id, patch),
    updateComponentByName: (name: string, patch: RuntimeComponentPatch) => updateComponentByName(context, name, patch),
    validate: async (target?: RuntimeValidateTarget, validateOptions?: RuntimeValidateOptions) => await validate(context, target, validateOptions),
  })

  context.services.message = context.ctx.message
}

/**
 * 执行当前表单校验。
 *
 * @param context 当前渲染器运行时上下文。
 * @param target 需要校验的组件标识或标识数组，不传时校验整个表单。
 * @param options 当前校验配置。
 * @returns 返回表单是否校验通过。
 */
async function validate(
  context: PageContext,
  target?: RuntimeValidateTarget,
  options?: RuntimeValidateOptions,
): Promise<boolean> {
  const validateForm = context.services.form?.validate

  if (!validateForm) {
    context.services.message?.warning?.('当前页面未配置表单校验能力')
    return false
  }

  return await validateForm(target, options)
}

/**
 * 重置当前表单校验状态。
 *
 * @param context 当前渲染器运行时上下文。
 * @param target 需要重置的组件标识或标识数组，不传时重置整个表单。
 * @param options 当前重置配置。
 * @returns 返回表单校验状态是否恢复完成。
 */
async function reset(
  context: PageContext,
  target?: RuntimeValidateTarget,
  options?: RuntimeValidateOptions,
): Promise<boolean> {
  const resetValidation = context.services.form?.reset

  if (!resetValidation) {
    context.services.message?.warning?.('当前页面未配置表单校验能力')
    return false
  }

  return await resetValidation(target, options)
}

/**
 * 执行状态写入，支持路径写入和对象浅合并。
 *
 * @param state 需要写入的状态对象。
 * @param parentSetState 父页面受控写入方法。
 * @param pathOrPatch 状态路径或状态补丁对象。
 * @param value 路径写入时对应的值。
 */
function applySetState(
  state: Record<string, unknown>,
  parentSetState: RuntimeParentPageContext['setState'] | undefined,
  pathOrPatch: string | Record<string, unknown>,
  value?: unknown,
): void {
  if (parentSetState) {
    if (typeof pathOrPatch === 'string') {
      parentSetState(pathOrPatch, value)
      return
    }

    parentSetState(pathOrPatch)
    return
  }

  if (typeof pathOrPatch === 'string') {
    setByPath(state, pathOrPatch, value)
    return
  }

  Object.assign(state, pathOrPatch)
}

/**
 * 使用最新页面配置更新渲染器运行时上下文。
 *
 * @param context 需要更新的渲染器运行时上下文。
 * @param compiled 最新编译后的页面结构。
 */
export function updatePageSchema(
  context: PageContext,
  compiled: CompiledPage,
): void {
  context.compiled = compiled
  context.componentPatches = reactive({})

  applyComponentDefaultValues(context)
}

/**
 * 将外部页面状态转为 Vue 响应式对象。
 *
 * @param state 编译产物中的初始状态。
 * @returns 返回响应式页面状态。
 */
export function createReactiveState(state: Record<string, unknown>): Record<string, unknown> {
  return reactive(state) as Record<string, unknown>
}
