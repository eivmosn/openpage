import type { PageSchema } from '@openpage/core'
import { advancedSection } from './sections/advanced'
import { basicSection } from './sections/basic'
import { preferenceSection } from './sections/preference'

export const testSchema: PageSchema = {
  id: 'component-test-page',
  title: '复杂表单组件测试',
  children: [
    {
      id: 'page-layout',
      type: 'div',
      children: [
        {
          id: 'form-shell',
          type: 'div',
          props: {
            style: {
              margin: '0 auto',
              maxWidth: '1180px',
            },
          },
          children: [
            {
              id: 'form',
              type: 'form',
              name: 'form',
              children: [
                basicSection,
                preferenceSection,
                advancedSection,
                {
                  id: 'form-actions',
                  type: 'div',
                  props: {
                    style: {
                      alignItems: 'center',
                      display: 'flex',
                      gap: '14px',
                      justifyContent: 'center',
                      padding: '28px 0 8px',
                    },
                  },
                  children: [
                    {
                      id: 'save-draft',
                      type: 'button',
                      label: '暂存',
                      props: {
                        type: 'default',
                      },
                      events: {
                        onclick: `
                          console.log('暂存表单：', form)
                          message.info('已暂存当前填写内容')
                        `,
                      },
                    },
                    {
                      id: 'reset-form',
                      type: 'button',
                      label: '重置',
                      props: {
                        type: 'warning',
                      },
                      events: {
                        onclick: `
                          form.username = ''
                          form.phone = ''
                          form.email = ''
                          form.description = ''
                          form.channels = []
                          form.tags = []
                          form.agreement = false
                          form.admin = false
                          message.warning('表单已重置')
                        `,
                      },
                    },
                    {
                      id: 'submit-form',
                      type: 'button',
                      label: '提交',
                      props: {
                        type: 'primary',
                      },
                      events: {
                        onclick: `
                          const valid = await submitForm('form')
                          if (!valid) {
                            message.error('请检查必填信息')
                            return
                          }
                          console.log('提交表单：', form)
                          message.success('提交成功')
                        `,
                      },
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}

export const testState: Record<string, unknown> = {
  form: {
    account: '',
    admin: false,
    agreement: false,
    birthday: '',
    channels: [],
    color: '#18a058',
    description: '',
    departmentId: '',
    email: '',
    employeeId: '',
    loginAt: '',
    mention: '',
    mode: '',
    otp: [],
    password: '',
    phone: '',
    progress: 35,
    qrCode: 'https://www.naiveui.com/',
    rating: 3,
    role: '',
    tags: ['OpenPage', 'Vue'],
    team: null,
    tenant: '',
    time: null,
    username: '',
    years: 3,
  },
}
