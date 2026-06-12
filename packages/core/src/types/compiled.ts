import type { ExpressionValueResolver } from '../runtime/expression'
import type { EventSchema } from './schema'

export interface CompiledPage {
  id: string
  title?: string
  children: string[]
  components: Map<string, CompiledComponent>
  componentNames: Map<string, string>
  interactionCss: string
}

export interface CompiledComponent {
  [key: string]: unknown
  id: string
  type: string
  name?: string
  label?: string
  dynamicValues: Record<string, unknown>
  dynamicFieldKeys: readonly string[]
  visible?: unknown
  disabled?: unknown
  defaultValue?: unknown
  computedValue?: unknown
  required?: unknown
  labelWidth?: string | number | undefined
  props: Record<string, unknown>
  staticProps: Record<string, unknown>
  dynamicProps: readonly CompiledDynamicProp[]
  children: string[]
  events: Record<string, EventSchema>
  model?: CompiledComponentModel
  dynamic: CompiledComponentDynamicFields
  dynamicResolvers: CompiledComponentDynamicResolvers
  interactionClassName?: string
}

export interface CompiledComponentDynamicFields {
  fields: readonly string[]
  props: readonly string[]
}

export type CompiledDynamicProp = readonly [key: string, resolveValue: ExpressionValueResolver]

export type CompiledComponentDynamicResolvers = Record<string, ExpressionValueResolver>

export type CompiledComponentModel
  = | { path: string }
    | { paths: readonly string[] }
