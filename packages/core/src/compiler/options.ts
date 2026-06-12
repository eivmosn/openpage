import type { ComponentSchema } from '../types/schema'

export interface CompileSchemaOptions {
  dynamicFieldKeys?: readonly string[]
}

export const defaultDynamicFieldKeys = ['label', 'visible', 'disabled', 'defaultValue', 'required'] as const satisfies readonly (keyof ComponentSchema)[]

/**
 * 解析 Schema 编译配置。
 *
 * @param options 外部传入的编译配置。
 * @returns 返回归一化后的编译配置。
 */
export function resolveCompileSchemaOptions(options: CompileSchemaOptions = {}): Required<CompileSchemaOptions> {
  return {
    dynamicFieldKeys: options.dynamicFieldKeys || defaultDynamicFieldKeys,
  }
}
