export type ButtonHtmlType = 'button' | 'reset' | 'submit'
export type ButtonSize = 'tiny' | 'small' | 'medium' | 'large'
export type ButtonType = 'default' | 'tertiary' | 'primary' | 'success' | 'info' | 'warning' | 'error'
export type InputType = 'text' | 'password' | 'textarea'

/**
 * 解析按钮原生类型配置。
 *
 * @param value Schema 中传入的按钮原生类型。
 * @returns 返回 Naive UI 支持的按钮原生类型。
 */
export function resolveButtonHtmlType(value: unknown): ButtonHtmlType {
  if (value === 'reset' || value === 'submit') {
    return value
  }

  return 'button'
}

/**
 * 解析按钮尺寸配置。
 *
 * @param value Schema 中传入的按钮尺寸。
 * @returns 返回 Naive UI 支持的按钮尺寸；未配置时交给组件库默认值。
 */
export function resolveButtonSize(value: unknown): ButtonSize | undefined {
  if (value === 'tiny' || value === 'small' || value === 'medium' || value === 'large') {
    return value
  }

  return 'medium'
}

/**
 * 解析按钮视觉类型配置。
 *
 * @param value Schema 中传入的按钮视觉类型。
 * @returns 返回 Naive UI 支持的按钮视觉类型。
 */
export function resolveButtonType(value: unknown): ButtonType {
  if (
    value === 'default'
    || value === 'tertiary'
    || value === 'primary'
    || value === 'success'
    || value === 'info'
    || value === 'warning'
    || value === 'error'
  ) {
    return value
  }

  return 'primary'
}

/**
 * 解析输入框类型配置。
 *
 * @param value Schema 中传入的输入框类型。
 * @returns 返回 Naive UI 支持的输入框类型。
 */
export function resolveInputType(value: unknown): InputType {
  if (value === 'password' || value === 'textarea') {
    return value
  }

  return 'text'
}
