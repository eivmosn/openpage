import type { Component } from 'vue'
import type { CompiledComponent } from './compiled'
import type { RuntimeContext } from './runtime'

export const formWrapperKey = 'formWrapper'

export type OpenPageComponents = Record<string, Component>

export interface UiComponentProps {
  component: CompiledComponent
  context: RuntimeContext
  value?: unknown
  children?: () => unknown
  emitComponentEvent: (eventName: string, payload?: unknown) => Promise<void>
  updateModelValue: (value: unknown) => void
}

export interface UiFormWrapperProps {
  context: RuntimeContext
}
