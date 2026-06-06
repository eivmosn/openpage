import type { CompiledNode } from '../types/compiled'
import { computed, defineComponent, h } from 'vue'
import { createInteractionClassName, omitInteractionProps } from '../interactions/css'
import { runActions } from '../runtime/actions'
import { useRendererContext } from '../runtime/context'
import { evaluateValue } from '../runtime/expression'
import { getNodeByName, resolveRuntimeNode } from '../runtime/nodes'
import { useNodeModel } from '../runtime/useNodeModel'

export const NodeRenderer = defineComponent({
  name: 'OpenPageNodeRenderer',
  props: {
    id: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const context = useRendererContext()

    const node = computed(() => {
      const compiledNode = context.compiled.nodes.get(props.id)

      if (!compiledNode) {
        throw new Error(`[openpage] node not found: ${props.id}`)
      }

      return compiledNode
    })

    const runtimeNode = computed(() => resolveRuntimeNode(context, node.value))

    const renderedNode = computed<CompiledNode>(() => ({
      ...runtimeNode.value,
      label: evaluateValue(runtimeNode.value.label, context) as string | undefined,
      visible: evaluateValue(runtimeNode.value.visible, context),
      disabled: evaluateValue(runtimeNode.value.disabled, context),
      required: evaluateValue(runtimeNode.value.required, context),
      defaultValue: evaluateValue(runtimeNode.value.defaultValue, context),
      computedValue: evaluateValue(runtimeNode.value.computedValue, context),
      props: evaluateNodeProps(runtimeNode.value),
    }))

    const model = useNodeModel(runtimeNode, context)

    /**
     * 触发当前节点配置的事件动作。
     *
     * @param eventName 需要触发的事件名称。
     * @param payload 事件携带的数据。
     */
    function emitNodeEvent(eventName: string, payload?: unknown): Promise<void> {
      return runActions(runtimeNode.value.events[eventName], context, payload)
    }

    /**
     * 通过节点名称触发目标节点配置的事件动作。
     *
     * @param nodeName 目标节点名称。
     * @param eventName 需要触发的事件名称。
     * @param payload 事件携带的数据。
     */
    async function emitNamedNodeEvent(nodeName: string, eventName: string, payload?: unknown): Promise<unknown> {
      const handler = context.eventHandlers.get(nodeName)?.get(eventName)

      if (handler) {
        return await handler(payload)
      }

      const targetNode = getNodeByName(context, nodeName)

      if (!targetNode) {
        throw new Error(`[openpage] node not found by name: ${nodeName}`)
      }

      return runActions(targetNode.events[eventName], context, payload)
    }

    /**
     * 计算节点运行时 props。
     *
     * @param currentNode 当前编译节点。
     * @returns 返回已计算展示表达式的 props。
     */
    function evaluateNodeProps(currentNode: CompiledNode): Record<string, unknown> {
      const evaluatedProps = Object.fromEntries(
        Object.entries(currentNode.props).map(([key, value]) => [
          key,
          evaluateValue(value, context),
        ]),
      )

      return omitInteractionProps(evaluatedProps)
    }

    /**
     * 判断当前节点是否允许渲染。
     *
     * @returns 返回当前节点是否可见。
     */
    function isNodeVisible(): boolean {
      if (runtimeNode.value.visible === undefined) {
        return true
      }

      return Boolean(renderedNode.value.visible)
    }

    /**
     * 渲染当前节点的子节点。
     *
     * @returns 返回 Vue 子节点数组。
     */
    function renderChildren(): unknown {
      return runtimeNode.value.children.map(childId =>
        h(NodeRenderer, {
          key: childId,
          id: childId,
        }),
      )
    }

    /**
     * 创建当前节点组件的公共属性。
     *
     * @returns 返回适配器组件接收的节点属性。
     */
    function resolveComponentProps() {
      return {
        node: renderedNode.value,
        context,
        value: model.value.value,
        emitNodeEvent,
        emitNamedNodeEvent,
        updateModelValue: model.updateValue,
      }
    }

    return () => {
      if (!isNodeVisible()) {
        return null
      }

      const component = context.adapter.components[renderedNode.value.type]

      if (!component) {
        return h('div', { class: 'openpage-missing-node' }, `Missing node type: ${renderedNode.value.type}`)
      }

      const componentProps = resolveComponentProps()
      const interactionClass = createInteractionClassName(context.compiled.id, renderedNode.value.id)

      if (!renderedNode.value.formField || !context.adapter.formItem) {
        return h(component, {
          ...componentProps,
          class: interactionClass,
        }, {
          default: renderChildren,
        })
      }

      const renderedComponent = h(component, componentProps, {
        default: renderChildren,
      })

      return h(context.adapter.formItem, {
        ...componentProps,
        class: interactionClass,
      }, {
        default: () => renderedComponent,
      })
    }
  },
})
