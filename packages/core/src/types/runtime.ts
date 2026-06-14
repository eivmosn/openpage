import type { CompiledComponent, CompiledComponentModel, CompiledPage } from './compiled'
import type { PageSchema } from './schema'

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

export type RuntimeValidateTarget = string | string[]

export interface RuntimeFormService {
  reset: () => Promise<boolean> | boolean
  validate: (target?: RuntimeValidateTarget) => Promise<boolean> | boolean
}

export type RuntimeOpenPageMode = 'modal' | 'drawer'

export interface RuntimeOpenPageOverlayOptions {
  bodyPadding?: boolean
  bodyFullHeight?: boolean
  bodyScrollable?: boolean
  closable?: boolean
  closeOnEsc?: boolean
  fullscreen?: boolean
  height?: number | string
  maskClosable?: boolean
  minHeight?: number
  minWidth?: number
  offset?: readonly [top?: number | null, right?: number | null, bottom?: number | null, left?: number | null]
  position?: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'left' | 'right' | 'bottom' | 'top'
  radius?: number | string
  resizable?: boolean
  showFooter?: boolean
  title?: string
  width?: number | string
}

export interface RuntimeOpenPageOptions {
  mode?: RuntimeOpenPageMode
  overlay?: RuntimeOpenPageOverlayOptions
  page: PageSchema | string
  params?: Record<string, unknown>
  state?: Record<string, unknown>
}

export interface RuntimeOpenPageResult<T = unknown> {
  action: 'confirm' | 'cancel' | 'close'
  value?: T
}

export type RuntimeSetStateService = (pathOrPatch: string | Record<string, unknown>, value?: unknown) => void

export interface RuntimeParentPageContext {
  emit: (eventName: string, payload?: unknown) => Promise<void>
  pageId: string
  setState: RuntimeSetStateService
  state: Record<string, unknown>
}

export interface RuntimeContextValue extends Record<string, unknown> {
  closePage?: RuntimeClosePageService
  getComponentById?: (id: string) => CompiledComponent | undefined
  getComponentByName?: (name: string) => CompiledComponent | undefined
  getState?: (path: string) => unknown
  message?: RuntimeMessageService
  openPage?: (options: RuntimeOpenPageOptions) => Promise<RuntimeOpenPageResult>
  parentParams?: Readonly<Record<string, unknown>>
  resolvePage?: RuntimePageResolver
  reset?: () => Promise<boolean>
  setParentState?: RuntimeSetStateService
  updateComponentById?: (id: string, patch: RuntimeComponentPatch) => boolean
  updateComponentByName?: (name: string, patch: RuntimeComponentPatch) => boolean
  validate?: (target?: RuntimeValidateTarget) => Promise<boolean>
}

export interface RuntimeResolvedPage {
  schema: PageSchema
  state?: Record<string, unknown>
}

export type RuntimePageResolver = (
  page: PageSchema | string,
  options: RuntimeOpenPageOptions,
  context: RuntimeContext,
) => Promise<PageSchema | RuntimeResolvedPage | undefined> | PageSchema | RuntimeResolvedPage | undefined

export type RuntimeOpenPageService = (
  options: RuntimeOpenPageOptions,
  context: RuntimeContext,
) => Promise<RuntimeOpenPageResult>

export type RuntimeClosePageService = (result?: unknown) => void

export interface RuntimeServices {
  closePage?: RuntimeClosePageService
  form?: RuntimeFormService
  message?: RuntimeMessageService
  notifyStateChange: () => void
  openPage?: RuntimeOpenPageService
  parent?: RuntimeParentPageContext
}

export interface RuntimeContext {
  compiled: CompiledPage
  ctx: RuntimeContextValue
  params: Record<string, unknown>
  state: Record<string, unknown>
  services: RuntimeServices
  componentPatches: Record<string, ResolvedRuntimeComponentPatch | undefined>
}
