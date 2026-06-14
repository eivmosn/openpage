# OpenPage

OpenPage 是一个用 JSON 渲染页面的 Vue 项目。

你把页面写成 `schema`，OpenPage 负责把它渲染出来。

它适合这些场景：

- 后端返回一段 JSON，前端直接渲染页面。
- 一个按钮打开另一个页面。
- modal / drawer 里继续打开子页面。
- 表单校验、状态修改、接口调用都放在统一脚本里处理。
- 复杂页面需要拆成多个页面维护，而不是把所有东西塞进一个大 JSON。

## 包说明

| 包 | 作用 |
| --- | --- |
| `@openpage/core` | 页面渲染核心，负责渲染 schema、维护 state、执行脚本、打开子页面。 |
| `@openpage/ui` | 默认 UI 组件包，基于 Naive UI，提供 input、select、button、form 等组件。 |
| `@openpage/overlay` | 独立弹层包，提供 modal / drawer，不依赖 Naive UI 的弹窗。 |
| `@openpage/script-runner` | 脚本执行包，负责安全执行事件脚本。 |
| `playground` | 本地测试页面，用来验证 schema 和组件效果。 |

## 最小示例

```vue
<script setup lang="ts">
import type { PageSchema } from '@openpage/core'
import { Page } from '@openpage/core'
import { getComponents } from '@openpage/ui'

const components = getComponents()

const schema: PageSchema = {
  id: 'demo-page',
  title: '示例页面',
  children: [
    {
      id: 'username',
      type: 'input',
      name: 'username',
      label: '用户名',
      required: true,
      props: {
        placeholder: '请输入用户名',
      },
    },
    {
      id: 'submit',
      type: 'button',
      label: '提交',
      props: {
        type: 'primary',
      },
      events: {
        onclick: `
          const valid = await ctx.validate()
          if (!valid) return

          ctx.message.success('提交成功')
        `,
      },
    },
  ],
}
</script>

<template>
  <Page
    :schema="schema"
    :components="components"
  />
</template>
```

正常使用时，`Page` 只需要两个核心参数：

- `schema`：页面 JSON。
- `components`：组件映射。

## schema 怎么写

一个页面就是一个对象。

```ts
const schema = {
  id: 'user-page',
  title: '用户页面',
  children: [],
}
```

一个组件也是一个对象。

```ts
const input = {
  id: 'username',
  type: 'input',
  name: 'username',
  label: '用户名',
  props: {
    placeholder: '请输入用户名',
  },
}
```

常用字段：

- `id`：组件唯一 id。
- `type`：组件类型，比如 `input`、`select`、`button`。
- `name`：绑定到当前页面 `state` 的路径。
- `label`：表单 label 或按钮文字。
- `props`：传给真实 UI 组件的配置。
- `events`：事件脚本。
- `children`：子组件。

## state 是什么

`state` 是当前页面的数据。

组件配置了 `name` 后，会自动绑定到 `state`。

```ts
const schema = {
  id: 'demo-page',
  children: [
    {
      id: 'username',
      type: 'input',
      name: 'form.username',
      label: '用户名',
    },
  ],
}
```

上面的输入框会读写：

```ts
state.form.username
```

脚本里可以直接写：

```text
state.form.username = 'admin'
```

## ctx 是什么

`ctx` 是页面能调用的方法集合。

内置常用方法：

- `ctx.validate()`：校验表单。
- `ctx.reset()`：重置校验。
- `ctx.openPage()`：打开子页面。
- `ctx.closePage()`：关闭当前子页面。
- `ctx.setParentState()`：修改父页面数据。
- `ctx.message`：消息提示。

也可以从外部传自己的方法。

```ts
const ctx = {
  message,
  async request(url: string, data?: unknown) {
    return await fetch(url, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
}
```

传给 Page：

```vue
<Page
  :schema="schema"
  :components="components"
  :ctx="ctx"
/>
```

脚本里使用：

```text
const result = await ctx.request('/api/user', state)
```

## 事件脚本

组件事件写在 `events` 里。

```ts
const button = {
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
}
```

脚本里只有四个变量：

- `$event`：当前事件参数。
- `state`：当前页面数据。
- `ctx`：全局方法。
- `params`：打开当前页面时传入的参数。

## 表单校验

字段组件设置 `required: true` 后，会自动生成必填校验。

```ts
const schema = {
  id: 'login-page',
  children: [
    {
      id: 'username',
      type: 'input',
      name: 'username',
      label: '用户名',
      required: true,
    },
  ],
}
```

校验整个页面：

```text
const valid = await ctx.validate()
```

只校验一个字段：

```text
await ctx.validate('username')
```

校验多个字段：

```text
await ctx.validate(['username', 'password'])
```

忽略某个区域：

```text
await ctx.validate(undefined, {
  ignore: ['query-form-row'],
})
```

`ctx.reset()` 的用法和 `ctx.validate()` 一样。

## 打开子页面

按钮里可以打开新页面。

```ts
const button = {
  id: 'open-login',
  type: 'button',
  label: '打开登录',
  events: {
    onclick: `
      const result = await ctx.openPage({
        page: 'login-page',
        params: {
          source: 'main-page',
        },
        mode: 'modal',
        overlay: {
          title: '登录',
          width: 520,
        },
      })

      if (result.action === 'confirm') {
        ctx.message.success('登录完成')
      }
    `,
  },
}
```

如果 `page` 是字符串，需要在 `ctx.resolvePage` 里返回对应页面。

```ts
import { loginSchema } from './pages/login'

const ctx = {
  resolvePage(page: string) {
    if (page === 'login-page') {
      return loginSchema
    }
  },
}
```

## 弹层页面滚动布局

modal / drawer 里的子页面建议用上下固定、中间自适应的 flex 布局。

中间内容如果要滚动，不要把 `padding` 写在开启 `scrollbar` 的那个 div 上。应该在里面再套一层 div，把 `padding` 写到内层。

推荐写法：

```ts
const page = {
  id: 'login-page',
  children: [
    {
      id: 'login-layout',
      type: 'div',
      props: {
        style: {
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          minHeight: 0,
        },
      },
      children: [
        {
          id: 'login-body',
          type: 'div',
          props: {
            scrollbar: true,
            style: {
              flex: '1 1 auto',
              minHeight: 0,
              overflow: 'hidden',
            },
          },
          children: [
            {
              id: 'login-body-inner',
              type: 'div',
              props: {
                style: {
                  padding: '18px 20px',
                },
              },
              children: [
                {
                  id: 'username',
                  type: 'input',
                  name: 'username',
                  label: '用户名',
                },
              ],
            },
          ],
        },
        {
          id: 'login-footer',
          type: 'div',
          props: {
            style: {
              borderTop: '1px solid #e5e7eb',
              flex: '0 0 auto',
              padding: '12px 20px',
            },
          },
          children: [],
        },
      ],
    },
  ],
}
```

这样滚动区域高度更稳定，滚动条也不会因为 padding 计算出问题。

## 子页面修改父页面

子页面可以读取自己的 `params`。

```text
state.source = params.source
```

子页面如果要修改父页面，使用 `ctx.setParentState`。

```text
ctx.setParentState('loginUser', {
  username: state.username,
})
```

关闭子页面：

```text
ctx.closePage({
  action: 'confirm',
  value: state.username,
})
```

## 页面初始化

页面可以写 `initPage`。

```ts
const schema = {
  id: 'login-page',
  title: '登录',
  initPage: `
    state.username = params.defaultUsername || ''
  `,
  children: [],
}
```

页面创建时会执行一次。

## 自定义组件

可以覆盖默认组件。

```vue
<script setup lang="ts">
import { Page } from '@openpage/core'
import { getComponents } from '@openpage/ui'
import MyButton from './MyButton.vue'

const components = getComponents({
  button: MyButton,
})
</script>

<template>
  <Page
    :schema="schema"
    :components="components"
  />
</template>
```

自定义组件需要接收 OpenPage 传入的统一 props。

字段组件开发可以看 `packages/ui/README.md`。

core 的运行说明可以看 `packages/core/README.md`。

## 本地开发

安装依赖：

```sh
pnpm install
```

类型检查：

```sh
pnpm typecheck
```

测试：

```sh
pnpm test
```

构建：

```sh
pnpm build
```

启动 playground：

```sh
pnpm dev
```

## 开发建议

- 页面结构写在 schema。
- 页面数据放在 state。
- 外部能力放在 ctx。
- 业务动作写在事件脚本里。
- 子页面用 `ctx.openPage` 打开。
- 子页面修改父页面用 `ctx.setParentState`。
- 新组件优先放到 `@openpage/ui`。
- 弹窗能力优先用 `@openpage/overlay`。
