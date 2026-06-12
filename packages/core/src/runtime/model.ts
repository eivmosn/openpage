import type { CompiledComponentModel } from '../types/compiled'
import { getByPath, setByPath } from '../utils/path'

/**
 * 判断组件模型是否绑定多个状态路径。
 *
 * @param model 组件模型配置。
 * @returns 返回是否为多路径模型。
 */
export function isMultiPathModel(model: CompiledComponentModel): model is { paths: readonly string[] } {
  return 'paths' in model
}

/**
 * 读取组件模型值。
 *
 * @param state 当前页面状态。
 * @param model 组件模型配置。
 * @returns 单路径返回单个值，多路径返回路径值数组。
 */
export function getModelValue(state: Record<string, unknown>, model: CompiledComponentModel): unknown {
  if (isMultiPathModel(model)) {
    return model.paths.map(path => getByPath(state, path))
  }

  return getByPath(state, model.path)
}

/**
 * 写入组件模型值。
 *
 * @param state 当前页面状态。
 * @param model 组件模型配置。
 * @param value 需要写入的新值。
 */
export function setModelValue(state: Record<string, unknown>, model: CompiledComponentModel, value: unknown): void {
  if (!isMultiPathModel(model)) {
    setByPath(state, model.path, value)
    return
  }

  const values = Array.isArray(value)
    ? value
    : model.paths.map(() => value)

  model.paths.forEach((path, index) => {
    setByPath(state, path, values[index])
  })
}

/**
 * 获取模型调试键名。
 *
 * @param model 组件模型配置。
 * @returns 返回可读的模型键名。
 */
export function getModelKey(model: CompiledComponentModel): string {
  return isMultiPathModel(model) ? model.paths.join(',') : model.path
}

/**
 * 判断两个模型值是否相等。
 *
 * @param left 左侧模型值。
 * @param right 右侧模型值。
 * @returns 返回两个值是否相等。
 */
export function isModelValueEqual(left: unknown, right: unknown): boolean {
  if (!Array.isArray(left) || !Array.isArray(right)) {
    return Object.is(left, right)
  }

  return left.length === right.length && left.every((item, index) => Object.is(item, right[index]))
}
