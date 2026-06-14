import type { PageSchema } from '@openpage/core'

export const permissionPageSchema: PageSchema = {
  id: 'permission',
  title: '权限配置',
  initPage: `
    state.tenant = params.tenant || ''
    state.username = params.username || ''
    state.role = params.role || ''
    state.scope = 'team'
  `,
  children: [
    {
      id: 'permission-layout',
      type: 'div',
      props: {
        style: {
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          minHeight: 0,
        },
      },
      children: [
        {
          id: 'permission-body',
          type: 'div',
          props: {
            scrollbar: true,
            style: {
              flex: '1 1 auto',
              minHeight: 0,
              overflow: 'hidden',
            },
          },
          children: [
            {
              id: 'permission-body-inner',
              type: 'div',
              props: {
                style: {
                  padding: '18px 20px',
                },
              },
              children: [
                {
                  id: 'permission-grid',
                  type: 'div',
                  props: {
                    style: {
                      display: 'grid',
                      gap: '16px',
                      gridTemplateColumns: '1fr',
                    },
                  },
                  children: [
                    {
                      id: 'permission-username',
                      type: 'input',
                      name: 'username',
                      label: '用户',
                    },
                    {
                      id: 'permission-role',
                      type: 'input',
                      name: 'role',
                      label: '角色',
                    },
                    {
                      id: 'permission-scope',
                      type: 'select',
                      name: 'scope',
                      label: '权限范围',
                      required: true,
                      props: {
                        options: [
                          { label: '仅本人', value: 'self' },
                          { label: '当前团队', value: 'team' },
                          { label: '全部组织', value: 'all' },
                        ],
                        placeholder: '请选择权限范围',
                      },
                    },
                    {
                      id: 'permission-expire-at',
                      type: 'date',
                      name: 'expireAt',
                      label: '过期日期',
                      required: true,
                      props: {
                        placeholder: '请选择权限过期日期',
                        valueFormat: 'yyyy-MM-dd',
                      },
                    },
                    {
                      id: 'permission-admin',
                      type: 'switch',
                      name: 'admin',
                      label: '管理员',
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          id: 'permission-footer',
          type: 'div',
          props: {
            style: {
              alignItems: 'center',
              borderTop: '1px solid #e5e7eb',
              display: 'flex',
              flex: '0 0 auto',
              gap: '10px',
              justifyContent: 'flex-end',
              padding: '12px 20px',
            },
          },
          children: [
            {
              id: 'permission-cancel',
              type: 'button',
              label: '取消',
              events: {
                onclick: `
                  ctx.closePage({
                    action: 'cancel',
                  })
                `,
              },
            },
            {
              id: 'permission-confirm',
              type: 'button',
              label: '确认权限',
              props: {
                type: 'primary',
              },
              events: {
                onclick: `
                  const valid = await ctx.validate()
                  if (!valid) return

                  ctx.setParentState('permissionDraft', {
                    scope: state.scope,
                    expireAt: state.expireAt,
                    admin: state.admin,
                  })
                  ctx.closePage({
                    action: 'confirm',
                    value: {
                      scope: state.scope,
                      expireAt: state.expireAt,
                      admin: state.admin,
                    },
                  })
                `,
              },
            },
          ],
        },
      ],
    },
  ],
}
