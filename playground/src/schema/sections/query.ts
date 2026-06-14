import type { ComponentSchema } from '@openpage/core'

export const querySection: ComponentSchema = {
  id: 'query-section',
  type: 'div',
  props: {
    style: {
      background: '#ffffff',
      border: '1px solid #edf0f5',
      borderRadius: '4px',
      boxSizing: 'border-box',
      marginBottom: '16px',
      padding: '12px 16px',
    },
  },
  children: [
    {
      id: 'query-form-row',
      type: 'div',
      props: {
        style: {
          alignItems: 'center',
          display: 'grid',
          gap: '12px 22px',
          gridTemplateColumns: 'repeat(4, minmax(180px, 1fr)) auto',
        },
      },
      children: [
        {
          id: 'query-user-name',
          type: 'input',
          name: 'queryUserName',
          label: '用户名称',
          props: {
            placeholder: '请输入用户名称',
          },
          required: true,
        },
        {
          id: 'query-height',
          type: 'select',
          name: 'queryHeight',
          label: '个头大小',
          props: {
            options: [
              { label: '偏小', value: 'small' },
              { label: '中等', value: 'medium' },
              { label: '偏高', value: 'tall' },
            ],
            placeholder: '请选择个头大小',
          },
        },
        {
          id: 'query-gender',
          type: 'select',
          name: 'queryGender',
          label: '性别',
          props: {
            options: [
              { label: '男', value: 'male' },
              { label: '女', value: 'female' },
            ],
            placeholder: '请选择性别',
          },
        },
        {
          id: 'query-address',
          type: 'input',
          name: 'queryAddress',
          label: '地址',
          props: {
            placeholder: '请输入地址',
          },
        },
        {
          id: 'query-actions',
          type: 'div',
          props: {
            style: {
              alignItems: 'center',
              display: 'flex',
              gap: '8px',
              gridColumn: '5',
              gridRow: '1 / span 2',
              justifyContent: 'flex-end',
              minWidth: '150px',
            },
          },
          children: [
            {
              id: 'query-submit',
              type: 'button',
              label: '查询',
              props: {
                type: 'primary',
              },
              events: {
                onclick: `
                  const valid = await ctx.validate('query-form-row')

                  if (!valid) {
                    return
                  }

                  console.log('查询条件：', {
                    userName: state.queryUserName,
                    height: state.queryHeight,
                    gender: state.queryGender,
                    address: state.queryAddress,
                    archiveTime: state.queryArchiveTime,
                  })
                  ctx.message.success('查询条件已提交')
                `,
              },
            },
            {
              id: 'query-reset',
              type: 'button',
              label: '重置',
              props: {
                type: 'default',
              },
              events: {
                onclick: `
                  await ctx.reset('query-form-row')
                  state.queryUserName = ''
                  state.queryHeight = ''
                  state.queryGender = ''
                  state.queryAddress = ''
                  state.queryArchiveTime = ''
                  ctx.message.info('查询条件已重置')
                `,
              },
            },
          ],
        },
        {
          id: 'query-archive-time',
          type: 'date',
          name: 'queryArchiveTime',
          label: '档案时间',
          props: {
            placeholder: '请选择日期时间',
            valueFormat: 'yyyy-MM-dd',
          },
        },
      ],
    },
  ],
}
