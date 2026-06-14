import type { RuntimeContext, RuntimeParentPageContext } from '../../types/runtime'
import { readonly } from 'vue'
import { setByPath } from '../../utils/path'

/**
 * 创建子页面可访问的父页面上下文。
 *
 * @param context 当前父页面运行时上下文。
 * @returns 返回受控的父页面访问协议。
 */
export function createParentPageContext(context: RuntimeContext): RuntimeParentPageContext {
  return {
    pageId: context.compiled.id,
    params: readonly(context.params) as Readonly<Record<string, unknown>>,
    state: readonly(context.state) as Record<string, unknown>,
    setState: (pathOrPatch, value) => {
      if (typeof pathOrPatch === 'string') {
        setByPath(context.state, pathOrPatch, value)
      }
      else {
        Object.assign(context.state, pathOrPatch)
      }

      context.services.notifyStateChange()
    },
    emit: async () => {},
  }
}
