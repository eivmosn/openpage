# OpenPage Renderer 配置手册

`@openpage/renderer` 是一个由 JSON Schema 驱动的 Vue 页面渲染器。它负责：

- 根据 Schema 创建页面结构和 UI 组件。
- 使用外部受控 `state` 作为页面业务数据。
- 处理字段模型绑定、默认值、表达式、事件脚本和字段联动。
- 通过 UI Adapter 适配 Naive UI 或自定义组件库。

本文档描述当前已经实现的标准配置方式、适用业务场景及能力边界。

## 快速开始

```vue
<script setup lang="ts">
import type { PageSchema } from '@openpage/renderer'
import { createNaiveUiAdapter, Renderer } from '@openpage/renderer'
import { reactive } from 'vue'

const adapter = createNaiveUiAdapter()

const state = reactive({
  form: {
    username: '',
  },
})

const schema: PageSchema = {
  id: 'user-page',
  children: [
    {
      id: 'user-form',
      type: 'form',
      name: 'user-form',
      children: [
        {
          id: 'username',
          type: 'input',
          name: 'username',
          label: '用户名',
          required: true,
        },
      ],
    },
  ],
}
</script>

<template>
  <Renderer
    v-model:state="state"
    :adapter="adapter"
    :schema="schema"
  />
</template>
```

## 核心设计

### Schema 与 State 分离

Schema 只描述页面结构、组件配置、绑定关系和行为，不保存业务 State。

```ts
const schema = {
  id: 'page',
  children: [],
}

const state = {
  form: {
    username: '',
  },
}
```

标准用法：

```vue
<Renderer v-model:state="state" :schema="schema" :adapter="adapter" />
```

Renderer 使用可变受控模式：

- 外部 `state` 是唯一业务数据源。
- 字段修改直接更新对应 State 路径。
- 不深拷贝整个 State。
- 不深度监听整个 State。
- 只触发依赖相应字段的节点重新计算。
- 外部也可以替换整个 `state` 或 `schema` 根对象。

### Schema 更新建议

Schema 应视为只读配置。需要更新时，推荐替换 Schema 根引用：

```ts
schema.value = nextSchema
```

Renderer 会重新编译 Schema。运行时临时修改节点展示属性时，应使用脚本中的
`updateNodeById()` 或 `updateNodeByName()`，不要直接修改 Schema。

## PageSchema

```ts
interface PageSchema {
  id: string
  title?: string
  children: NodeSchema[]
}
```

| 配置项 | 必填 | 说明 |
| --- | --- | --- |
| `id` | 是 | 页面唯一标识，也用于生成稳定交互样式类名。 |
| `title` | 否 | 页面标题元数据，当前不自动渲染。 |
| `children` | 是 | 页面顶层节点列表。 |

示例：

```json
{
  "id": "order-page",
  "title": "订单编辑",
  "children": []
}
```

## NodeSchema

```ts
interface NodeSchema {
  id: string
  type: string
  name?: string
  label?: string
  visible?: unknown
  disabled?: unknown
  required?: unknown
  defaultValue?: unknown
  computedValue?: unknown
  props?: Record<string, unknown>
  children?: NodeSchema[]
  events?: Record<string, EventSchema>
  model?: {
    path: string
  }
}
```

### `id`

节点唯一标识，同一页面内不能重复。

```json
{
  "id": "username",
  "type": "input"
}
```

`updateNodeById()` 使用该字段查找节点。

### `type`

决定使用哪个 Adapter 组件渲染。

Naive UI Adapter 当前内置类型：

| 类型 | 用途 |
| --- | --- |
| `div` | 通用容器和文本展示 |
| `form` | 表单容器和校验 |
| `input` | 单行输入框 |
| `textarea` | 多行输入框 |
| `password` | 密码输入框 |
| `inputNumber` | 数字输入框 |
| `inputOTP` | 验证码输入 |
| `autoComplete` | 自动完成输入 |
| `mention` | 提及输入 |
| `select` | 单选下拉框 |
| `treeSelect` | 树选择器 |
| `date`、`datetime`、`timePicker` | 日期时间选择 |
| `switch` | 开关 |
| `checkboxGroup` | 多选组 |
| `radioGroup` | 单选组 |
| `colorPicker` | 颜色选择 |
| `dynamicTags` | 动态标签 |
| `rate` | 评分 |
| `slider` | 滑块 |
| `qrCode` | 二维码 |
| `button` | 按钮 |

### `name`

节点业务名称。

表单内部的字段节点配置 `name` 后，会自动推导模型路径：

```json
{
  "id": "username",
  "type": "input",
  "name": "username"
}
```

等价于：

```json
{
  "id": "username",
  "type": "input",
  "model": {
    "path": "form.username"
  }
}
```

表单节点的 `name` 还用于脚本提交：

```json
{
  "id": "order-form",
  "type": "form",
  "name": "order-form"
}
```

```js
const valid = await submitForm('order-form')
```

`updateNodeByName()` 和 `getNodeByName()` 也通过 `name` 查找节点。

### `label`

节点标题或展示文本。

```json
{
  "id": "username",
  "type": "input",
  "label": "用户名"
}
```

`label` 支持表达式：

```json
{
  "id": "summary",
  "type": "div",
  "label": "{{ `当前用户：${form.username || '未填写'}` }}"
}
```

### `model.path`

声明组件值与 State 的绑定路径。

```json
{
  "id": "email",
  "type": "input",
  "model": {
    "path": "form.contact.email"
  }
}
```

用户输入后，State 更新为：

```json
{
  "form": {
    "contact": {
      "email": "user@example.com"
    }
  }
}
```

路径支持对象和数组：

```text
form.username
form.contacts[0].email
form.table[0].children[1].name
```

标准建议：

- 简单表单字段优先使用 `name` 自动推导 `form.<name>`。
- 复杂嵌套数据使用显式 `model.path`。
- 不要同时依赖多个路径控制同一个可编辑字段。

### `props`

传给实际 UI 组件的属性。

```json
{
  "id": "username",
  "type": "input",
  "props": {
    "placeholder": "请输入用户名",
    "clearable": true,
    "maxlength": 50
  }
}
```

`props` 中的值支持表达式：

```json
{
  "id": "submit",
  "type": "button",
  "label": "提交",
  "props": {
    "type": "{{ form.valid ? 'primary' : 'default' }}"
  }
}
```

注意：

- Adapter 是否消费某个属性，取决于对应组件实现。
- `props.value` 中的简单路径表达式可以推导为模型绑定，但标准做法仍是使用
  `name` 或 `model.path`。
- 交互样式配置 `hover`、`active`、`focus`、`focusWithin` 不会传给真实组件。

### `children`

声明子节点，只适用于容器类节点。

```json
{
  "id": "layout",
  "type": "div",
  "children": [
    {
      "id": "title",
      "type": "div",
      "label": "页面标题"
    }
  ]
}
```

### `visible`

控制节点是否渲染，支持布尔值和表达式。

```json
{
  "id": "admin-panel",
  "type": "div",
  "visible": "{{ form.role === 'admin' }}"
}
```

只有表达式实际读取的 State 字段变化时，该节点才会重新计算。

### `disabled`

控制节点是否禁用。

```json
{
  "id": "submit",
  "type": "button",
  "disabled": "{{ !form.agreement }}"
}
```

优先使用节点根级 `disabled` 表达业务状态；静态 UI 组件属性也可以写在
`props.disabled`。

### `required`

声明表单字段必填。

```json
{
  "id": "username",
  "type": "input",
  "name": "username",
  "label": "用户名",
  "required": true
}
```

自定义提示可通过 `props.message` 配置：

```json
{
  "required": true,
  "props": {
    "message": "用户名不能为空"
  }
}
```

### `defaultValue`

字段初始化默认值。仅在目标 State 路径为空时写入。

```json
{
  "id": "years",
  "type": "inputNumber",
  "name": "years",
  "defaultValue": 1
}
```

允许写入默认值的空值：

- `undefined`
- `null`
- 空字符串
- 空数组

适合业务：

- 新建表单的初始值。
- 开关默认开启。
- 默认数量、默认日期或默认选项。

不要使用 `defaultValue` 做依赖计算。它只负责初始化，不会在依赖字段变化后持续更新。

### `computedValue`

声明展示型派生值。当前仅 `inputNumber` Adapter 消费该配置。

```json
{
  "id": "total",
  "type": "inputNumber",
  "name": "total",
  "label": "总金额",
  "computedValue": "{{ sum(form.a, form.b) }}"
}
```

行为：

- `computedValue` 会自动写入节点的 `model.path`。
- 首次渲染、外部异步替换 State、依赖字段变化时都会重新计算。
- 计算结果写入 State 后，页面和外部受控 State 会同步更新。
- 数字框自动只读。
- 表达式只在其读取的 State 字段变化时重新计算。
- 所有参数为空时，`sum()` 返回 `undefined`，数字框保持空白。

适合业务：

- 金额合计。
- 数量乘单价。
- 只读统计值。

计算结果属于最终 State，可直接用于提交。为避免计算循环，不要让计算字段直接或间接依赖自身。

计算字段由 Renderer 统一调度：

- 普通节点不会创建计算字段监听。
- 每个计算字段仅创建一个表达式依赖监听。
- 同一轮多个计算结果只通知外部 State 一次。
- 循环依赖达到安全迭代上限后会被终止并输出错误。
- 运行时 Node Patch 不支持动态新增 `computedValue`，应通过更新 Schema 配置计算字段。

## 表达式

表达式格式：

```text
{{ JavaScript 表达式 }}
```

示例：

```json
{
  "visible": "{{ form.role === 'admin' }}",
  "disabled": "{{ !form.enabled }}",
  "label": "{{ `用户：${form.username}` }}",
  "computedValue": "{{ sum(form.a, form.b) }}"
}
```

表达式可以直接读取 State 根字段：

```js
form.username
form.items[0].price
```

### 表达式 Helper

#### `sum(...values)`

对有效数字求和。

```json
{
  "computedValue": "{{ sum(form.a, form.b, form.c) }}"
}
```

规则：

- 忽略 `undefined`、`null` 和空字符串。
- 支持数字及有效数字字符串。
- 忽略无法转换为有限数字的值。
- 全部为空或无效时返回 `undefined`。

### 性能

表达式使用 Vue 响应式依赖自动收集。

```json
{
  "computedValue": "{{ sum(form.a, form.b) }}"
}
```

该表达式只依赖 `form.a` 和 `form.b`：

- 修改 `form.a`：重新计算。
- 修改 `form.b`：重新计算。
- 修改 `form.email`：不会重新计算。

标准建议：

- 表达式保持纯计算，不执行副作用。
- 复杂业务流程使用事件脚本。
- 不要在表达式中遍历超大数据集合。

## Events

`events` 以事件名为 key，支持：

- 字符串脚本。
- 结构化动作。
- 多个动作组成的数组。

```ts
type EventSchema = string | EventActionSchema | EventSchema[]
```

### 常用事件名

| 组件 | 事件 |
| --- | --- |
| `button` | `onclick` |
| `form` | `submit` |
| `input`、`textarea`、`password`、`autoComplete`、`mention`、`inputOTP` | `oninput` |
| `inputNumber`、`select`、`treeSelect`、日期时间、开关、选择组、评分、滑块等 | `onchange` |

### 字符串脚本

脚本可以直接读取和修改 State：

```json
{
  "events": {
    "onclick": "form.username = ''; message.success('已清空')"
  }
}
```

脚本支持异步操作：

```json
{
  "events": {
    "onclick": "const valid = await submitForm('user-form'); if (valid) message.success('提交成功')"
  }
}
```

事件脚本执行结束后，Renderer 会通知外部受控 State 已更新。

### 事件脚本 Helper

| Helper | 说明 |
| --- | --- |
| `$event` / `event` | 当前事件载荷。 |
| `sum(...values)` | 对有效数字求和。 |
| `getState(path)` | 按路径读取 State。 |
| `setState(path, value)` | 按路径更新 State 并通知外部。 |
| `getNodeById(id)` | 获取节点当前运行时配置。 |
| `getNodeByName(name)` | 按名称获取节点当前运行时配置。 |
| `updateNodeById(id, patch)` | 增量更新指定节点运行时配置。 |
| `updateNodeByName(name, patch)` | 按名称增量更新节点运行时配置。 |
| `submitForm(name)` | 校验并提交指定表单，返回是否通过。 |
| `message.success/error/warning/info` | 调用平台消息能力。 |

直接赋值与 `setState()` 都可以使用：

```js
form.username = 'new-name'
```

```js
setState('form.username', 'new-name')
```

标准建议：

- 简单、明确的脚本可以直接修改 `form.xxx`。
- 动态路径使用 `setState()`。
- 复杂脚本拆分业务逻辑，不要在 Schema 中堆积超长脚本。
- Schema 脚本使用 `new Function` 执行，只能执行可信配置，禁止运行用户提供的未审核脚本。

## 静态 Select 字段联动

常见业务：选择人员后，自动带出部门、邮箱和电话。

```json
{
  "id": "employee",
  "type": "select",
  "name": "employeeId",
  "label": "部门人员",
  "props": {
    "options": [
      {
        "label": "林产品",
        "value": "employee-1",
        "departmentId": "product",
        "email": "lin@example.com",
        "phone": "13800000001"
      }
    ]
  },
  "events": {
    "onchange": {
      "type": "static",
      "dependency": {
        "form.departmentId": "{{ $event?.departmentId }}",
        "form.email": "{{ $event?.email }}",
        "form.phone": "{{ $event?.phone }}"
      }
    }
  }
}
```

行为：

- Select 模型保存 `option.value`。
- Select 的 `onchange` 事件载荷 `$event` 是完整选中 Option。
- `dependency` 的 key 是要写入的 State 路径。
- `dependency` 的 value 支持表达式。
- 所有依赖字段批量写入后，只通知一次 State 更新。
- 清空选择时 `$event` 为 `undefined`，推荐使用可选链。

当前静态联动只支持单选 Select。多选联动的结果映射语义尚未定义，不应使用该动作。

## 多动作事件

事件可以配置动作数组，按顺序执行：

```json
{
  "events": {
    "onchange": [
      {
        "type": "static",
        "dependency": {
          "form.email": "{{ $event?.email }}"
        }
      },
      "message.success('关联信息已更新')"
    ]
  }
}
```

## 运行时节点增量更新

需要临时改变节点显示配置时，使用运行时更新：

```js
updateNodeById('submit', {
  label: '处理中',
  disabled: true,
})
```

```js
updateNodeByName('submitButton', {
  visible: false,
})
```

运行时更新只影响目标节点及必要子树，不会重新编译整个 Schema。

适合业务：

- 临时隐藏、禁用节点。
- 根据事件动态修改按钮文案。
- 临时修改组件 Props。

不适合业务：

- 持久化页面配置。
- 增删复杂 Schema 结构。
- 替代业务 State。

注意：运行时修改节点 `name` 不会同步更新名称索引，不推荐修改 `name`。

## 交互样式

节点 `props` 支持交互状态样式：

```json
{
  "id": "card",
  "type": "div",
  "props": {
    "hover": "lift",
    "active": "scale",
    "focusWithin": {
      "boxShadow": "0 0 0 3px rgba(37, 99, 235, 0.2)"
    }
  }
}
```

支持状态：

- `hover`
- `active`
- `focus`
- `focusWithin`

内置预设：

- `lift`
- `scale`
- `glow`
- `soft`
- `none`

交互配置会生成页面级 CSS，不会传给真实 UI 组件。

## 常见业务应该怎么做

### 新建表单默认值

使用 `defaultValue`：

```json
{
  "type": "inputNumber",
  "name": "quantity",
  "defaultValue": 1
}
```

### 根据其他字段控制显示

使用 `visible` 表达式：

```json
{
  "type": "div",
  "visible": "{{ form.type === 'company' }}"
}
```

### 根据勾选状态禁用按钮

使用 `disabled` 表达式：

```json
{
  "type": "button",
  "disabled": "{{ !form.agreement }}"
}
```

### 数字字段实时计算

使用 `computedValue` 和纯计算 Helper：

```json
{
  "type": "inputNumber",
  "computedValue": "{{ sum(form.amountA, form.amountB) }}"
}
```

不要使用 `defaultValue` 做实时计算。

### 选择静态 Option 后带出字段

使用 `static` 结构化动作：

```json
{
  "events": {
    "onchange": {
      "type": "static",
      "dependency": {
        "form.email": "{{ $event?.email }}"
      }
    }
  }
}
```

### 点击按钮重置部分字段

使用脚本直接修改 State：

```json
{
  "events": {
    "onclick": "form.username = ''; form.email = ''; message.success('已重置')"
  }
}
```

### 校验并提交表单

```json
{
  "id": "submit",
  "type": "button",
  "label": "提交",
  "events": {
    "onclick": "const valid = await submitForm('user-form'); if (!valid) return; console.log(form)"
  }
}
```

## 配置优先级和选择原则

| 需求 | 推荐配置 |
| --- | --- |
| 字段绑定业务数据 | `name` 或 `model.path` |
| 字段初始化 | `defaultValue` |
| 只读实时计算 | `computedValue` |
| 节点标题或文本展示 | `label` |
| UI 组件属性 | `props` |
| 显示隐藏 | `visible` |
| 禁用状态 | `disabled` |
| 表单必填 | `required` |
| 静态下拉字段带出 | `events.onchange` + `type: static` |
| 复杂业务流程 | 字符串事件脚本 |
| 临时改变节点展示配置 | `updateNodeById/Name` |
| 持久化页面变化 | 外部更新并替换 Schema |

## 当前能力边界

- `computedValue` 当前只由 Naive UI `inputNumber` 消费。
- `computedValue` 会写入节点模型路径，并应避免循环依赖。
- 静态字段联动当前只支持单选 Select。
- 远程请求动作尚未实现，应由外部业务层或可信事件脚本处理。
- Schema 脚本属于可信配置执行能力，不是安全沙箱。
- Schema 更新当前会重新编译页面；节点运行时 Patch 是增量更新。
- 外部替换整个 State 根对象会让依赖 State 的节点重新计算。

## 推荐完整示例

```json
{
  "id": "payment-page",
  "title": "收款登记",
  "children": [
    {
      "id": "payment-form",
      "type": "form",
      "name": "payment-form",
      "children": [
        {
          "id": "employee",
          "type": "select",
          "name": "employeeId",
          "label": "收款人员",
          "required": true,
          "props": {
            "options": [
              {
                "label": "张三",
                "value": "user-1",
                "departmentId": "finance",
                "email": "zhang@example.com"
              }
            ]
          },
          "events": {
            "onchange": {
              "type": "static",
              "dependency": {
                "form.departmentId": "{{ $event?.departmentId }}",
                "form.email": "{{ $event?.email }}"
              }
            }
          }
        },
        {
          "id": "amount-a",
          "type": "inputNumber",
          "name": "amountA",
          "label": "A 收款"
        },
        {
          "id": "amount-b",
          "type": "inputNumber",
          "name": "amountB",
          "label": "B 收款"
        },
        {
          "id": "total",
          "type": "inputNumber",
          "label": "总金额",
          "computedValue": "{{ sum(form.amountA, form.amountB) }}"
        },
        {
          "id": "submit",
          "type": "button",
          "label": "提交",
          "events": {
            "onclick": "const valid = await submitForm('payment-form'); if (!valid) return; message.success('校验通过')"
          }
        }
      ]
    }
  ]
}
```
