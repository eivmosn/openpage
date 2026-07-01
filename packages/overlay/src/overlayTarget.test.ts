import type { OverlayItem } from './types'
import { describe, expect, it } from 'vitest'
import { isStaticPosition, isViewportOverlayTarget, resolveOverlayTarget } from './overlayTarget'

/**
 * 创建只包含目标解析所需字段的弹层实例。
 *
 * @param type 弹层类型。
 * @param to 单次弹层挂载目标。
 * @returns 返回可用于目标解析测试的弹层实例。
 */
function createOverlayItem(type: OverlayItem['options']['type'], to?: OverlayItem['options']['to']): OverlayItem {
  return {
    id: type,
    show: true,
    settled: false,
    confirmLoading: false,
    component: {},
    props: {},
    options: {
      type,
      to,
    } as OverlayItem['options'],
    zIndex: 1,
    panelZIndex: 2,
    resolve: () => {},
  }
}

describe('resolveOverlayTarget', () => {
  it('uses body as the default mount target', () => {
    expect(resolveOverlayTarget(createOverlayItem('modal'), {})).toBe('body')
    expect(resolveOverlayTarget(createOverlayItem('drawer'), {})).toBe('body')
  })

  it('uses separate provider targets for modal and drawer', () => {
    expect(resolveOverlayTarget(createOverlayItem('modal'), {
      modal: { to: '#modal-root' },
      drawer: { to: '#drawer-root' },
    })).toBe('#modal-root')

    expect(resolveOverlayTarget(createOverlayItem('drawer'), {
      modal: { to: '#modal-root' },
      drawer: { to: '#drawer-root' },
    })).toBe('#drawer-root')
  })

  it('uses component or single-open target before provider target', () => {
    expect(resolveOverlayTarget(createOverlayItem('modal', '#local-modal'), {
      modal: { to: '#provider-modal' },
    })).toBe('#local-modal')

    expect(resolveOverlayTarget(createOverlayItem('drawer', '#local-drawer'), {
      drawer: { to: '#provider-drawer' },
    })).toBe('#local-drawer')
  })

  it('distinguishes body target from local mount targets', () => {
    expect(isViewportOverlayTarget('body')).toBe(true)
    expect(isViewportOverlayTarget('#page-content')).toBe(false)
  })

  it('requires a positioning context only for static targets', () => {
    expect(isStaticPosition('static')).toBe(true)
    expect(isStaticPosition('relative')).toBe(false)
    expect(isStaticPosition('absolute')).toBe(false)
    expect(isStaticPosition('fixed')).toBe(false)
    expect(isStaticPosition('sticky')).toBe(false)
  })
})
