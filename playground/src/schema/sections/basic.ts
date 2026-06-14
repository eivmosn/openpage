import type { ComponentSchema } from '@openpage/core'

export const basicSection: ComponentSchema = {
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
      children: [
        {
          id: 'basic-banner-title',
          type: 'text',
          label: '01 基础身份信息',
        },
      ],
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
          type: 'div',
          id: 'group-input',
          props: {
            style: {
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            },
          },
          children: [
            {
              id: 'tenant',
              type: 'autoComplete',
              name: 'tenant',
              label: '租户',
              props: {
                options: ['OpenPage Cloud', 'OpenPage Studio', 'OpenPage Enterprise'],
                placeholder: '请输入或选择租户',
                message: '租户必填: 支持自定义必填文字 message 属性',
                style: {
                  flex: 1,
                  width: '100%',
                },
              },
              required: true,
            },
            {
              id: 'open-login-page',
              type: 'button',
              label: '关联页面',
              props: {
                tooltip: {
                  text: '通过 core 内置 openPage 打开子页面',
                  maxWidth: 220,
                },
              },
              events: {
                onclick: `
                  const result = await ctx.openPage({
                    page: 'login',
                    params: {
                      tenant: state.tenant,
                    },
                    mode: 'modal',
                    overlay: {
                      title: '登录表单',
                      width: 640,
                      height: 520,
                    },
                  })

                  if (result.action === 'confirm') {
                    ctx.message.success('子页面确认完成')
                  }
                `,
              },
            },
          ],
        },
        {
          id: 'total',
          type: 'inputNumber',
          name: 'total',
          label: '总金额',
          computedValue: '{{ ctx.sum(state.a, state.b) }}',
          props: {
            placeholder: '自动计算 A收款 + B收款',
          },
          required: true,
        },
        {
          id: 'a',
          type: 'inputNumber',
          name: 'a',
          label: 'A收款',
          props: {
            placeholder: '请输入 A收款',
          },
        },
        {
          id: 'b',
          type: 'inputNumber',
          name: 'b',
          label: 'B收款',
          props: {
            placeholder: '请输入 B收款',
          },
        },
        {
          id: 'username',
          type: 'input',
          name: 'username',
          label: '用户名',
          props: {
            placeholder: '请输入用户名',
          },
        },
        {
          id: 'native-contact',
          type: 'nativeInput',
          name: 'nativeContact',
          label: '自定义组件',
          required: true,
          props: {
            autocomplete: 'name',
            message: '自定义组件支持无缝接入验证',
            placeholder: '测试 NativeInput 必填校验',
          },
        },
        {
          id: 'password',
          type: 'password',
          name: 'password',
          label: '登录密码',
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
            length: 4,
          },
        },
        {
          id: 'employee',
          type: 'select',
          name: 'employeeId',
          label: '部门人员',
          props: {
            options: [
              {
                departmentId: 'product',
                email: 'lin@example.com',
                label: '林产品',
                phone: '13800000001',
                value: 'employee-1',
              },
              {
                departmentId: 'engineering',
                email: 'chen@example.com',
                label: '陈研发',
                phone: '13800000002',
                value: 'employee-2',
              },
            ],
            placeholder: '请选择部门人员',
          },
          events: {
            onchange: {
              type: 'static',
              dependency: {
                departmentId: '{{ $event?.departmentId }}',
                email: '{{ $event?.email }}',
                phone: '{{ $event?.phone }}',
              },
            },
          },
        },
        {
          id: 'department',
          type: 'input',
          name: 'departmentId',
          label: '部门编号',
          props: {
            placeholder: '选择人员后自动带出',
          },
        },
        {
          id: 'phone',
          type: 'input',
          name: 'phone',
          label: '手机号',
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
