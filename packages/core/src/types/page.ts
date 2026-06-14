import type { Page } from '../renderer/Page'
import type { RuntimeContext } from './runtime'
import type { OpenPageComponents } from './ui'

export type PageInstance = InstanceType<typeof Page>

export interface PageContext extends RuntimeContext {
  components: OpenPageComponents
}
