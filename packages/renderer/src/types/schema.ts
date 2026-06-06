export interface PageSchema {
  id: string
  title?: string
  state?: Record<string, unknown>
  children: NodeSchema[]
}

export interface NodeSchema {
  id: string
  type: string
  name?: string
  label?: string
  visible?: unknown
  disabled?: unknown
  required?: unknown
  defaultValue?: unknown
  props?: Record<string, unknown>
  children?: NodeSchema[]
  events?: Record<string, EventSchema>
  model?: {
    path: string
  }
}

export type EventSchema = string
