import type { PageSchema } from '@openpage/core'

export const userProfilePageSchema: PageSchema = {
  id: 'user-profile',
  title: '用户资料',
  initPage: `
    state.tenant = params.tenant || ''
    state.username = params.username || ''
    state.role = 'operator'
  `,
  children: [
    {
      id: 'profile-layout',
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
          id: 'profile-body',
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
              id: 'profile-body-inner',
              type: 'div',
              props: {
                style: {
                  padding: '18px 20px',
                },
              },
              children: [
                {
                  id: 'profile-form-grid',
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
                      id: 'profile-tenant',
                      type: 'input',
                      name: 'tenant',
                      label: '租户',
                      props: {
                        placeholder: '来自登录页 params',
                      },
                    },
                    {
                      id: 'profile-username',
                      type: 'input',
                      name: 'username',
                      label: '用户名',
                      required: true,
                    },
                    {
                      id: 'profile-role',
                      type: 'select',
                      name: 'role',
                      label: '角色',
                      required: true,
                      props: {
                        options: [
                          { label: '操作员', value: 'operator' },
                          { label: '管理员', value: 'admin' },
                          { label: '审计员', value: 'auditor' },
                        ],
                        placeholder: '请选择角色',
                      },
                    },
                    {
                      id: 'profile-note',
                      type: 'textarea',
                      name: 'note',
                      label: '备注',
                      props: {
                        placeholder: '这里测试 drawer 内容滚动和表单',
                      },
                    },
                    {
                      id: 'open-permission-modal',
                      type: 'button',
                      label: '打开权限 Modal',
                      props: {
                        type: 'default',
                        tooltip: {
                          text: 'drawer 内继续打开 modal，测试第三层页面',
                        },
                      },
                      events: {
                        onclick: `
                          const result = await ctx.openPage({
                            page: 'permission',
                            mode: 'modal',
                            params: {
                              tenant: state.tenant,
                              username: state.username,
                              role: state.role,
                            },
                            overlay: {
                              title: '权限配置',
                              width: 680,
                              height: 560,
                            },
                          })

                          if (result.action === 'confirm') {
                            state.permissionResult = result.value
                            ctx.message.success('权限配置已返回')
                          }
                        `,
                      },
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          id: 'profile-footer',
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
              id: 'profile-close',
              type: 'button',
              label: '关闭',
              events: {
                onclick: `
                  ctx.closePage({
                    action: 'close',
                  })
                `,
              },
            },
            {
              id: 'profile-confirm',
              type: 'button',
              label: '确认资料',
              props: {
                type: 'primary',
              },
              events: {
                onclick: `
                  const valid = await ctx.validate()
                  if (!valid) return

                  ctx.setParentState('profileUser', {
                    username: state.username,
                    role: state.role,
                  })
                  ctx.closePage({
                    action: 'confirm',
                    value: {
                      username: state.username,
                      role: state.role,
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
