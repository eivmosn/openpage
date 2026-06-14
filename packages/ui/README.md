# @openpage/ui

`@openpage/ui` 是 OpenPage 默认 UI 包。

它现在基于 Naive UI 做了一套组件映射，让 core 可以通过 schema 里的 `type` 找到真实 Vue 组件。

core 只负责渲染和运行逻辑，UI 包负责这些事：

- 把 `input`、`select`、`button` 这些 schema 类型映射成真实组件。
- 统一字段组件的值读取和写入。
- 统一表单项、label、required、rule、校验状态。
- 提供默认主题配置。

## 基本使用

```vue
<script setup lang="ts">
import { Page } from '@openpage/core'
import { getComponents } from '@openpage/ui'

const components = getComponents()
</script>

<template>
  <Page
    :components="components"
    :schema="schema"
  />
</template>
```

## 组件怎么被找到

schema 里写：

```ts
const schema = {
  id: 'demo-page',
  children: [
    {
      id: 'username',
      type: 'input',
      name: 'username',
      label: '用户名',
    },
  ],
}
```

`type: 'input'` 会去组件映射里找 `input`。

默认映射在 `src/naive-ui/index.ts`：

```ts
export const defaultComponents = {
  form: Form,
  input: withFormItem(Input),
  select: withFormItem(Select),
  button: Button,
}
```

要新增组件，本质上就是：

1. 在 `src/naive-ui/components` 新增一个 `.vue` 文件。
2. 在 `src/naive-ui/index.ts` import 它。
3. 把它加到 `defaultComponents`。
4. schema 里用新的 `type`。

## 组件会收到什么

每个 UI 组件都会收到同一套 props。

```ts
interface UiComponentProps {
  component: CompiledComponent
  context: PageContext
  value: unknown
  emitComponentEvent: (eventName: string, payload?: unknown) => Promise<void>
  updateModelValue: (value: unknown) => void
}
```

常用的是这几个：

- `component`：当前组件配置。
- `component.props`：schema 里写的 props。
- `value`：当前组件绑定的 state 值。
- `updateModelValue(value)`：把新值写回 state。
- `emitComponentEvent(name, payload)`：触发 schema 里的事件脚本。
- `context`：当前页面运行时上下文，里面有 `ctx`、`state`、services 等。

## 开发展示组件

展示组件不需要接入表单，也不需要写入 state。

例子：一个简单的文本组件。

```vue
<script setup lang="ts">
import type { UiComponentProps } from '../../types'

defineOptions({
  name: 'OpenPageNaiveTitle',
  inheritAttrs: false,
})

const props = defineProps<UiComponentProps>()
</script>

<template>
  <div class="openpage-title">
    {{ props.component.label || props.component.props.text }}
  </div>
</template>
```

然后在 `src/naive-ui/index.ts` 里注册：

```ts
import Title from './components/Title.vue'

export const defaultComponents = {
  title: Title,
}
```

schema 里使用：

```ts
const schema = {
  id: 'demo-page',
  children: [
    {
      id: 'page-title',
      type: 'title',
      label: '用户信息',
    },
  ],
}
```

## 开发字段组件

字段组件一般要做三件事：

- 从 `value` 读取当前值。
- 用户修改后调用 `updateModelValue`。
- 需要触发事件时调用 `emitComponentEvent`。

例子：一个输入框组件。

```vue
<script setup lang="ts">
import type { UiComponentProps } from '../../types'
import { NInput } from 'naive-ui'
import { useFormField } from '../composables/useFormField'

defineOptions({
  name: 'OpenPageNaiveCustomInput',
  inheritAttrs: false,
})

const props = defineProps<UiComponentProps>()
const field = useFormField(props)

/**
 * 更新输入值。
 *
 * @param value 输入框的新值。
 */
async function handleUpdateValue(value: string): Promise<void> {
  props.updateModelValue(value)
  await props.emitComponentEvent('oninput', value)
}
</script>

<template>
  <NInput
    :disabled="field.disabled.value"
    :placeholder="field.placeholder.value"
    :value="field.value.value"
    @update:value="handleUpdateValue"
  />
</template>
```

注册时用 `withFormItem` 包一层：

```ts
import CustomInput from './components/CustomInput.vue'
import { withFormItem } from './utils/withFormItem'

export const defaultComponents = {
  customInput: withFormItem(CustomInput),
}
```

这样它就会自动拥有：

- `NFormItem`
- label
- required
- rule
- description tooltip
- `ctx.validate()` 校验能力
- `ctx.reset()` 重置校验能力

schema 里使用：

```ts
const schema = {
  id: 'demo-page',
  children: [
    {
      id: 'username',
      type: 'customInput',
      name: 'username',
      label: '用户名',
      required: true,
      props: {
        placeholder: '请输入用户名',
      },
    },
  ],
}
```

## 校验怎么接入

最简单的方式是：

```ts
customInput: withFormItem(CustomInput)
```

组件本身不用直接写 `NFormItem`。

`withFormItem` 会根据组件配置自动生成表单项：

- `name` 会变成表单路径。
- `label` 会变成表单 label。
- `required` 会生成必填规则。
- `props.rule` 会追加自定义规则。

例子：

```ts
const schema = {
  id: 'demo-page',
  children: [
    {
      id: 'age',
      type: 'inputNumber',
      name: 'age',
      label: '年龄',
      required: true,
      props: {
        rule: {
          validator(_rule: unknown, value: number) {
            return value >= 18
          },
          message: '年龄不能小于 18',
          trigger: ['blur', 'change'],
        },
      },
    },
  ],
}
```

页面脚本里直接调用：

```text
events: {
  onclick: `
    const valid = await ctx.validate()
    if (!valid) return
  `,
}
```

## 需要校验状态的自定义组件

如果组件不是 Naive UI 原生输入组件，而是自己写的原生 input，可以用 `withFormValidation`。

它会把当前表单项的校验状态注入给组件。

注册：

```ts
import NativeInput from './components/NativeInput.vue'
import { withFormItem } from './utils/withFormItem'
import { withFormValidation } from './utils/withFormValidation'

export const defaultComponents = {
  nativeInput: withFormItem(
    withFormValidation(NativeInput, {
      classPrefix: 'openpage-native-input',
    }),
  ),
}
```

组件里读取校验状态：

```vue
<script setup lang="ts">
import type { UiComponentProps } from '../../types'
import { useFormField } from '../composables/useFormField'
import { useFormValidation } from '../utils/withFormValidation'

defineOptions({
  name: 'OpenPageNativeInput',
  inheritAttrs: false,
})

const props = defineProps<UiComponentProps>()
const field = useFormField(props)
const validation = useFormValidation()

/**
 * 更新输入值。
 *
 * @param event 输入事件。
 */
async function handleInput(event: Event): Promise<void> {
  const target = event.target as HTMLInputElement
  props.updateModelValue(target.value)
  validation.triggerInput()
  await props.emitComponentEvent('oninput', target.value)
}
</script>

<template>
  <input
    class="openpage-native-input"
    :class="validation.statusClass.value"
    :disabled="field.disabled.value"
    :placeholder="field.placeholder.value"
    :value="field.value.value"
    @blur="validation.triggerBlur"
    @input="handleInput"
  >
</template>
```

## 组件如何提供事件

组件内部调用：

```ts
await props.emitComponentEvent('onclick')
await props.emitComponentEvent('oninput', value)
await props.emitComponentEvent('onchange', value)
```

schema 里写同名事件：

```ts
const schema = {
  id: 'demo-page',
  children: [
    {
      id: 'save',
      type: 'button',
      label: '保存',
      events: {
        onclick: `
          const valid = await ctx.validate()
          if (!valid) return

          ctx.message.success('保存成功')
        `,
      },
    },
  ],
}
```

事件名没有强制限制，但建议：

- 点击用 `onclick`。
- 输入用 `oninput`。
- 值变化用 `onchange`。
- 确认用 `onconfirm`。

## 组件如何调用外部方法

外部方法统一放在 core 的 `ctx` 里。

UI 组件里可以通过 `props.context.ctx` 调用。

```ts
const message = props.context.ctx.message
message?.success?.('操作成功')
```

更常见的做法是让组件只触发事件，把业务逻辑写在 schema 脚本里：

```ts
await props.emitComponentEvent('onclick')
```

这样组件更简单，也更容易复用。

## 覆盖默认组件

`getComponents` 可以覆盖默认组件。

```ts
import { getComponents } from '@openpage/ui'
import MyButton from './MyButton.vue'

const components = getComponents({
  button: MyButton,
})
```

只要 `MyButton` 接收 `UiComponentProps`，就可以被 core 渲染。

## 开发建议

- 字段组件优先用 `useFormField`。
- 字段组件注册时优先用 `withFormItem`。
- 自定义原生输入需要校验状态时，再用 `withFormValidation`。
- 组件里不要直接改 `context.state`，用 `updateModelValue`。
- 业务动作尽量放到 schema 的事件脚本里，组件只负责触发事件。
- 新增组件后，把它加到 `defaultComponents`，再用 playground 写一个 schema 测试。
