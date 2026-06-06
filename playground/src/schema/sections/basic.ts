import type { NodeSchema } from '@openpage/renderer'

export const basicSection: NodeSchema = {
  id: 'basic-section',
  type: 'div',
  props: {
    style: {
      background: '#eff6ff',
      border: '1px solid #bfdbfe',
      borderRadius: '18px',
      boxShadow: '0 10px 30px rgba(59, 130, 246, 0.08)',
      marginBottom: '22px',
      overflow: 'hidden',
    },
  },
  children: [
    {
      id: 'basic-banner',
      type: 'div',
      label: '01 基础身份信息',
      props: {
        style: {
          background: 'linear-gradient(90deg, #2563eb, #60a5fa)',
          color: '#ffffff',
          fontSize: '18px',
          fontWeight: '700',
          padding: '14px 24px',
          width: '100%',
        },
      },
    },
    {
      id: 'basic-grid',
      type: 'div',
      props: {
        style: {
          display: 'grid',
          gap: '16px 24px',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          padding: '14px',
        },
      },
      children: [
        {
          id: 'tenant',
          type: 'autoComplete',
          name: 'tenant',
          label: '租户',
          required: true,
          props: {
            options: ['OpenPage Cloud', 'OpenPage Studio', 'OpenPage Enterprise'],
            placeholder: '请输入或选择租户',
          },
        },
        {
          id: 'username',
          type: 'input',
          name: 'username',
          label: '用户名',
          required: true,
          props: {
            placeholder: '请输入用户名',
          },
        },
        {
          id: 'password',
          type: 'password',
          name: 'password',
          label: '登录密码',
          required: true,
          props: {
            placeholder: '请输入登录密码',
          },
        },
        {
          id: 'otp',
          type: 'inputOTP',
          name: 'otp',
          label: '验证码',
          props: {
            length: 6,
          },
        },
        {
          id: 'phone',
          type: 'input',
          name: 'phone',
          label: '手机号',
          required: true,
          props: {
            placeholder: '请输入手机号',
          },
        },
        {
          id: 'email',
          type: 'input',
          name: 'email',
          label: '邮箱',
          props: {
            placeholder: '请输入邮箱',
          },
        },
        {
          id: 'mention',
          type: 'mention',
          name: 'mention',
          label: '协作成员',
          props: {
            options: [
              { label: '产品经理', value: 'product' },
              { label: '前端工程师', value: 'frontend' },
              { label: '设计师', value: 'designer' },
            ],
            placeholder: '输入 @ 选择协作成员',
          },
        },
        {
          id: 'description',
          type: 'textarea',
          name: 'description',
          label: '个人简介',
          props: {
            autosize: {
              minRows: 2,
              maxRows: 4,
            },
            placeholder: '介绍一下当前用户',
          },
        },
      ],
    },
  ],
}
