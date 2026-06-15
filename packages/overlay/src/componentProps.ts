import type { PropType } from 'vue'
import type { OverlayComponentProps } from './types'

const optionalBooleanProp = {
  type: Boolean,
  default: undefined,
}

/** 组件式 Modal/Drawer 的公共 props 声明。 */
export const overlayComponentProps = {
  modelValue: Boolean,
  title: String,
  width: [Number, String] as PropType<OverlayComponentProps['width']>,
  height: [Number, String] as PropType<OverlayComponentProps['height']>,
  radius: [Number, String] as PropType<OverlayComponentProps['radius']>,
  position: String as PropType<OverlayComponentProps['position']>,
  offset: Array as unknown as PropType<OverlayComponentProps['offset']>,
  minWidth: Number,
  minHeight: Number,
  maskClosable: optionalBooleanProp,
  closeOnEsc: optionalBooleanProp,
  closable: optionalBooleanProp,
  showFooter: optionalBooleanProp,
  showCancel: optionalBooleanProp,
  showConfirm: optionalBooleanProp,
  cancelText: String,
  confirmText: String,
  fullscreen: optionalBooleanProp,
  extra: Function as PropType<OverlayComponentProps['extra']>,
  actionClassName: String,
  resizable: optionalBooleanProp,
  bodyFullHeight: optionalBooleanProp,
  bodyScrollable: optionalBooleanProp,
  bodyPadding: optionalBooleanProp,
  footer: Function as PropType<OverlayComponentProps['footer']>,
}

/** 组件式 Modal/Drawer 的公共事件声明。 */
export const overlayComponentEmits = [
  'update:modelValue',
  'afterClose',
  'close',
  'cancel',
  'confirm',
]
