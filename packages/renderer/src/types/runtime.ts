import type { UiAdapter } from '../adapters/types'
import type { CompiledNode, CompiledPage } from './compiled'

export type RuntimeNodePatch = Partial<Omit<CompiledNode, 'id'>>

export type RendererEventHandler = (payload?: unknown) => Promise<unknown> | unknown

export interface RendererPlatform {
  message?: {
    success?: (content: string) => void
    error?: (content: string) => void
    warning?: (content: string) => void
    info?: (content: string) => void
  }
}

export interface RendererContext {
  compiled: CompiledPage
  state: Record<string, unknown>
  adapter: UiAdapter
  platform: RendererPlatform
  notifyStateChange: () => void
  eventHandlers: Map<string, Map<string, RendererEventHandler>>
  nodePatches: Record<string, RuntimeNodePatch | undefined>
}
