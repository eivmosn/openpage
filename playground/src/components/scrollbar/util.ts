export const GAP = 4
export const DEFAULT_NAMESPACE = 'el'
export const SCROLLBAR_BLOCK = 'scrollbar'

function bem(block: string, blockSuffix = '', element = '', modifier = '') {
  let cls = `${DEFAULT_NAMESPACE}-${block}`
  if (blockSuffix)
    cls += `-${blockSuffix}`
  if (element)
    cls += `__${element}`
  if (modifier)
    cls += `--${modifier}`
  return cls
}

export const scrollbarCls = {
  block: (blockSuffix = '') => bem(SCROLLBAR_BLOCK, blockSuffix),
  element: (element: string) => bem(SCROLLBAR_BLOCK, '', element),
  elementModifier: (element: string, modifier: string) =>
    bem(SCROLLBAR_BLOCK, '', element, modifier),
  state: (name: string) => `is-${name}`,
}

export const BAR_MAP = {
  vertical: {
    offset: 'offsetHeight',
    scroll: 'scrollTop',
    scrollSize: 'scrollHeight',
    size: 'height',
    key: 'vertical',
    axis: 'Y',
    client: 'clientY',
    direction: 'top',
  },
  horizontal: {
    offset: 'offsetWidth',
    scroll: 'scrollLeft',
    scrollSize: 'scrollWidth',
    size: 'width',
    key: 'horizontal',
    axis: 'X',
    client: 'clientX',
    direction: 'left',
  },
} as const
