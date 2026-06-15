import type { OverlayComponentEmit, OverlayComponentProps } from './types'
import { defineComponent } from 'vue'
import { overlayComponentEmits, overlayComponentProps } from './componentProps'
import { useOverlayComponent } from './useOverlayComponent'

export default defineComponent({
  name: 'Drawer',
  props: overlayComponentProps,
  emits: overlayComponentEmits,
  setup(props, { emit, slots }) {
    useOverlayComponent({
      type: 'drawer',
      props: props as OverlayComponentProps & { modelValue?: boolean },
      emit: emit as OverlayComponentEmit,
      slots,
    })

    /** 组件式 Drawer 本身不渲染 DOM，内容交给 overlay 实例渲染。 */
    return () => null
  },
})
