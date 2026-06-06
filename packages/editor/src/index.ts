export interface EditorBootstrapOptions {
  rendererPackageName: '@openpage/renderer'
}

/**
 * 创建编辑器包的第一阶段占位信息。
 *
 * @returns 返回编辑器后续接入核心渲染器所需的基础元信息。
 */
export function createEditorBootstrap(): EditorBootstrapOptions {
  return {
    rendererPackageName: '@openpage/renderer',
  }
}
