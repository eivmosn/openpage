import type { CompiledComponent, CompiledPage } from './compiled'

export type RuntimeComponentPatch = Partial<Omit<
  CompiledComponent,
  'dynamic' | 'dynamicFieldKeys' | 'dynamicProps' | 'dynamicResolvers' | 'dynamicValues' | 'id' | 'interactionClassName' | 'staticProps'
>>
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

export interface RuntimeServices {
  message?: RuntimeMessageService
  notifyStateChange: () => void
}

export interface RuntimeContext {
  compiled: CompiledPage
  state: Record<string, unknown>
  services: RuntimeServices
  componentPatches: Record<string, ResolvedRuntimeComponentPatch | undefined>
}
