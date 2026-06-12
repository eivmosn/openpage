import type { GlobalThemeOverrides } from 'naive-ui'
import type { OpenPageComponents } from '../types'
import { formWrapperKey } from '@openpage/core'
import AutoComplete from './components/AutoComplete.vue'
import Button from './components/Button.vue'
import Carousel from './components/Carousel.vue'
import CheckboxGroup from './components/CheckboxGroup.vue'
import ColorPicker from './components/ColorPicker.vue'
import Date from './components/Date.vue'
import Datetime from './components/Datetime.vue'
import Div from './components/Div.vue'
import DynamicTags from './components/DynamicTags.vue'
import Form from './components/Form.vue'
import Images from './components/Images.vue'
import Input from './components/Input.vue'
import InputNumber from './components/InputNumber.vue'
import InputOTP from './components/InputOTP.vue'
import Mention from './components/Mention.vue'
import NativeInput from './components/NativeInput.vue'
import Password from './components/Password.vue'
import QRCode from './components/QRCode.vue'
import RadioGroup from './components/RadioGroup.vue'
import Rate from './components/Rate.vue'
import Select from './components/Select.vue'
import Slider from './components/Slider.vue'
import Switch from './components/Switch.vue'
import Textarea from './components/Textarea.vue'
import TimePicker from './components/TimePicker.vue'
import TreeSelect from './components/TreeSelect.vue'
import { naiveUiThemeOverrides } from './theme'
import { withFormItem } from './utils/withFormItem'
import { withFormValidation } from './utils/withFormValidation'

/**
 * OpenPage 默认 UI 组件映射。
 */
export const defaultComponents = {
  [formWrapperKey]: Form,
  carousel: Carousel,
  div: Div,
  input: withFormItem(Input),
  nativeInput: withFormItem(withFormValidation(NativeInput, { classPrefix: 'openpage-native-input' })),
  autoComplete: withFormItem(AutoComplete),
  textarea: withFormItem(Textarea),
  password: withFormItem(Password),
  inputNumber: withFormItem(InputNumber),
  inputOTP: withFormItem(InputOTP),
  images: withFormItem(Images),
  mention: withFormItem(Mention),
  select: withFormItem(Select),
  treeSelect: withFormItem(TreeSelect),
  datetime: withFormItem(Datetime),
  date: withFormItem(Date),
  timePicker: withFormItem(TimePicker),
  switch: withFormItem(Switch),
  checkboxGroup: withFormItem(CheckboxGroup),
  radioGroup: withFormItem(RadioGroup),
  colorPicker: withFormItem(ColorPicker),
  dynamicTags: withFormItem(DynamicTags),
  rate: withFormItem(Rate),
  slider: withFormItem(Slider),
  qrCode: withFormItem(QRCode),
  button: Button,
} satisfies OpenPageComponents

/**
 * 获取 OpenPage 默认 UI 组件映射。
 *
 * @param components 二开时传入的组件映射，会覆盖默认组件。
 * @returns 返回合并后的 UI 组件映射。
 */
export function getComponents(components: Partial<OpenPageComponents> = {}): OpenPageComponents {
  return {
    ...defaultComponents,
    ...components,
  }
}

/**
 * 获取 Naive UI 主题覆盖配置。
 *
 * @returns 返回 OpenPage 默认主题覆盖配置。
 */
export function getThemeOverrides(): GlobalThemeOverrides {
  return naiveUiThemeOverrides
}

export { naiveUiThemeOverrides }
