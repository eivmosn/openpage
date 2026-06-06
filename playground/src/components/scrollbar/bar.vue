<script lang="ts" setup>
import type { BarProps } from './types'
import { inject, ref } from 'vue'
import { scrollbarContextKey } from './constants'
import Thumb from './thumb.vue'

import { GAP } from './util'

const props = withDefaults(defineProps<BarProps>(), {
  always: true,
})

const scrollbar = inject(scrollbarContextKey)
const horizontalThumb = ref<InstanceType<typeof Thumb>>()
const verticalThumb = ref<InstanceType<typeof Thumb>>()

let sizeWidth = ''
let sizeHeight = ''
let ratioY = 1
let ratioX = 1

function handleScroll(wrap: HTMLDivElement) {
  const offsetHeight = wrap.offsetHeight - GAP
  const offsetWidth = wrap.offsetWidth - GAP

  verticalThumb.value?.setMove(((wrap.scrollTop * 100) / offsetHeight) * ratioY)
  horizontalThumb.value?.setMove(((wrap.scrollLeft * 100) / offsetWidth) * ratioX)
}

function update() {
  const wrap = scrollbar?.wrapElement
  if (!wrap)
    return

  const offsetHeight = wrap.offsetHeight - GAP
  const offsetWidth = wrap.offsetWidth - GAP

  const originalHeight = offsetHeight ** 2 / wrap.scrollHeight
  const originalWidth = offsetWidth ** 2 / wrap.scrollWidth
  const height = Math.max(originalHeight, props.minSize)
  const width = Math.max(originalWidth, props.minSize)

  ratioY
    = originalHeight
      / (offsetHeight - originalHeight)
      / (height / (offsetHeight - height))
  ratioX
    = originalWidth
      / (offsetWidth - originalWidth)
      / (width / (offsetWidth - width))

  sizeHeight = height + GAP < offsetHeight ? `${height}px` : ''
  sizeWidth = width + GAP < offsetWidth ? `${width}px` : ''

  verticalThumb.value?.sync(sizeHeight, ratioY)
  horizontalThumb.value?.sync(sizeWidth, ratioX)
}

defineExpose({
  handleScroll,
  update,
})
</script>

<template>
  <Thumb ref="horizontalThumb" :always="always" />
  <Thumb
    ref="verticalThumb"
    vertical
    :always="always"
  />
</template>
