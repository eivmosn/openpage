import type { EventSchema } from './schema'

export interface CompiledPage {
  id: string
  title?: string
  children: string[]
  components: Map<string, CompiledComponent>
  componentNames: Map<string, string>
}

export interface CompiledComponent {
  id: string
  type: string
  name?: string
  label?: string
  visible?: unknown
  disabled?: unknown
  required?: unknown
  defaultValue?: unknown
  computedValue?: unknown
  props: Record<string, unknown>
  children: string[]
  events: Record<string, EventSchema>
  model?: {
    path: string
  }
}
