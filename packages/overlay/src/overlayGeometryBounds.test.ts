import { describe, expect, it } from 'vitest'
import { clampPanelRectToBounds, toBoundsRect } from './composables/useOverlayGeometry'

describe('overlay geometry bounds', () => {
  it('uses viewport bounds without an offset for body mounted overlays', () => {
    expect(toBoundsRect(undefined, 1024, 768)).toEqual({
      height: 768,
      left: 0,
      top: 0,
      width: 1024,
    })
  })

  it('uses local target rect as drag and fullscreen bounds', () => {
    expect(toBoundsRect({
      height: 400,
      left: 120,
      top: 80,
      width: 640,
    }, 1024, 768)).toEqual({
      height: 400,
      left: 120,
      top: 80,
      width: 640,
    })
  })

  it('clamps dragged panel inside local target bounds', () => {
    const rect = clampPanelRectToBounds({
      height: 120,
      left: 720,
      top: 450,
      width: 240,
    }, {
      height: 400,
      left: 120,
      top: 80,
      width: 640,
    })

    expect(rect).toEqual({
      height: 120,
      left: 520,
      top: 360,
      width: 240,
    })
  })
})
