import type { CompiledNode } from '../types/compiled'
import type { RendererContext, RuntimeNodePatch } from '../types/runtime'

/**
 * 通过节点 id 获取运行时节点。
 *
 * @param context 当前渲染器运行时上下文。
 * @param id 需要查询的节点 id。
 * @returns 返回合并运行时更新后的节点，未找到时返回 undefined。
 */
export function getNodeById(context: RendererContext, id: string): CompiledNode | undefined {
  const node = context.compiled.nodes.get(id)

  if (!node) {
    return undefined
  }

  return resolveRuntimeNode(context, node)
}

/**
 * 通过节点名称获取运行时节点。
 *
 * @param context 当前渲染器运行时上下文。
 * @param name 需要查询的节点名称。
 * @returns 返回合并运行时更新后的节点，未找到时返回 undefined。
 */
export function getNodeByName(context: RendererContext, name: string): CompiledNode | undefined {
  const id = context.compiled.nodeNames.get(name)

  if (!id) {
    return undefined
  }

  return getNodeById(context, id)
}

/**
 * 通过节点 id 更新运行时节点信息。
 *
 * @param context 当前渲染器运行时上下文。
 * @param id 需要更新的节点 id。
 * @param patch 需要合并到节点上的运行时更新。
 * @returns 返回是否更新成功。
 */
export function updateNodeById(context: RendererContext, id: string, patch: RuntimeNodePatch): boolean {
  if (!context.compiled.nodes.has(id)) {
    return false
  }

  context.nodePatches[id] = mergeNodePatch(context.nodePatches[id], patch)
  return true
}

/**
 * 通过节点名称更新运行时节点信息。
 *
 * @param context 当前渲染器运行时上下文。
 * @param name 需要更新的节点名称。
 * @param patch 需要合并到节点上的运行时更新。
 * @returns 返回是否更新成功。
 */
export function updateNodeByName(context: RendererContext, name: string, patch: RuntimeNodePatch): boolean {
  const id = context.compiled.nodeNames.get(name)

  if (!id) {
    return false
  }

  return updateNodeById(context, id, patch)
}

/**
 * 合并编译节点和运行时节点更新。
 *
 * @param context 当前渲染器运行时上下文。
 * @param node 原始编译节点。
 * @returns 返回可用于渲染的运行时节点。
 */
export function resolveRuntimeNode(context: RendererContext, node: CompiledNode): CompiledNode {
  const patch = context.nodePatches[node.id]

  if (!patch) {
    return node
  }

  return {
    ...node,
    ...patch,
    id: node.id,
    props: {
      ...node.props,
      ...patch.props,
    },
    events: {
      ...node.events,
      ...patch.events,
    },
    children: patch.children || node.children,
    model: patch.model || node.model,
  }
}

/**
 * 合并两次运行时节点更新。
 *
 * @param previous 已存在的节点更新。
 * @param patch 新的节点更新。
 * @returns 返回合并后的节点更新。
 */
function mergeNodePatch(previous: RuntimeNodePatch | undefined, patch: RuntimeNodePatch): RuntimeNodePatch {
  return {
    ...previous,
    ...patch,
    props: {
      ...previous?.props,
      ...patch.props,
    },
    events: {
      ...previous?.events,
      ...patch.events,
    },
  }
}
