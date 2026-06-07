export interface PageSchema {
  id: string
  title?: string
  children: ComponentSchema[]
}

export interface ComponentSchema {
  id: string
  type: string
  name?: string
  label?: string
  visible?: unknown
  disabled?: unknown
  required?: unknown
  defaultValue?: unknown
  computedValue?: unknown
  props?: Record<string, unknown>
  children?: ComponentSchema[]
  events?: Record<string, EventSchema>
}

export interface StaticEventActionSchema {
  type: 'static'
  dependency: Record<string, unknown>
}

export type EventActionSchema = StaticEventActionSchema

export type EventSchema = string | EventActionSchema | EventSchema[]
