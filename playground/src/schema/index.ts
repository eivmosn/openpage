import type { PageSchema } from '@openpage/core'
import { advancedSection } from './sections/advanced'
import { basicSection } from './sections/basic'
import { preferenceSection } from './sections/preference'

export const testSchema: PageSchema = {
  id: 'test-page',
  title: '复杂页面编排测试',
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
              boxSizing: 'border-box',
              margin: '0 auto',
              width: '100%',
            },
          },
          children: [
            {
              id: 'form',
              type: 'div',
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
                      margin: '10px 15px',
                    },
                  },
                  children: [
                    {
                      id: 'save-draft',
                      type: 'button',
                      label: '暂存',
                      props: {
                        popconfirm: {
                          positiveText: '确认',
                          negativeText: '取消',
                          text: '文字内容',
                          showIcon: true,
                          customIcon: '',
                          trigger: 'click',
                        },
                        tooltip: {
                          text: '我是悬浮提示内容',
                          trigger: 'click',
                          maxWidth: 300,
                        },
                        type: 'default',
                      },
                      events: {
                        onclick: `
                          console.log('暂存数据：', { username, phone, email, channels, tags })
                          msg.info('已暂存当前填写内容')
                        `,
                      },
                    },
                    {
                      id: 'reset-form',
                      type: 'button',
                      label: '重置',
                      props: {
                        tooltip: {
                          text: '清空当前页面状态',
                          maxWidth: 240,
                        },
                        type: 'warning',
                      },
                      events: {
                        onclick: `
                          await resetForm()
                          username = ''
                          phone = ''
                          email = ''
                          birthday = ''
                          loginAt = ''
                          time = null
                          description = ''
                          channels = []
                          tags = []
                          agreement = false
                          admin = false
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
                          const valid = await submitForm()
                          if (!valid) {
                            return
                          }
                          console.log('提交数据：', { username, phone, email, channels, tags })
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
    {
      id: 'tenant1',
      type: 'autoComplete',
      name: 'tenant1',
      label: '租户2',
      props: {
        options: ['OpenPage Cloud', 'OpenPage Studio', 'OpenPage Enterprise'],
        placeholder: '请输入或选择租户',
      },
    },
  ],
}

export const testState: Record<string, unknown> = {
  a: null,
  account: '',
  admin: false,
  agreement: false,
  b: null,
  birthday: '',
  carousel: [
    {
      label: '开放式协作空间',
      type: 'url',
      value: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?q=80&w=900&auto=format&fit=crop',
    },
    {
      label: '团队项目会议',
      type: 'url',
      value: 'https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=900&auto=format&fit=crop',
    },
    {
      label: '业务数据看板',
      type: 'url',
      value: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=900&auto=format&fit=crop',
    },
  ],
  channels: [],
  color: '#18a058',
  description: '',
  departmentId: '',
  email: '',
  employeeId: '',
  loginAt: '',
  mention: '',
  mode: '',
  nativeContact: '',
  otp: '',
  otpArray: ['1', '2'],
  password: '',
  phone: '',
  profileImages: [
    {
      label: '办公空间',
      type: 'url',
      value: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?q=80&w=600&auto=format&fit=crop',
    },
    {
      label: '协作会议',
      type: 'url',
      value: 'https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=600&auto=format&fit=crop',
    },
    {
      label: '产品看板',
      type: 'url',
      value: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=600&auto=format&fit=crop',
    },
  ],
  progress: 35,
  qrCode: 'https://www.naiveui.com/',
  rating: 3,
  role: '',
  start: '',
  end: '',
  tags: [
    { label: 'OpenPage', value: 'OpenPage' },
    { label: 'Vue', value: 'Vue' },
  ],
  team: null,
  tenant: '',
  time: null,
  total: null,
  username: '',
  years: 3,
}
