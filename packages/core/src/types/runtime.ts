import type { CompiledComponent, CompiledPage } from './compiled'

export type RuntimeComponentPatch = Partial<Omit<CompiledComponent, 'id'>>

export type RuntimeEventHandler = (payload?: unknown) => Promise<unknown> | unknown

export interface RuntimeEventResult {
  handled: boolean
  value?: unknown
}

export interface RuntimeMessageService {
  success?: (content: string) => void
  error?: (content: string) => void
  warning?: (content: string) => void
  info?: (content: string) => void
}

export interface RuntimeServices {
  emitNamedEvent?: (componentName: string, eventName: string, payload?: unknown) => Promise<RuntimeEventResult> | RuntimeEventResult
  message?: RuntimeMessageService
  notifyStateChange: () => void
  registerEventHandler?: (componentName: string, eventName: string, handler: RuntimeEventHandler) => () => void
  submitForm?: (name: string) => Promise<unknown>
}

export interface RuntimeContext {
  compiled: CompiledPage
  state: Record<string, unknown>
  services: RuntimeServices
  componentPatches: Record<string, RuntimeComponentPatch | undefined>
}
