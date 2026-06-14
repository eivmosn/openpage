# @openpage/overlay

Vue 3 弹层包，提供 modal、drawer、拖拽、resize、全屏、footer 操作区、Promise 关闭结果和弹层内上下文能力。

## 安装和入口

```ts
import { overlay, OverlayProvider, useOverlay, useOverlayContext } from '@openpage/overlay'
import '@openpage/overlay/style.css'
```

在 monorepo 内使用源码包时，样式会通过包入口自动引入。

## 基础用法

在应用根部包一层 `OverlayProvider`：

```vue
<script setup lang="ts">
import { OverlayProvider } from '@openpage/overlay'
import { NScrollbar } from 'naive-ui'
</script>

<template>
  <OverlayProvider
    :z-index="2000"
    :modal="{ radius: 12, position: 'center' }"
    :drawer="{ radius: 0, position: 'right' }"
    :content-wrapper="NScrollbar"
  >
    <AppContent />
  </OverlayProvider>
</template>
```

打开弹层：

```ts
import { useOverlay } from '@openpage/overlay'
import UserForm from './UserForm.vue'

const overlay = useOverlay()

const result = await overlay.open(UserForm, { userId: '1001' }, {
  type: 'modal',
  title: '编辑用户',
  width: 640,
  height: 520,
  position: 'top-right',
  offset: [64, 36],
})
```

`overlay.open` 返回 Promise，关闭后返回：

```ts
interface OverlayResult<T = unknown> {
  action: 'confirm' | 'cancel' | 'close'
  value?: T
}
```

## OverlayProvider

`OverlayProvider` 提供全局默认配置。单个 `overlay.open` 的 `OverlayOptions` 优先级最高。

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `zIndex` | `number` | 内部默认层级 | 弹层基础层级 |
| `modal` | `OverlayProviderModalOptions` | `{ position: 'center' }` | modal 全局默认配置 |
| `drawer` | `OverlayProviderDrawerOptions` | `{ position: 'right' }` | drawer 全局默认配置 |
| `contentWrapper` | `Component` | `undefined` | body 内容滚动包装组件，例如 `NScrollbar` |
| `contentWrapperProps` | `Record<string, unknown>` | `undefined` | 传给 `contentWrapper` 的 props |

```ts
interface OverlayProviderModalOptions {
  radius?: number | string
  position?: OverlayModalPosition
  offset?: OverlayOffset
}

interface OverlayProviderDrawerOptions {
  radius?: number | string
  position?: OverlayDrawerPosition
}
```

## OverlayOptions

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `type` | `'modal' \| 'drawer'` | `'modal'` | 弹层类型 |
| `position` | `OverlayModalPosition \| OverlayDrawerPosition` | modal 为 `'center'`，drawer 为 `'right'` | 初始位置 |
| `title` | `string` | `''` | 标题 |
| `width` | `number \| string` | `520` | modal 宽度、左右 drawer 宽度 |
| `height` | `number \| string` | `''` | modal 高度、上下 drawer 高度 |
| `radius` | `number \| string` | Provider 配置 | 单个弹层圆角 |
| `offset` | `OverlayOffset` | `undefined` | modal 初始偏移量 |
| `minWidth` | `number` | `320` | 最小宽度 |
| `minHeight` | `number` | `240` | 最小高度 |
| `maskClosable` | `boolean` | `true` | 点击遮罩关闭 |
| `closeOnEsc` | `boolean` | `true` | 按 Esc 关闭 |
| `closable` | `boolean` | `true` | 显示右上角关闭按钮 |
| `showFooter` | `boolean` | `true` | 显示 footer |
| `showCancel` | `boolean` | `true` | 显示取消按钮 |
| `showConfirm` | `boolean` | `true` | 显示确认按钮 |
| `cancelText` | `string` | `'取消'` | 取消按钮文案 |
| `confirmText` | `string` | `'确认'` | 确认按钮文案 |
| `fullscreen` | `boolean` | `true` | 显示全屏切换按钮 |
| `resizable` | `boolean` | `true` | 是否允许 resize |
| `bodyFullHeight` | `boolean` | `false` | body 是否占满剩余高度 |
| `bodyScrollable` | `boolean` | `true` | body 是否自身滚动 |
| `bodyPadding` | `boolean` | `true` | body 是否保留内边距 |
| `footer` | `(ctx: OverlayFooterContext) => VNodeChild` | `undefined` | 自定义 footer |

## Modal 位置

```ts
type OverlayModalPosition = 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'left' | 'right' | 'bottom'
```

默认是 `center`。示例：

```ts
overlay.open(Component, props, {
  type: 'modal',
  position: 'top-left',
  offset: [75, null, null, 30],
})
```

## Offset 规则

`offset` 是上、右、下、左顺序：

```ts
type OverlayOffset = readonly [
  top?: number | null,
  right?: number | null,
  bottom?: number | null,
  left?: number | null,
]
```

位置只消费与自身有关的偏移值：

| position | 生效 offset |
| --- | --- |
| `center` | `offset[0]`，用于设置距离顶部；不传时保持真正居中 |
| `top-left` | `offset[0]` 和 `offset[3]` |
| `top-right` | `offset[0]` 和 `offset[1]` |
| `bottom-left` | `offset[2]` 和 `offset[3]` |
| `bottom-right` | `offset[2]` 和 `offset[1]` |
| `left` | `offset[3]` |
| `right` | `offset[1]` |
| `bottom` | `offset[2]` |

未传或传 `null` 表示该方向使用内部默认边距。负数会按 `0` 处理。

## Drawer 位置

```ts
type OverlayDrawerPosition = 'right' | 'left' | 'top' | 'bottom'
```

默认是 `right`。左右 drawer 使用 `width`，上下 drawer 使用 `height`：

```ts
overlay.open(Component, props, {
  type: 'drawer',
  position: 'bottom',
  height: 360,
  minHeight: 240,
})
```

drawer 的 resize 手柄会跟随位置变化：

| position | resize 方向 |
| --- | --- |
| `right` | 左边缘 |
| `left` | 右边缘 |
| `top` | 下边缘 |
| `bottom` | 上边缘 |

## Footer 和确认处理

弹层内组件可以通过 `useOverlayContext` 注册确认逻辑：

```vue
<script setup lang="ts">
import { useOverlayContext } from '@openpage/overlay'

const overlay = useOverlayContext<{ id: string }>()

overlay.onConfirm(async () => {
  return { id: '1001' }
})
</script>
```

点击确认按钮会执行注册的 handler：

- 返回 `false` 时阻止关闭
- 返回其他值时以 `action: 'confirm'` 关闭，并作为 `result.value`
- Promise 执行期间确认按钮会进入 loading 状态

也可以自定义 footer：

```ts
overlay.open(Component, props, {
  footer: ({ cancel, triggerConfirm }) => [
    h('button', { onClick: cancel }, '返回'),
    h('button', { onClick: triggerConfirm }, '保存'),
  ],
})
```

## 弹层内上下文

```ts
interface OverlayContext<T = unknown> {
  id: string
  close: () => void
  cancel: () => void
  confirm: (value?: T) => void
  onConfirm: (handler: OverlayConfirmHandler<T>) => void
  setConfirmLoading: (loading: boolean) => void
  setConfirmHandler: (handler?: OverlayConfirmHandler<T>) => void
}
```

## 全局控制器

```ts
const overlay = useOverlay()

overlay.close()
overlay.close(id)
overlay.closeAll()
```

`overlay.close()` 不传 id 时会关闭最上层弹层。

## 交互行为

- modal 标题栏支持拖拽。
- modal 支持八方向 resize。
- drawer 支持按位置对应边缘 resize。
- 全屏切换会记录当前矩形，再恢复到进入全屏前的位置和尺寸。
- 拖拽过程中使用 `transform: translate3d(...)`，减少布局更新。

## Playground 验证

playground 中提供独立测试页：

```txt
Overlay Position
```

该页面包含所有 modal 和 drawer 位置按钮，并覆盖不同 offset、footer、复杂嵌套内容、嵌套弹层、拖拽、resize、全屏场景。

## 构建和校验

```bash
pnpm --filter @openpage/overlay typecheck
pnpm --filter @openpage/overlay build
pnpm lint
```
