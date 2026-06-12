import type { Component, VNodeChild } from 'vue'

export type OverlayType = 'modal' | 'drawer'
export type OverlayAction = 'confirm' | 'cancel' | 'close'
export type OverlayPlacement = 'right' | 'left' | 'top' | 'bottom'

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

/** OverlayProvider 全局配置。 */
export interface OverlayProviderProps {
  /** 弹层基础 z-index，用于适配不同第三方组件库的弹层层级。 */
  zIndex?: number
  /** modal 圆角，支持数字像素值或 CSS 长度。 */
  modalRadius?: number | string
  /** drawer 圆角，支持数字像素值或 CSS 长度。 */
  drawerRadius?: number | string
  /** 内容区域滚动容器组件，例如 Naive UI 的 NScrollbar。 */
  contentWrapper?: Component
  /** 传给内容区域滚动容器组件的 props。 */
  contentWrapperProps?: Record<string, unknown>
}

/** overlay.open 的第三个参数，用于控制弹层展示方式和交互行为。 */
export interface OverlayOptions {
  /** 弹层类型：modal 为居中弹窗，drawer 为抽屉。 */
  type?: OverlayType
  /** drawer 弹出方向。 */
  placement?: OverlayPlacement
  /** 弹层标题。 */
  title?: string
  /** 弹层宽度，支持数字像素值或 CSS 长度。 */
  width?: number | string
  /** modal 高度或上下 drawer 高度。 */
  height?: number | string
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

export type OverlayResolvedOptions = Required<Omit<OverlayOptions, 'footer'>> & Pick<OverlayOptions, 'footer'>

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
