import './styles.css'

export { Drawer, Modal, OverlayProvider } from './components'
export { overlay, useOverlay, useOverlayContext } from './composables/useOverlay'
export { resetOverlayZIndex } from './core/zIndex'
export type {
  OverlayAction,
  OverlayComponentEmits,
  OverlayComponentProps,
  OverlayComponentSlots,
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
