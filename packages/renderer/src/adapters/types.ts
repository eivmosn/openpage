import type { Component } from 'vue'
import type { CompiledNode } from '../types/compiled'
import type { RendererContext } from '../types/runtime'

export interface UiNodeProps {
  node: CompiledNode
  context: RendererContext
  value?: unknown
  children?: () => unknown
  emitNodeEvent: (eventName: string, payload?: unknown) => Promise<void>
  emitNamedNodeEvent: (nodeName: string, eventName: string, payload?: unknown) => Promise<unknown>
  updateModelValue: (value: unknown) => void
}

export interface UiAdapter {
  name: string
  components: Record<string, Component>
  formItem?: Component
}
