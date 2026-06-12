import './styles.css'

export { OverlayProvider } from './components'
export type {
  OverlayAction,
  OverlayConfirmHandler,
  OverlayContext,
  OverlayFooterContext,
  OverlayItem,
  OverlayOptions,
  OverlayPlacement,
  OverlayProviderProps,
  OverlayResult,
  OverlayType,
} from './types'
export { overlay, useOverlay, useOverlayContext } from './useOverlay'
export { resetOverlayZIndex } from './zIndex'
