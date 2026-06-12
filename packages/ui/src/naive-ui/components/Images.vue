<script setup lang="ts">
import type { VNode, VNodeChild } from 'vue'
import type { UiComponentProps } from '../../types'
import { NImage, NImageGroup } from 'naive-ui'
import { computed } from 'vue'

defineOptions({
  name: 'OpenPageNaiveImages',
  inheritAttrs: false,
})

const props = defineProps<UiComponentProps>()

interface ImageOption {
  label?: unknown
  value?: unknown
  src?: unknown
  url?: unknown
  previewValue?: unknown
  previewSrc?: unknown
  alt?: unknown
  type?: unknown
}

interface NormalizedImage {
  key: string
  label: string
  src: string
  previewSrc?: string
  alt: string
}

interface ImageRenderToolbarProps {
  nodes: {
    prev: VNode
    next: VNode
    rotateCounterclockwise: VNode
    rotateClockwise: VNode
    resizeToOriginalSize: VNode
    zoomOut: VNode
    zoomIn: VNode
    download: VNode
    close: VNode
  }
}

const images = computed(resolveImages)
const imageWidth = computed(() => resolveCssSize(props.component.props.imageWidth, 96))
const imageHeight = computed(() => resolveCssSize(props.component.props.imageHeight, 96))
const objectFit = computed(resolveObjectFit)
const showToolbar = computed(() => props.component.props.showToolbar !== false)
const showToolbarTooltip = computed(() => props.component.props.showToolbarTooltip === true)
const emptyText = computed(() => String(props.component.props.emptyText || '暂无图片'))

/**
 * 解析图片配置列表。
 *
 * @returns 返回已过滤和标准化后的图片列表。
 */
function resolveImages(): NormalizedImage[] {
  return resolveRawOptions()
    .map(normalizeImageOption)
    .filter((image): image is NormalizedImage => image !== undefined)
}

/**
 * 解析原始图片配置。
 *
 * @returns 返回原始图片配置数组。
 */
function resolveRawOptions(): unknown[] {
  if (Array.isArray(props.value)) {
    return props.value
  }

  return []
}

/**
 * 标准化单个图片配置。
 *
 * @param option 原始图片配置。
 * @param index 当前图片索引。
 * @returns 返回标准图片配置，无有效地址时返回空值。
 */
function normalizeImageOption(option: unknown, index: number): NormalizedImage | undefined {
  const image = normalizeImageObject(option)
  const rawSrc = image.value ?? image.src ?? image.url
  const src = resolveImageSource(rawSrc, image.type)

  if (!src) {
    return undefined
  }

  const previewSrc = resolveImageSource(image.previewValue ?? image.previewSrc, image.type)
  const label = String(image.label || '')

  return {
    key: `${index}-${src}`,
    label,
    src,
    previewSrc,
    alt: String(image.alt || label),
  }
}

/**
 * 标准化图片配置对象。
 *
 * @param option 原始图片配置。
 * @returns 返回统一的图片对象结构。
 */
function normalizeImageObject(option: unknown): ImageOption {
  if (typeof option === 'string') {
    return { value: option, type: 'url' }
  }

  if (option && typeof option === 'object') {
    return option as ImageOption
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
 * 解析图片填充方式。
 *
 * @returns 返回 Naive UI 支持的 object-fit。
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

/**
 * 渲染图片预览工具栏，移除下载按钮。
 *
 * @param toolbarProps Naive UI 图片预览工具栏节点。
 * @returns 返回不包含下载按钮的工具栏内容。
 */
function renderToolbar(toolbarProps: ImageRenderToolbarProps): VNodeChild {
  const { nodes } = toolbarProps

  return [
    nodes.prev,
    nodes.next,
    nodes.rotateCounterclockwise,
    nodes.rotateClockwise,
    nodes.zoomOut,
    nodes.zoomIn,
    nodes.close,
  ]
}
</script>

<template>
  <div class="openpage-images">
    <NImageGroup
      v-if="images.length > 0"
      :render-toolbar="renderToolbar"
      :show-toolbar="showToolbar"
      :show-toolbar-tooltip="showToolbarTooltip"
    >
      <div class="openpage-images__list">
        <figure
          v-for="image in images"
          :key="image.key"
          class="openpage-images__item"
        >
          <NImage
            class="openpage-images__image"
            :alt="image.alt"
            :height="imageHeight"
            :object-fit="objectFit"
            :preview-src="image.previewSrc"
            :src="image.src"
            :width="imageWidth"
          />
          <figcaption v-if="image.label" class="openpage-images__label">
            {{ image.label }}
          </figcaption>
        </figure>
      </div>
    </NImageGroup>

    <div
      v-else
      class="openpage-images__empty"
    >
      {{ emptyText }}
    </div>
  </div>
</template>

<style scoped>
.openpage-images {
  width: 100%;
}

.openpage-images__list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.openpage-images__item {
  box-sizing: border-box;
  max-width: v-bind(imageWidth);
  margin: 0;
}

.openpage-images__image {
  overflow: hidden;
  border: 1px solid rgb(224 224 230);
  border-radius: 6px;
}

.openpage-images__label {
  max-width: v-bind(imageWidth);
  margin-top: 6px;
  overflow: hidden;
  color: rgb(96 98 102);
  font-size: 12px;
  line-height: 1.4;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.openpage-images__empty {
  box-sizing: border-box;
  min-height: 80px;
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
