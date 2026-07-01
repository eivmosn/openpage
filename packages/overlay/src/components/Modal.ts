import type { SlotsType } from 'vue'
import type { OverlayComponentEmit, OverlayComponentProps, OverlayComponentSlots } from '../types'
import { defineComponent } from 'vue'
import { overlayComponentEmits, overlayComponentProps } from '../componentProps'
import { useOverlayComponent } from '../composables/useOverlayComponent'

export default defineComponent({
  name: 'Modal',
  props: overlayComponentProps,
  emits: overlayComponentEmits,
  slots: Object as SlotsType<OverlayComponentSlots>,
  setup(props, { emit, slots }) {
    useOverlayComponent({
      type: 'modal',
      props: props as OverlayComponentProps & { modelValue?: boolean },
      emit: emit as OverlayComponentEmit,
      slots: slots as Readonly<OverlayComponentSlots>,
    })

    /** 组件式 Modal 本身不渲染 DOM，内容交给 overlay 实例渲染。 */
    return () => null
  },
})
