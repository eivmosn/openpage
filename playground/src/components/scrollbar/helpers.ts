export const isClient = typeof window !== 'undefined'

const numberRegex = /^\s*-?\d+(?:\.\d+)?\s*$/

export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !Number.isNaN(value)
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object'
}

export const isGreaterThan = (a: number, b: number) => a > b

export function addUnit(value?: string | number, defaultUnit = 'px') {
  if (!value && value !== 0)
    return ''
  if (isNumber(value))
    return `${value}${defaultUnit}`
  if (typeof value === 'string') {
    return numberRegex.test(value)
      ? `${value}${defaultUnit}`
      : value
  }
  debugWarn('single-scrollbar', 'binding value must be a string or number')
  return ''
}

export function throwError(scope: string, message: string): never {
  throw new Error(`[${scope}] ${message}`)
}

export function debugWarn(scope: string, message: string) {
  console.warn(new Error(`[${scope}] ${message}`))
}
