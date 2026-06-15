import type { PropType, VNodeChild } from 'vue'
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'OverlaySlotContent',
  props: {
    render: {
      type: Function as PropType<() => VNodeChild>,
      required: true,
    },
  },
  setup(props) {
    /**
     * 渲染组件式调用传入的默认插槽内容。
     *
     * @returns 返回弹层 body 内容节点。
     */
    return () => props.render()
  },
})
