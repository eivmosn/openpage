import type { PageSchema } from '@openpage/core'
import { advancedSection } from './sections/advanced'
import { basicSection } from './sections/basic'
import { preferenceSection } from './sections/preference'
import { querySection } from './sections/query'

export const testSchema: PageSchema = {
  id: 'test-page',
  title: '复杂页面编排测试',
  children: [
    {
      id: 'page-layout',
      type: 'div',
      props: {
        style: {
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          minHeight: 0,
          overflow: 'hidden',
        },
      },
      children: [
        {
          id: 'page-header',
          type: 'div',
          props: {
            style: {
              alignItems: 'center',
              background: '#fff',
              borderBottom: '1px solid #e5e7eb',
              boxSizing: 'border-box',
              display: 'flex',
              flex: '0 0 auto',
              justifyContent: 'flex-start',
              minHeight: '56px',
              padding: '10px 16px',
            },
          },
          children: [
            {
              id: 'save-draft',
              type: 'button',
              label: '保存',
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
                  console.log('保存数据：', {
                    username: state.username,
                    phone: state.phone,
                    email: state.email,
                    channels: state.channels,
                    tags: state.tags,
                  })
                  ctx.message.info('已保存当前填写内容')
                `,
              },
            },
          ],
        },
        {
          id: 'page-content',
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
              id: 'form-shell',
              type: 'div',
              props: {
                style: {
                  padding: '20px',
                },
              },
              children: [
                {
                  id: 'form',
                  type: 'div',
                  children: [
                    querySection,
                    basicSection,
                    preferenceSection,
                    advancedSection,
                  ],
                },
              ],
            },
          ],
        },
        {
          id: 'page-footer',
          type: 'div',
          props: {
            style: {
              alignItems: 'center',
              background: '#fff',
              borderTop: '1px solid #e5e7eb',
              boxSizing: 'border-box',
              display: 'flex',
              flex: '0 0 auto',
              gap: '14px',
              justifyContent: 'center',
              minHeight: '64px',
              padding: '12px 16px',
            },
          },
          children: [
            {
              id: 'reset-validation',
              type: 'button',
              label: '重置',
              props: {
                tooltip: {
                  text: '清空当前表单内容',
                  maxWidth: 240,
                },
                type: 'warning',
              },
              events: {
                onclick: `
                  await ctx.reset()
                  state.username = ''
                  state.phone = ''
                  state.email = ''
                  state.birthday = ''
                  state.loginAt = ''
                  state.time = null
                  state.description = ''
                  state.channels = []
                  state.tags = []
                  state.agreement = false
                  state.admin = false
                  ctx.message.warning('表单已重置')
                `,
              },
            },
            {
              id: 'validate-form',
              type: 'button',
              label: '校验',
              props: {
                type: 'primary',
              },
              events: {
                onclick: `
                  const valid = await ctx.validate()
                  if (!valid) {
                    return
                  }
                  console.log('提交数据：', {
                    username: state.username,
                    phone: state.phone,
                    email: state.email,
                    channels: state.channels,
                    tags: state.tags,
                  })
                  ctx.message.success('校验通过')
                `,
              },
            },
            {
              id: 'validate-ignore-query',
              type: 'button',
              label: '忽略查询校验',
              props: {
                type: 'default',
              },
              events: {
                onclick: `
                  const valid = await ctx.validate(undefined, {
                    ignore: ['query-form-row'],
                  })

                  if (!valid) {
                    return
                  }

                  ctx.message.success('已忽略查询区域并完成校验')
                `,
              },
            },
            {
              id: 'reset-ignore-query',
              type: 'button',
              label: '忽略查询重置',
              props: {
                type: 'default',
              },
              events: {
                onclick: `
                  await ctx.reset(undefined, {
                    ignore: ['query-form-row'],
                  })

                  ctx.message.info('已忽略查询区域并重置校验状态')
                `,
              },
            },
            {
              id: 'validate-tenant',
              type: 'button',
              label: '校验租户',
              props: {
                type: 'default',
              },
              events: {
                onclick: `
                  const valid = await ctx.validate('tenant')

                  if (valid) {
                    ctx.message.success('租户校验通过')
                  }
                `,
              },
            },
            {
              id: 'validate-fields',
              type: 'button',
              label: '校验租户和金额',
              props: {
                type: 'default',
              },
              events: {
                onclick: `
                  const valid = await ctx.validate(['tenant', 'total'])

                  if (valid) {
                    ctx.message.success('租户和金额校验通过')
                  }
                `,
              },
            },
          ],
        },
      ],
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
  loginUser: null,
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
  permissionDraft: null,
  profileUser: null,
  progress: 35,
  queryAddress: '',
  queryArchiveTime: '',
  queryGender: '',
  queryHeight: '',
  queryUserName: '',
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
