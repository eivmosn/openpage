import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { overlay } from './composables/useOverlay'
import OverlayProvider from './OverlayProvider'

const BodyContent = defineComponent({
  name: 'BodyContent',
  setup() {
    return () => h('p', '弹层内容')
  },
})

/**
 * 等待 overlay.open 的 nextTick 展示流程完成。
 */
async function waitForOverlayRender(): Promise<void> {
  await nextTick()
  await nextTick()
}

/**
 * 查找当前渲染出的 dialog 节点。
 *
 * @returns 返回当前 dialog 元素。
 */
function getDialog(): HTMLElement {
  const dialog = document.querySelector<HTMLElement>('[role="dialog"]')

  if (!dialog) {
    throw new Error('未找到 dialog 元素')
  }

  return dialog
}

afterEach(() => {
  overlay.items.splice(0)
  document.body.innerHTML = ''
})

describe('overlay accessibility', () => {
  it('binds dialog name and description to semantic title and body regions', async () => {
    mount(OverlayProvider, {
      attachTo: document.body,
    })

    overlay.open(BodyContent, {}, {
      title: '编辑页面',
      showFooter: false,
    })
    await waitForOverlayRender()

    const dialog = getDialog()
    const titleId = dialog.getAttribute('aria-labelledby')
    const bodyId = dialog.getAttribute('aria-describedby')

    expect(dialog.getAttribute('aria-modal')).toBe('true')
    expect(titleId).toBeTruthy()
    expect(bodyId).toBeTruthy()
    expect(document.getElementById(titleId ?? '')?.tagName).toBe('H2')
    expect(document.getElementById(titleId ?? '')?.textContent).toBe('编辑页面')
    expect(document.getElementById(bodyId ?? '')?.classList.contains('overlay-vue-panel__body')).toBe(true)
  })

  it('hides the mask from assistive technology and gives untitled dialogs a fallback label', async () => {
    mount(OverlayProvider, {
      attachTo: document.body,
    })

    overlay.open(BodyContent, {}, {
      showFooter: false,
      title: '',
      type: 'drawer',
    })
    await waitForOverlayRender()

    const dialog = getDialog()
    const mask = document.querySelector<HTMLElement>('.overlay-vue-mask')

    expect(dialog.getAttribute('aria-label')).toBe('抽屉')
    expect(dialog.hasAttribute('aria-labelledby')).toBe(false)
    expect(mask?.getAttribute('aria-hidden')).toBe('true')
  })

  it('focuses the opened dialog and restores focus after it is removed', async () => {
    const trigger = document.createElement('button')
    trigger.type = 'button'
    trigger.textContent = '打开'
    document.body.append(trigger)
    trigger.focus()

    const wrapper = mount(OverlayProvider, {
      attachTo: document.body,
    })

    overlay.open(BodyContent, {}, {
      title: '焦点测试',
      showFooter: false,
    })
    await waitForOverlayRender()

    const dialog = getDialog()

    expect(document.activeElement?.id).toBe(dialog.id)

    wrapper.unmount()
    await nextTick()

    expect(document.activeElement).toBe(trigger)
  })
})
