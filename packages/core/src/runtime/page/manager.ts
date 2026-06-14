import type { OverlayOptions, OverlayResult } from '@openpage/overlay'
import type { Component, PropType } from 'vue'
import type {
  RuntimeContext,
  RuntimeContextValue,
  RuntimeOpenPageOptions,
  RuntimeOpenPageResult,
  RuntimeOpenPageService,
  RuntimeResolvedPage,
} from '../../types/runtime'
import type { PageSchema } from '../../types/schema'
import type { OpenPageComponents } from '../../types/ui'
import { overlay, useOverlayContext } from '@openpage/overlay'
import { defineComponent, h, markRaw } from 'vue'
import { createParentPageContext } from './parent'

interface CreatePageManagerOptions {
  getComponents: () => OpenPageComponents | undefined
  getPageComponent: () => Component
}

interface NestedPageProps {
  components?: OpenPageComponents
  ctx: RuntimeContextValue
  params: Record<string, unknown>
  parentContext: RuntimeContext
  schema: PageSchema
  initState: Record<string, unknown>
}

/** 页面管理器。 */
export interface PageManager {
  openPage: RuntimeOpenPageService
}

const NestedOverlayPage = defineComponent({
  name: 'OpenPageNestedOverlayPage',
  props: {
    components: {
      type: Object as PropType<OpenPageComponents>,
      default: undefined,
    },
    ctx: {
      type: Object as PropType<RuntimeContextValue>,
      required: true,
    },
    pageComponent: {
      type: Object as PropType<Component>,
      required: true,
    },
    params: {
      type: Object as PropType<Record<string, unknown>>,
      required: true,
    },
    parentContext: {
      type: Object as PropType<RuntimeContext>,
      required: true,
    },
    schema: {
      type: Object as PropType<PageSchema>,
      required: true,
    },
    initState: {
      type: Object as PropType<Record<string, unknown>>,
      required: true,
    },
  },
  setup(props) {
    const overlayContext = useOverlayContext<RuntimeOpenPageResult>()
    const parent = createParentPageContext(props.parentContext)

    return () => {
      const pageProps: Record<string, unknown> = {
        components: props.components,
        closePage: (result?: unknown) => overlayContext.confirm(normalizeClosePageResult(result)),
        ctx: props.ctx,
        initState: props.initState,
        params: props.params,
        parent,
        schema: props.schema,
      }

      return h(props.pageComponent, pageProps)
    }
  },
})

/**
 * 创建页面管理器。
 *
 * @param options 页面管理器配置。
 * @returns 返回页面管理器。
 */
export function createPageManager(options: CreatePageManagerOptions): PageManager {
  /**
   * 打开一个子页面。
   *
   * @param openOptions 打开页面配置。
   * @param context 当前父页面上下文。
   * @returns 返回子页面关闭结果。
   */
  async function openPage(openOptions: RuntimeOpenPageOptions, context: RuntimeContext): Promise<RuntimeOpenPageResult> {
    const resolvedPage = await resolveOpenPage(openOptions, context)

    if (!resolvedPage) {
      context.services.message?.error?.(`页面不存在：${String(openOptions.page)}`)
      return { action: 'close' }
    }

    const result = await overlay.open<RuntimeOpenPageResult>(
      NestedOverlayPage,
      markRaw({
        components: options.getComponents(),
        ctx: context.ctx,
        pageComponent: markRaw(options.getPageComponent()),
        params: openOptions.params || {},
        parentContext: context,
        schema: resolvedPage.schema,
        initState: createChildState(resolvedPage.state || {}, openOptions),
      } satisfies NestedPageProps & { pageComponent: Component }),
      createOverlayOptions(openOptions, resolvedPage.schema),
    )

    return normalizeOverlayResult(result)
  }

  return {
    openPage,
  }
}

/**
 * 解析 openPage 的页面引用。
 *
 * @param options 打开页面配置。
 * @param context 当前父页面上下文。
 * @returns 返回可渲染页面。
 */
async function resolveOpenPage(options: RuntimeOpenPageOptions, context: RuntimeContext): Promise<RuntimeResolvedPage | undefined> {
  if (typeof options.page !== 'string') {
    return {
      schema: options.page,
      state: options.state,
    }
  }

  const resolvedPage = await context.ctx.resolvePage?.(options.page, options, context)

  if (!resolvedPage) {
    return undefined
  }

  return normalizeResolvedPage(resolvedPage)
}

/**
 * 归一化页面解析结果。
 *
 * @param page 页面解析结果。
 * @returns 返回标准页面解析结果。
 */
function normalizeResolvedPage(page: PageSchema | RuntimeResolvedPage): RuntimeResolvedPage {
  if ('schema' in page) {
    return page
  }

  return {
    schema: page,
  }
}

/**
 * 创建子页面初始状态。
 *
 * @param pageState 页面默认状态。
 * @param options 打开页面配置。
 * @returns 返回子页面初始状态。
 */
function createChildState(pageState: Record<string, unknown>, options: RuntimeOpenPageOptions): Record<string, unknown> {
  return {
    ...pageState,
    ...(options.state || {}),
  }
}

/**
 * 创建内置 overlay 配置。
 *
 * @param options 打开页面配置。
 * @param schema 子页面 schema。
 * @returns 返回 overlay 配置。
 */
function createOverlayOptions(options: RuntimeOpenPageOptions, schema: PageSchema): OverlayOptions {
  const overlayOptions = options.overlay || {}

  return removeUndefinedOverlayOptions({
    type: options.mode === 'drawer' ? 'drawer' : 'modal',
    title: overlayOptions.title ?? schema.title ?? '',
    width: overlayOptions.width ?? 640,
    height: overlayOptions.height ?? 520,
    minWidth: overlayOptions.minWidth,
    minHeight: overlayOptions.minHeight,
    position: overlayOptions.position,
    radius: overlayOptions.radius,
    offset: overlayOptions.offset,
    maskClosable: overlayOptions.maskClosable,
    closeOnEsc: overlayOptions.closeOnEsc,
    closable: overlayOptions.closable,
    fullscreen: overlayOptions.fullscreen ?? true,
    resizable: overlayOptions.resizable ?? true,
    showFooter: overlayOptions.showFooter ?? false,
    bodyFullHeight: overlayOptions.bodyFullHeight ?? true,
    bodyScrollable: overlayOptions.bodyScrollable ?? false,
    bodyPadding: overlayOptions.bodyPadding ?? false,
  })
}

/**
 * 移除 overlay 配置中的空字段。
 *
 * @param options overlay 配置。
 * @returns 返回可安全覆盖默认值的配置。
 */
function removeUndefinedOverlayOptions(options: OverlayOptions): OverlayOptions {
  return Object.fromEntries(Object.entries(options).filter(([, value]) => value !== undefined)) as OverlayOptions
}

/**
 * 归一化 closePage 传入的结果。
 *
 * @param result closePage 调用参数。
 * @returns 返回标准 openPage 结果。
 */
function normalizeClosePageResult(result: unknown): RuntimeOpenPageResult {
  return isOpenPageResult(result)
    ? result
    : { action: 'close', value: result }
}

/**
 * 归一化 overlay 返回结果。
 *
 * @param result overlay 返回结果。
 * @returns 返回 openPage 返回结果。
 */
function normalizeOverlayResult(result: OverlayResult<RuntimeOpenPageResult>): RuntimeOpenPageResult {
  if (result.action === 'confirm' && isOpenPageResult(result.value)) {
    return result.value
  }

  return {
    action: result.action,
    value: result.value,
  }
}

/**
 * 判断值是否为 openPage 结果。
 *
 * @param value 待判断的值。
 * @returns 返回是否为 openPage 结果。
 */
function isOpenPageResult(value: unknown): value is RuntimeOpenPageResult {
  if (!value || typeof value !== 'object') {
    return false
  }

  const action = (value as RuntimeOpenPageResult).action

  return action === 'confirm' || action === 'cancel' || action === 'close'
}
