import type { PageSchema, RuntimePageResolver } from '@openpage/core'
import { loginPageSchema } from './login'
import { permissionPageSchema } from './permission'
import { userProfilePageSchema } from './userProfile'

const playgroundPages: Record<string, PageSchema> = {
  'login': loginPageSchema,
  'permission': permissionPageSchema,
  'user-profile': userProfilePageSchema,
}

/**
 * 解析 playground 中可被 openPage 打开的页面。
 *
 * @param page 页面 id 或直接传入的页面 schema。
 * @returns 返回匹配到的页面 schema。
 */
export const resolvePlaygroundPage: RuntimePageResolver = (page) => {
  if (typeof page !== 'string') {
    return page
  }

  return playgroundPages[page]
}
