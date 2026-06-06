import type { StyleValue } from 'vue'

export interface ThumbProps {
  vertical?: boolean
  always?: boolean
}

export interface BarProps {
  always?: boolean
  minSize: number
}

export type ScrollbarDirection = 'top' | 'bottom' | 'left' | 'right'

export interface ScrollbarProps {
  distance?: number
  height?: number | string
  maxHeight?: number | string
  native?: boolean
  wrapStyle?: StyleValue
  wrapClass?: string | string[]
  viewClass?: string | string[]
  viewStyle?: StyleValue
  noresize?: boolean
  tag?: keyof HTMLElementTagNameMap | (string & {})
  always?: boolean
  minSize?: number
  tabindex?: number | string
  id?: string
  role?: string
  ariaLabel?: string
  ariaOrientation?: 'horizontal' | 'vertical' | 'undefined'
}
