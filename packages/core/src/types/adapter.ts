import type { Component } from 'vue'
import type { CompiledComponent } from './compiled'
import type { RuntimeContext } from './runtime'

export interface UiComponentProps {
  component: CompiledComponent
  context: RuntimeContext
  value?: unknown
  children?: () => unknown
  emitComponentEvent: (eventName: string, payload?: unknown) => Promise<void>
  updateModelValue: (value: unknown) => void
}

export interface UiAdapter {
  name: string
  components: Record<string, Component>
  formItem?: Component
}
