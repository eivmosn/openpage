import type { FormItemInst } from 'naive-ui'
import type { InjectionKey } from 'vue'

export interface NaiveFormItemRegistry {
  register: (path: string, item: FormItemInst) => () => void
}

export const naiveFormItemRegistryKey: InjectionKey<NaiveFormItemRegistry> = Symbol('naiveFormItemRegistry')
