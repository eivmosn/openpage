import type { CSSProperties, PropType } from 'vue'
import type { OverlayProviderProps } from './types'
import { computed, defineComponent, h, onBeforeUnmount, onMounted, Teleport, Transition, watchEffect } from 'vue'
import OverlayPanel from './OverlayPanel.vue'
import { resolveDrawerPosition } from './overlayPosition'
import { isStaticPosition, isViewportOverlayTarget, resolveOverlayTarget } from './overlayTarget'
import { overlay } from './useOverlay'
import { formatCssUnit } from './utils'
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
    modal: {
      type: Object as PropType<OverlayProviderProps['modal']>,
      default: undefined,
    },
    drawer: {
      type: Object as PropType<OverlayProviderProps['drawer']>,
      default: undefined,
    },
  },
  setup(props, { slots }) {
    const activeItems = computed(() => overlay.items)
    const positionedTargets = new Map<HTMLElement, string>()
    const containerStyle = computed<CSSProperties>(() => {
      const style: CSSProperties = {}
      const modalRadius = formatCssUnit(props.modal?.radius)
      const drawerRadius = formatCssUnit(props.drawer?.radius)

      if (modalRadius) {
        style['--overlay-vue-modal-radius'] = modalRadius
      }

      if (drawerRadius) {
        style['--overlay-vue-radius'] = drawerRadius
      }

      return style
    })

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
        ? `overlay-vue-drawer-${resolveDrawerPosition(item, props)}`
        : 'overlay-vue-modal'
    }

    /**
     * 解析可自动补定位上下文的本地挂载元素。
     *
     * @param target Teleport 挂载目标。
     * @returns 返回可操作的 HTMLElement。
     */
    function resolveLocalTargetElement(target: ReturnType<typeof resolveOverlayTarget>): HTMLElement | undefined {
      if (typeof document === 'undefined' || typeof HTMLElement === 'undefined') {
        return undefined
      }

      if (isViewportOverlayTarget(target)) {
        return undefined
      }

      if (typeof target === 'string') {
        const element = document.querySelector(target)

        return element instanceof HTMLElement ? element : undefined
      }

      return target instanceof HTMLElement ? target : undefined
    }

    /**
     * 为本地挂载目标自动补足定位上下文。
     *
     * @param targets 当前活跃弹层使用到的本地挂载元素。
     */
    function syncLocalTargetPosition(targets: Set<HTMLElement>): void {
      if (typeof window === 'undefined') {
        return
      }

      for (const target of targets) {
        if (positionedTargets.has(target) || !isStaticPosition(window.getComputedStyle(target).position)) {
          continue
        }

        positionedTargets.set(target, target.style.position)
        target.style.position = 'relative'
      }

      for (const [target, previousPosition] of positionedTargets) {
        if (targets.has(target)) {
          continue
        }

        target.style.position = previousPosition
        positionedTargets.delete(target)
      }
    }

    onMounted(() => {
      window.addEventListener('keydown', handleKeydown)
    })

    watchEffect(() => {
      setOverlayZIndex(props.zIndex)
    })

    watchEffect(() => {
      const targets = new Set<HTMLElement>()

      for (const item of activeItems.value) {
        const target = resolveLocalTargetElement(resolveOverlayTarget(item, props))

        if (target) {
          targets.add(target)
        }
      }

      syncLocalTargetPosition(targets)
    })

    onBeforeUnmount(() => {
      window.removeEventListener('keydown', handleKeydown)
      syncLocalTargetPosition(new Set())
    })

    return () => [
      slots.default?.(),
      ...activeItems.value.map((item) => {
        const target = resolveOverlayTarget(item, props)

        return h(Teleport, { key: item.id, to: target }, [
          h('div', {
            class: [
              'overlay-vue-container',
              { 'is-local-target': !isViewportOverlayTarget(target) },
            ],
            style: containerStyle.value,
          }, [
            h(Transition, { name: 'overlay-vue-mask' }, {
              default: () => item.show
                ? h('div', {
                    class: 'overlay-vue-mask',
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
                    drawer: props.drawer,
                    item,
                    modal: props.modal,
                  })
                : null,
            }),
          ]),
        ])
      }),
    ]
  },
})
