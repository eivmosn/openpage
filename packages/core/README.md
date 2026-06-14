# @openpage/core

`@openpage/core` 是 OpenPage 的页面渲染核心。

它只负责几件事：

- 接收页面 `schema`。
- 编译 schema，生成更适合运行时使用的结构。
- 创建当前页面的 `state`。
- 创建全局 `ctx`。
- 渲染组件树。
- 执行脚本事件和页面生命周期。
- 内置 `openPage`，支持 modal / drawer 打开子页面。

UI 长什么样不在 core 里决定。真实组件通过 `components` 传进来。

## 最小使用

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
      props: {
        placeholder: '请输入用户名',
      },
    },
    {
      id: 'submit',
      type: 'button',
      label: '提交',
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

正常情况下只需要传 `schema` 和 `components`。

## Page 参数

```vue
<Page
  :schema="schema"
  :components="components"
  :ctx="ctx"
  :init-state="initState"
/>
```

- `schema`：页面结构，必传。
- `components`：组件映射，必传。
- `ctx`：外部扩展上下文，不传就是空对象。
- `initState`：页面初始数据，不传就是空对象，只在页面初始化时读取一次。

页面创建后，core 会在内部维护响应式 `state`。

## state 和 ctx

脚本里只暴露四个变量：

- `$event`：当前事件参数。
- `state`：当前页面数据。
- `ctx`：全局上下文和内置方法。
- `params`：打开当前页面时传入的参数。

```text
events: {
  onclick: `
    state.username = 'admin'
    ctx.message.success(state.username)
  `,
}
```

`state.xxx = xxx` 永远修改当前页面。

`ctx` 是只读入口。不要在脚本里重写 `ctx`，所有能力都通过 `ctx.xxx()` 调用。

## 内置 ctx 方法

core 会把内置能力挂到 `ctx` 上。

常用方法：

- `ctx.validate(target?, options?)`：校验表单。
- `ctx.reset(target?, options?)`：重置校验状态。
- `ctx.openPage(options)`：打开子页面。
- `ctx.closePage(result?)`：关闭当前子页面。
- `ctx.getState(path)`：读取当前页面 state。
- `ctx.setParentState(path, value)`：修改上一个页面的 state。
- `ctx.getComponentById(id)`：读取组件配置。
- `ctx.updateComponentById(id, patch)`：修改组件运行时配置。
- `ctx.message`：消息能力，由外部 UI 环境提供。

外部也可以传自己的方法：

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

脚本里直接用：

```text
events: {
  onclick: `
    await ctx.request('/api/user', state)
  `,
}
```

## 校验和重置

校验全部：

```text
events: {
  onclick: `
    const valid = await ctx.validate()
    if (!valid) return
  `,
}
```

只校验一个组件：

```text
events: {
  onclick: `
    await ctx.validate('username')
  `,
}
```

校验多个组件：

```text
events: {
  onclick: `
    await ctx.validate(['username', 'password'])
  `,
}
```

忽略某个区域：

```text
events: {
  onclick: `
    await ctx.validate(undefined, {
      ignore: ['query-form-row'],
    })
  `,
}
```

`reset` 的写法和 `validate` 一样：

```text
events: {
  onclick: `
    await ctx.reset(['username', 'password'])
  `,
}
```

## 打开子页面

`openPage` 用来打开一个新页面，可以是 modal，也可以是 drawer。

```text
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
}
```

`page` 可以是页面 id，也可以直接传一个 `PageSchema`。

如果传的是页面 id，需要在 `ctx.resolvePage` 里返回 schema：

```ts
const ctx = {
  resolvePage(page: string) {
    if (page === 'login-page') {
      return loginSchema
    }
  },
}
```

## 弹层页面滚动布局

openPage 打开的 modal / drawer 页面，建议这样组织：

- 最外层用 flex，方向是 column。
- header / footer 固定高度。
- 中间 body 用 `flex: 1` 和 `minHeight: 0`。
- body 如果开启滚动，不要直接加 padding。
- body 里面再套一个 inner div，把 padding 写在 inner 上。

推荐写法：

```ts
const schema: PageSchema = {
  id: 'child-page',
  title: '子页面',
  children: [
    {
      id: 'child-layout',
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
          id: 'child-body',
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
              id: 'child-body-inner',
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
          id: 'child-footer',
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

不要这样写：

```ts
const body = {
  id: 'child-body',
  type: 'div',
  props: {
    scrollbar: true,
    style: {
      flex: '1 1 auto',
      minHeight: 0,
      overflow: 'hidden',
      padding: '18px 20px',
    },
  },
}
```

滚动容器自己带 padding 时，drawer / modal 高度计算更容易出问题。

## 子页面访问父页面

子页面可以读取：

- `params`：当前页面打开时传入的参数。
- `ctx.parentParams`：上一个页面打开时收到的参数，只读。

子页面如果要修改父页面数据，使用 `ctx.setParentState`。

```text
events: {
  onclick: `
    state.username = 'admin'

    ctx.setParentState('loginUser', {
      username: state.username,
    })

    ctx.closePage({
      action: 'confirm',
      value: state.username,
    })
  `,
}
```

子页面不能直接改父页面 state。这样可以让父子页面的数据流更清楚。

## 页面生命周期

页面 schema 可以写 `initPage`。

它会在页面初始化时执行一次，可以读取 `state`、`ctx`、`params`。

```ts
const schema: PageSchema = {
  id: 'login-page',
  title: '登录',
  initPage: `
    state.username = params.defaultUsername || ''
  `,
  children: [],
}
```

## 运行流程

core 的运行流程很直接：

1. `Page` 接收 `schema` 和 `components`。
2. `compileSchema` 把树形 schema 编译成扁平索引。
3. 创建当前页面的响应式 `state`。
4. 创建只读 `ctx` 入口和内置方法。
5. 渲染组件树。
6. 组件事件触发后执行脚本。
7. 脚本通过 `state` 和 `ctx` 完成页面操作。

## 性能设计

core 会把能提前做的事情放到编译阶段：

- 动态表达式提前编译。
- 有 model 的组件提前索引。
- 有 computedValue 的组件提前索引。
- 有 defaultValue 的组件提前索引。
- 子树 modelPaths 提前索引，供 `validate/reset` 使用。
- 没有交互样式的组件不生成交互 class。

运行时尽量少做全量扫描，优先走编译后的索引。

## 包边界

core 内置页面运行能力和 overlay 打开页面能力。

core 不关心：

- 具体 UI 组件怎么实现。
- 表单样式怎么画。
- 消息组件用哪个库。
- 接口请求怎么封装。

这些都应该通过 `components` 或 `ctx` 注入。
