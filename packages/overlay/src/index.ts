import './styles.css'

export { OverlayProvider } from './components'
export type {
  OverlayAction,
  OverlayConfirmHandler,
  OverlayContext,
  OverlayDrawerPosition,
  OverlayFooterContext,
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
