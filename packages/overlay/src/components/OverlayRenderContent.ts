import type { PropType, VNodeChild } from 'vue'
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'OverlayRenderContent',
  props: {
    content: {
      type: null as unknown as PropType<VNodeChild>,
      required: true,
    },
  },
  setup(props) {
    /**
     * 渲染调用方返回的 VNode 内容。
     *
     * @returns 返回需要插入到当前位置的 VNode 内容。
     */
    return () => props.content
  },
})
