<script setup lang="ts">
import type { UiComponentProps } from '../../types'
import { NCarousel } from 'naive-ui'
import { computed } from 'vue'

defineOptions({
  name: 'OpenPageNaiveCarousel',
  inheritAttrs: false,
})

const props = defineProps<UiComponentProps>()

interface CarouselOption {
  label?: unknown
  value?: unknown
  src?: unknown
  url?: unknown
  alt?: unknown
  type?: unknown
}

interface NormalizedCarouselItem {
  key: string
  label?: string
  src: string
  alt: string
}

const items = computed(resolveItems)
const height = computed(() => resolveCssSize(props.component.props.height, 180))
const objectFit = computed(resolveObjectFit)
const loop = computed(() => props.component.props.loop !== false)
const interval = computed(resolveInterval)
const showArrow = computed(() => props.component.props.showArrow === true)
const direction = computed(resolveDirection)
const dotPlacement = computed(resolveDotPlacement)
const emptyText = computed(() => String(props.component.props.emptyText || '暂无轮播图'))

/**
 * 解析轮播数据。
 *
 * @returns 返回已过滤和标准化后的轮播项。
 */
function resolveItems(): NormalizedCarouselItem[] {
  if (!Array.isArray(props.value)) {
    return []
  }

  return props.value
    .map(normalizeCarouselOption)
    .filter((item): item is NormalizedCarouselItem => item !== undefined)
}

/**
 * 标准化单个轮播项。
 *
 * @param option 原始轮播项配置。
 * @param index 当前轮播项索引。
 * @returns 返回标准轮播项，无有效地址时返回空值。
 */
function normalizeCarouselOption(option: unknown, index: number): NormalizedCarouselItem | undefined {
  const item = normalizeCarouselObject(option)
  const rawSrc = item.value ?? item.src ?? item.url
  const src = resolveImageSource(rawSrc, item.type)

  if (!src) {
    return undefined
  }

  const label = typeof item.label === 'string' && item.label.length > 0
    ? item.label
    : undefined

  return {
    key: `${index}-${src}`,
    label,
    src,
    alt: String(item.alt || label || `轮播图 ${index + 1}`),
  }
}

/**
 * 标准化轮播项对象。
 *
 * @param option 原始轮播项配置。
 * @returns 返回统一的轮播项对象结构。
 */
function normalizeCarouselObject(option: unknown): CarouselOption {
  if (typeof option === 'string') {
    return { value: option, type: 'url' }
  }

  if (option && typeof option === 'object') {
    return option as CarouselOption
  }

  return {}
}

/**
 * 解析图片地址。
 *
 * @param value 图片地址或 base64 内容。
 * @param type 图片类型。
 * @returns 返回可直接用于 img 的地址。
 */
function resolveImageSource(value: unknown, type: unknown): string | undefined {
  if (typeof value !== 'string' || value.length === 0) {
    return undefined
  }

  if (type === 'base64' && !value.startsWith('data:')) {
    return `data:${resolveBase64MimeType()};base64,${value}`
  }

  return value
}

/**
 * 解析 base64 图片默认 MIME 类型。
 *
 * @returns 返回 MIME 类型。
 */
function resolveBase64MimeType(): string {
  return String(props.component.props.base64MimeType || 'image/png')
}

/**
 * 解析 CSS 尺寸配置。
 *
 * @param value Schema 中传入的尺寸。
 * @param fallback 默认尺寸。
 * @returns 返回 CSS 尺寸字符串。
 */
function resolveCssSize(value: unknown, fallback: number): string {
  if (typeof value === 'number') {
    return `${value}px`
  }

  if (typeof value === 'string' && value.length > 0) {
    return value
  }

  return `${fallback}px`
}

/**
 * 解析轮播间隔。
 *
 * @returns 返回毫秒级轮播间隔。
 */
function resolveInterval(): number {
  return typeof props.component.props.interval === 'number'
    ? props.component.props.interval
    : 5000
}

/**
 * 解析轮播方向。
 *
 * @returns 返回 Naive UI 支持的轮播方向。
 */
function resolveDirection(): 'horizontal' | 'vertical' {
  return props.component.props.direction === 'vertical' ? 'vertical' : 'horizontal'
}

/**
 * 解析指示点位置。
 *
 * @returns 返回 Naive UI 支持的指示点位置。
 */
function resolveDotPlacement(): 'top' | 'bottom' | 'left' | 'right' {
  const { dotPlacement } = props.component.props

  if (dotPlacement === 'top' || dotPlacement === 'left' || dotPlacement === 'right') {
    return dotPlacement
  }

  return 'bottom'
}

/**
 * 解析图片填充方式。
 *
 * @returns 返回 CSS object-fit。
 */
function resolveObjectFit(): 'cover' | 'contain' | 'fill' | 'none' | 'scale-down' {
  const { objectFit } = props.component.props

  if (
    objectFit === 'contain'
    || objectFit === 'fill'
    || objectFit === 'none'
    || objectFit === 'scale-down'
  ) {
    return objectFit
  }

  return 'cover'
}
</script>

<template>
  <div class="openpage-carousel">
    <NCarousel
      v-if="items.length > 0"
      :direction="direction"
      :dot-placement="dotPlacement"
      :interval="interval"
      :loop="loop"
      :show-arrow="showArrow"
      class="openpage-carousel__body"
    >
      <div
        v-for="item in items"
        :key="item.key"
        class="openpage-carousel__slide"
      >
        <img
          class="openpage-carousel__image"
          :alt="item.alt"
          :src="item.src"
        >
      </div>
    </NCarousel>

    <div
      v-else
      class="openpage-carousel__empty"
    >
      {{ emptyText }}
    </div>
  </div>
</template>

<style scoped>
.openpage-carousel {
  width: 100%;
}

.openpage-carousel__body {
  height: v-bind(height);
  overflow: hidden;
  border-radius: 6px;
}

.openpage-carousel__slide {
  position: relative;
  width: 100%;
  height: v-bind(height);
  overflow: hidden;
  background: rgb(250 250 252);
}

.openpage-carousel__image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: v-bind(objectFit);
}

.openpage-carousel__empty {
  box-sizing: border-box;
  min-height: v-bind(height);
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgb(144 147 153);
  font-size: 13px;
  border: 1px dashed rgb(224 224 230);
  border-radius: 6px;
  background: rgb(250 250 252);
}
</style>
