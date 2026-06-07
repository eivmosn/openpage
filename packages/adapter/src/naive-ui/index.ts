import type { GlobalThemeOverrides } from 'naive-ui'
import type { Component } from 'vue'
import type { UiAdapter } from '../types'
import AutoComplete from './components/AutoComplete.vue'
import Button from './components/Button.vue'
import CheckboxGroup from './components/CheckboxGroup.vue'
import ColorPicker from './components/ColorPicker.vue'
import Date from './components/Date.vue'
import Datetime from './components/Datetime.vue'
import Div from './components/Div.vue'
import DynamicTags from './components/DynamicTags.vue'
import Form from './components/Form.vue'
import FormItem from './components/FormItem.vue'
import Input from './components/Input.vue'
import InputNumber from './components/InputNumber.vue'
import InputOTP from './components/InputOTP.vue'
import Mention from './components/Mention.vue'
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

export type NaiveUiComponentMap = Record<string, Component>

export interface NaiveUiAdapter extends UiAdapter {
  themeOverrides: GlobalThemeOverrides
}

/**
 * 创建 Naive UI 适配器。
 *
 * @param components 二开时传入的组件映射，会覆盖默认组件。
 * @returns 返回可插拔 UI 适配器配置。
 */
export function createNaiveUiAdapter(components: Partial<NaiveUiComponentMap> = {}): NaiveUiAdapter {
  return {
    name: 'naive-ui',
    formItem: FormItem,
    themeOverrides: naiveUiThemeOverrides,
    components: {
      div: Div,
      form: Form,
      input: Input,
      autoComplete: AutoComplete,
      textarea: Textarea,
      password: Password,
      inputNumber: InputNumber,
      inputOTP: InputOTP,
      mention: Mention,
      select: Select,
      treeSelect: TreeSelect,
      datetime: Datetime,
      date: Date,
      timePicker: TimePicker,
      switch: Switch,
      checkboxGroup: CheckboxGroup,
      radioGroup: RadioGroup,
      colorPicker: ColorPicker,
      dynamicTags: DynamicTags,
      rate: Rate,
      slider: Slider,
      qrCode: QRCode,
      button: Button,
      ...components,
    },
  }
}

export { naiveUiThemeOverrides }
