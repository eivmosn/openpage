import type { CompiledComponent, CompiledComponentModel, CompiledPage } from './compiled'

export type RuntimeComponentPatch = Partial<Omit<
  CompiledComponent,
  'children' | 'dynamic' | 'dynamicFieldKeys' | 'dynamicProps' | 'dynamicResolvers' | 'dynamicValues' | 'events' | 'id' | 'interactionClassName' | 'model' | 'props' | 'staticProps'
>> & {
  children?: string[]
  events?: Record<string, CompiledComponent['events'][string]>
  model?: CompiledComponentModel
  props?: Record<string, unknown>
}
export type ResolvedRuntimeComponentPatch = RuntimeComponentPatch & Pick<
  CompiledComponent,
  'dynamic' | 'dynamicFieldKeys' | 'dynamicProps' | 'dynamicResolvers' | 'dynamicValues' | 'staticProps'
> & {
  resolvedComponent: CompiledComponent
}

export interface RuntimeMessageService {
  success?: (content: string) => void
  error?: (content: string) => void
  warning?: (content: string) => void
  info?: (content: string) => void
}

export interface RuntimeFormService {
  reset: () => Promise<boolean> | boolean
  submit: () => Promise<boolean> | boolean
}

export interface RuntimeServices {
  form?: RuntimeFormService
  message?: RuntimeMessageService
  notifyStateChange: () => void
}

export interface RuntimeContext {
  compiled: CompiledPage
  state: Record<string, unknown>
  services: RuntimeServices
  componentPatches: Record<string, ResolvedRuntimeComponentPatch | undefined>
}
