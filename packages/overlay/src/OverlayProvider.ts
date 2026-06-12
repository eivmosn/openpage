import type { PropType } from 'vue'
import type { OverlayProviderProps } from './types'
import { computed, defineComponent, h, onBeforeUnmount, onMounted, Teleport, Transition, watchEffect } from 'vue'
import OverlayPanel from './OverlayPanel.vue'
import { overlay } from './useOverlay'
import { setOverlayZIndex } from './zIndex'

export default defineComponent({
  name: 'OverlayProvider',
  props: {
    zIndex: {
      type: Number,
      default: undefined,
    },
    contentWrapper: {
      type: [Object, Function] as PropType<OverlayProviderProps['contentWrapper']>,
      default: undefined,
    },
    contentWrapperProps: {
      type: Object as PropType<OverlayProviderProps['contentWrapperProps']>,
      default: undefined,
    },
  },
  setup(props, { slots }) {
    const activeItems = computed(() => overlay.items)

    /**
     * 处理键盘关闭交互。
     *
     * @param event 键盘事件。
     */
    function handleKeydown(event: KeyboardEvent): void {
      if (event.key !== 'Escape') {
        return
      }

      const topItem = [...overlay.items]
        .reverse()
        .find(item => item.show && !item.settled && item.options.closeOnEsc)

      if (topItem) {
        overlay.close(topItem.id)
      }
    }

    /**
     * 点击遮罩时关闭弹层。
     *
     * @param id 弹层 id。
     */
    function handleMaskClick(id: string): void {
      const item = overlay.items.find(current => current.id === id)

      if (item?.options.maskClosable) {
        overlay.close(id)
      }
    }

    /**
     * 获取弹层进出场动画名称。
     *
     * @param item 当前弹层实例。
     * @returns 返回 Vue Transition 名称。
     */
    function getTransitionName(item: typeof overlay.items[number]): string {
      return item.options.type === 'drawer'
        ? `op-overlay-drawer-${item.options.placement}`
        : 'op-overlay-modal'
    }

    onMounted(() => {
      window.addEventListener('keydown', handleKeydown)
    })

    watchEffect(() => {
      setOverlayZIndex(props.zIndex)
    })

    onBeforeUnmount(() => {
      window.removeEventListener('keydown', handleKeydown)
    })

    return () => [
      slots.default?.(),
      h(Teleport, { to: 'body' }, [
        h('div', { class: 'op-overlay-container' }, activeItems.value.map(item => [
          h(Transition, { name: 'op-overlay-mask' }, {
            default: () => item.show
              ? h('div', {
                  class: 'op-overlay-mask',
                  style: { zIndex: item.zIndex },
                  onClick: () => handleMaskClick(item.id),
                })
              : null,
          }),
          h(Transition, {
            name: getTransitionName(item),
            onAfterLeave: () => overlay.afterLeave(item.id),
          }, {
            default: () => item.show
              ? h(OverlayPanel, {
                  key: item.id,
                  contentWrapper: props.contentWrapper,
                  contentWrapperProps: props.contentWrapperProps,
                  item,
                })
              : null,
          }),
        ])),
      ]),
    ]
  },
})
