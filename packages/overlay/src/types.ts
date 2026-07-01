import type { Component, TeleportProps, VNodeChild } from 'vue'

export type OverlayType = 'modal' | 'drawer'
export type OverlayAction = 'confirm' | 'cancel' | 'close'
export type OverlayDrawerPosition = 'right' | 'left' | 'top' | 'bottom'
export type OverlayModalPosition = 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'left' | 'right' | 'bottom'
export type OverlayOffset = readonly [top?: number | null, right?: number | null, bottom?: number | null, left?: number | null]
export type OverlayTarget = TeleportProps['to']

/** OverlayProvider 的 modal 全局配置。 */
export interface OverlayProviderModalOptions {
  /** modal 挂载目标，透传给 Vue Teleport 的 to，默认 body。 */
  to?: OverlayTarget
  /** modal 圆角，支持数字像素值或 CSS 长度。 */
  radius?: number | string
  /** modal 默认初始位置。 */
  position?: OverlayModalPosition
  /** modal 默认偏移量，遵循上右下左。 */
  offset?: OverlayOffset
  /** modal 右上角操作区自定义渲染函数。 */
  extra?: OverlayHeaderExtraRenderer
  /** modal 右上角按钮基础 class，优先级低于单次调用配置。 */
  actionClassName?: string
}

/** OverlayProvider 的 drawer 全局配置。 */
export interface OverlayProviderDrawerOptions {
  /** drawer 挂载目标，透传给 Vue Teleport 的 to，默认 body。 */
  to?: OverlayTarget
  /** drawer 圆角，支持数字像素值或 CSS 长度。 */
  radius?: number | string
  /** drawer 默认初始位置。 */
  position?: OverlayDrawerPosition
  /** drawer 右上角操作区自定义渲染函数。 */
  extra?: OverlayHeaderExtraRenderer
  /** drawer 右上角按钮基础 class，优先级低于单次调用配置。 */
  actionClassName?: string
}

/** overlay 关闭后返回给调用方的结果。 */
export interface OverlayResult<T = unknown> {
  /** 用户触发的结束动作。 */
  action: OverlayAction
  /** confirm 时可携带的业务数据。 */
  value?: T
}

/** 点击确认按钮时执行的业务处理函数。 */
export type OverlayConfirmHandler<T = unknown> = () => T | false | Promise<T | false>

/** 自定义 footer 渲染函数收到的操作上下文。 */
export interface OverlayFooterContext {
  /** 当前弹层实例。 */
  item: OverlayItem
  /** 直接确认当前弹层，并返回可选值。 */
  confirm: (value?: unknown) => void
  /** 执行当前弹层注册的确认处理函数。 */
  triggerConfirm: () => void
  /** 取消当前弹层。 */
  cancel: () => void
  /** 关闭当前弹层。 */
  close: () => void
}

/** 自定义标题栏右上角操作区渲染函数。 */
export type OverlayHeaderExtraRenderer = (ctx: OverlayHeaderExtraContext) => VNodeChild

/** 自定义标题栏右上角操作区收到的上下文。 */
export interface OverlayHeaderExtraContext {
  /** 当前弹层实例。 */
  item: OverlayItem
  /** 当前弹层类型。 */
  type: OverlayType
  /** 可复用的按钮基础 class。 */
  className: string
  /** 带类型修饰的按钮 class。 */
  buttonClass: string[]
  /** 当前是否处于全屏状态。 */
  isFullscreen: boolean
  /** 默认全屏切换按钮节点，可通过 <component :is="fullscreen" /> 渲染。 */
  fullscreen?: VNodeChild
  /** 默认关闭按钮节点，可通过 <component :is="close" /> 渲染。 */
  close?: VNodeChild
  /** 触发全屏切换。 */
  toggleFullscreen: () => void
  /** 关闭当前弹层。 */
  closeOverlay: () => void
}

/** OverlayProvider 全局配置。 */
export interface OverlayProviderProps {
  /** 弹层基础 z-index，用于适配不同第三方组件库的弹层层级。 */
  zIndex?: number
  /** modal 全局配置。 */
  modal?: OverlayProviderModalOptions
  /** drawer 全局配置。 */
  drawer?: OverlayProviderDrawerOptions
  /** 内容区域滚动容器组件，例如 Naive UI 的 NScrollbar。 */
  contentWrapper?: Component
  /** 传给内容区域滚动容器组件的 props。 */
  contentWrapperProps?: Record<string, unknown>
}

/** overlay.open 的第三个参数，用于控制弹层展示方式和交互行为。 */
export interface OverlayOptions {
  /** 弹层类型：modal 为居中弹窗，drawer 为抽屉。 */
  type?: OverlayType
  /** 弹层挂载目标，透传给 Vue Teleport 的 to，优先级高于 OverlayProvider 对应类型配置。 */
  to?: OverlayTarget
  /** 弹层初始位置，modal 和 drawer 会按各自支持的位置解析。 */
  position?: OverlayModalPosition | OverlayDrawerPosition
  /** 弹层标题。 */
  title?: string
  /** 无标题弹层的可访问名称；有 title 时优先使用 title 作为 aria-labelledby。 */
  ariaLabel?: string
  /** 弹层内容的可访问描述；不传时使用内容区域作为 aria-describedby 目标。 */
  ariaDescription?: string
  /** 弹层宽度，支持数字像素值或 CSS 长度。 */
  width?: number | string
  /** modal 高度或上下 drawer 高度。 */
  height?: number | string
  /** 弹层圆角，优先级高于 OverlayProvider 对应类型配置。 */
  radius?: number | string
  /** modal 初始偏移量，遵循上右下左，优先级高于 OverlayProvider 全局配置。 */
  offset?: OverlayOffset
  /** 最小宽度。 */
  minWidth?: number
  /** 最小高度。 */
  minHeight?: number
  /** 点击遮罩层时是否关闭弹层。 */
  maskClosable?: boolean
  /** 按 Esc 时是否关闭弹层。 */
  closeOnEsc?: boolean
  /** 是否显示右上角关闭按钮。 */
  closable?: boolean
  /** 是否显示底部操作栏。 */
  showFooter?: boolean
  /** 是否显示取消按钮。 */
  showCancel?: boolean
  /** 是否显示确认按钮。 */
  showConfirm?: boolean
  /** 取消按钮文案。 */
  cancelText?: string
  /** 确认按钮文案。 */
  confirmText?: string
  /** 是否显示全屏切换按钮。 */
  fullscreen?: boolean
  /** 自定义右上角操作区渲染函数，优先级高于 OverlayProvider 对应类型配置。 */
  extra?: OverlayHeaderExtraRenderer
  /** 右上角按钮基础 class，优先级高于 OverlayProvider 对应类型配置。 */
  actionClassName?: string
  /** modal 和左右 drawer 是否允许拖拽改变尺寸。 */
  resizable?: boolean
  /** 是否让弹层 body 使用 100% 高度。 */
  bodyFullHeight?: boolean
  /** body 是否允许自身滚动。 */
  bodyScrollable?: boolean
  /** body 是否保留内边距。 */
  bodyPadding?: boolean
  /** 自定义底部操作栏渲染函数。 */
  footer?: (ctx: OverlayFooterContext) => VNodeChild
}

/** 弹层 body 组件内通过 useOverlayContext 获取的控制器。 */
export interface OverlayContext<T = unknown> {
  /** 当前弹层 id。 */
  id: string
  /** 关闭当前弹层，并返回 close 动作。 */
  close: () => void
  /** 取消当前弹层，并返回 cancel 动作。 */
  cancel: () => void
  /** 确认当前弹层，并返回 confirm 动作和可选值。 */
  confirm: (value?: T) => void
  /** 注册确认按钮点击时执行的处理函数。 */
  onConfirm: (handler: OverlayConfirmHandler<T>) => void
  /** 设置确认按钮 loading 状态。 */
  setConfirmLoading: (loading: boolean) => void
  /** 设置或清空确认按钮处理函数。 */
  setConfirmHandler: (handler?: OverlayConfirmHandler<T>) => void
}

export type OverlayResolvedOptions = Required<Omit<OverlayOptions, 'actionClassName' | 'ariaDescription' | 'ariaLabel' | 'extra' | 'footer' | 'offset' | 'position' | 'radius' | 'to'>> & Pick<OverlayOptions, 'actionClassName' | 'ariaDescription' | 'ariaLabel' | 'extra' | 'footer' | 'offset' | 'position' | 'radius' | 'to'>

/** 组件式 Modal/Drawer 共用 props。 */
export interface OverlayComponentProps extends Omit<OverlayOptions, 'type'> {}

/** 组件式 Modal/Drawer 支持的插槽。 */
export interface OverlayComponentSlots {
  /** 内容区域默认插槽。 */
  default?: () => VNodeChild
  /** 自定义底部操作栏插槽。 */
  footer?: (ctx: OverlayFooterContext) => VNodeChild
  /** 自定义右上角操作区插槽。 */
  extra?: (ctx: OverlayHeaderExtraContext) => VNodeChild
}

/** 组件式 Modal/Drawer 关闭事件。 */
export interface OverlayComponentEmits {
  /** 同步组件式弹层展示状态。 */
  'update:modelValue': [value: boolean]
  /** 关闭后统一触发，包含 close/cancel/confirm。 */
  'afterClose': [result: OverlayResult]
  /** close 动作触发。 */
  'close': [result: OverlayResult]
  /** cancel 动作触发。 */
  'cancel': [result: OverlayResult]
  /** confirm 动作触发。 */
  'confirm': [result: OverlayResult]
}

/** 组件式 Modal/Drawer emit 函数类型。 */
export type OverlayComponentEmit = <Event extends keyof OverlayComponentEmits>(
  event: Event,
  ...args: OverlayComponentEmits[Event]
) => void

/** 打开弹层后返回的控制器。 */
export interface OverlayController<T = unknown> {
  /** 当前弹层 id。 */
  id: string
  /** 弹层关闭后的结果。 */
  result: Promise<OverlayResult<T>>
}

/** 内部维护的弹层实例数据。 */
export interface OverlayItem {
  /** 弹层唯一 id。 */
  id: string
  /** 是否展示弹层，关闭时先置为 false 等待离场动画结束。 */
  show: boolean
  /** 是否已经 resolve，避免重复关闭或重复确认。 */
  settled: boolean
  /** 确认按钮 loading 状态。 */
  confirmLoading: boolean
  /** 当前弹层注册的确认处理函数。 */
  confirmHandler?: OverlayConfirmHandler
  /** 弹层 body 组件。 */
  component: Component
  /** 传给弹层 body 组件的 props。 */
  props: Record<string, unknown>
  /** 合并默认值后的弹层配置。 */
  options: OverlayResolvedOptions
  /** 当前弹层遮罩层 z-index。 */
  zIndex: number
  /** 当前弹层内容层 z-index。 */
  panelZIndex: number
  /** 结束弹层 Promise 的回调。 */
  resolve: (result: OverlayResult) => void
}
