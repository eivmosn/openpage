import type { EventSchema } from './schema'

export interface CompiledPage {
  id: string
  title?: string
  children: string[]
  state: Record<string, unknown>
  nodes: Map<string, CompiledNode>
  nodeNames: Map<string, string>
}

export interface CompiledNode {
  id: string
  type: string
  name?: string
  label?: string
  visible?: unknown
  disabled?: unknown
  required?: unknown
  defaultValue?: unknown
  props: Record<string, unknown>
  children: string[]
  events: Record<string, EventSchema>
  formField: boolean
  model?: {
    path: string
  }
}
