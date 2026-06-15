import './styles.css'

export { Drawer, Modal, OverlayProvider } from './components'
export type {
  OverlayAction,
  OverlayComponentEmits,
  OverlayComponentProps,
  OverlayConfirmHandler,
  OverlayContext,
  OverlayController,
  OverlayDrawerPosition,
  OverlayFooterContext,
  OverlayHeaderExtraContext,
  OverlayHeaderExtraRenderer,
  OverlayItem,
  OverlayModalPosition,
  OverlayOffset,
  OverlayOptions,
  OverlayProviderDrawerOptions,
  OverlayProviderModalOptions,
  OverlayProviderProps,
  OverlayResult,
  OverlayType,
} from './types'
export { overlay, useOverlay, useOverlayContext } from './useOverlay'
export { resetOverlayZIndex } from './zIndex'
