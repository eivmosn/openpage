import type { ComponentSchema } from '@openpage/core'

export const preferenceSection: ComponentSchema = {
  id: 'preference-section',
  type: 'div',
  props: {
    style: {
      background: '#f0fdf4',
      border: '1px solid #bbf7d0',
      borderRadius: '18px',
      boxShadow: '0 10px 30px rgba(34, 197, 94, 0.08)',
      marginBottom: '22px',
      overflow: 'hidden',
    },
  },
  children: [
    {
      id: 'preference-banner',
      type: 'div',
      label: '02 权限与偏好设置',
      props: {
        style: {
          background: 'linear-gradient(90deg, #16a34a, #4ade80)',
          color: '#ffffff',
          fontSize: '18px',
          fontWeight: '700',
          padding: '14px 24px',
          width: '100%',
        },
      },
    },
    {
      id: 'preference-grid',
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
          id: 'mode',
          type: 'select',
          name: 'mode',
          label: '工作模式',
          required: true,
          props: {
            options: [
              { label: '专注模式', value: 'focus' },
              { label: '协作模式', value: 'team' },
              { label: '访客模式', value: 'guest' },
            ],
            placeholder: '请选择工作模式',
          },
        },
        {
          id: 'team',
          type: 'treeSelect',
          name: 'team',
          label: '所属团队',
          props: {
            options: [
              {
                label: '产品研发中心',
                key: 'product-center',
                children: [
                  { label: '前端团队', key: 'frontend' },
                  { label: '服务端团队', key: 'backend' },
                ],
              },
              {
                label: '体验设计中心',
                key: 'design-center',
                children: [
                  { label: '交互设计', key: 'interaction' },
                  { label: '视觉设计', key: 'visual' },
                ],
              },
            ],
            placeholder: '请选择所属团队',
          },
        },
        {
          id: 'role',
          type: 'radioGroup',
          name: 'role',
          label: '用户角色',
          required: true,
          props: {
            options: [
              { label: '普通成员', value: 'member' },
              { label: '管理员', value: 'admin' },
              { label: '访客', value: 'guest' },
            ],
          },
        },
        {
          id: 'channels',
          type: 'checkboxGroup',
          name: 'channels',
          label: '通知渠道',
          required: true,
          props: {
            options: [
              { label: '站内信', value: 'site' },
              { label: '邮件', value: 'email' },
              { label: '短信', value: 'sms' },
            ],
          },
        },
        {
          id: 'tags',
          type: 'dynamicTags',
          name: 'tags',
          label: '技能标签',
        },
        {
          id: 'admin',
          type: 'switch',
          name: 'admin',
          label: '管理员权限',
        },
        {
          id: 'agreement',
          type: 'switch',
          name: 'agreement',
          label: '接受协作协议',
          required: true,
        },
      ],
    },
  ],
}
