import type { PageSchema } from '@openpage/core'

export const loginPageSchema: PageSchema = {
  id: 'login',
  title: '登录表单',
  initPage: `
    state.tenant = params.tenant || ''
    state.username = params.defaultUsername || ''
  `,
  children: [
    {
      id: 'login-layout',
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
          id: 'login-body',
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
              id: 'login-body-inner',
              type: 'div',
              props: {
                style: {
                  padding: '18px 20px',
                },
              },
              children: [
                {
                  id: 'login-form-grid',
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
                      id: 'login-tenant',
                      type: 'input',
                      name: 'tenant',
                      label: '租户',
                      required: true,
                      props: {
                        placeholder: '从父页面 params 带入',
                      },
                    },
                    {
                      id: 'login-username',
                      type: 'input',
                      name: 'username',
                      label: '用户名',
                      required: true,
                      props: {
                        placeholder: '请输入用户名',
                      },
                    },
                    {
                      id: 'login-password',
                      type: 'password',
                      name: 'password',
                      label: '密码',
                      required: true,
                      props: {
                        placeholder: '请输入密码',
                      },
                    },
                    {
                      id: 'open-user-profile-drawer',
                      type: 'button',
                      label: '打开资料 Drawer',
                      props: {
                        type: 'default',
                        tooltip: {
                          text: 'modal 内继续打开 drawer，测试第二层页面',
                        },
                      },
                      events: {
                        onclick: `
                          const result = await ctx.openPage({
                            page: 'user-profile',
                            mode: 'drawer',
                            params: {
                              tenant: state.tenant,
                              username: state.username,
                            },
                            overlay: {
                              title: '用户资料',
                              width: 720,
                              position: 'right',
                            },
                          })

                          if (result.action === 'confirm') {
                            ctx.message.success('资料页面已确认')
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
          id: 'login-footer',
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
              id: 'login-cancel',
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
              id: 'login-confirm',
              type: 'button',
              label: '确认登录',
              props: {
                type: 'primary',
              },
              events: {
                onclick: `
                  const valid = await ctx.validate()
                  if (!valid) return

                  ctx.setParentState('loginUser', {
                    tenant: state.tenant,
                    username: state.username,
                  })
                  ctx.closePage({
                    action: 'confirm',
                    value: {
                      tenant: state.tenant,
                      username: state.username,
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
