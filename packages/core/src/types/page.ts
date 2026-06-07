import type { Page } from '../renderer/Page'
import type { UiAdapter } from './adapter'
import type { RuntimeContext, RuntimeMessageService } from './runtime'

export type PageInstance = InstanceType<typeof Page>

export interface PageContext extends RuntimeContext {
  adapter: UiAdapter
}

export interface PagePlatform {
  message?: RuntimeMessageService
}
