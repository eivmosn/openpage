import type { ComponentSchema } from '@openpage/core'

export const advancedSection: ComponentSchema = {
  id: 'advanced-section',
  type: 'div',
  props: {
    style: {
      background: '#fff7ed',
      border: '1px solid #fed7aa',
      borderRadius: '18px',
      boxShadow: '0 10px 30px rgba(249, 115, 22, 0.08)',
      overflow: 'hidden',
    },
  },
  children: [
    {
      id: 'advanced-banner',
      type: 'div',
      props: {
        style: {
          background: 'linear-gradient(90deg, #ea580c, #fb923c)',
          color: '#ffffff',
          fontSize: '18px',
          fontWeight: '700',
          padding: '14px 24px',
          width: '100%',
        },
      },
      children: [
        {
          id: 'advanced-banner-title',
          type: 'text',
          label: '03 时间、指标与展示',
        },
      ],
    },
    {
      id: 'advanced-grid',
      type: 'div',
      props: {
        style: {
          alignItems: 'start',
          display: 'grid',
          gap: '16px 24px',
          gridTemplateColumns: 'repeat(1, minmax(0, 1fr))',
          padding: '14px',
        },
      },
      children: [
        {
          id: 'birthday',
          type: 'date',
          name: 'birthday',
          label: '入职日期',
          props: {
            placeholder: '请选择入职日期',
            valueFormat: 'yyyy-MM-dd',
          },
          required: true,
          description: '支持描述字段换行\n换行展示',
        },
        {
          id: 'range',
          type: 'daterange',
          name: 'start,end',
          label: '工作年限',
          description: '支持两个字段绑定\n直接配置 star,name',
          props: {
            placeholder: '请选择工作年限',
            valueFormat: 'yyyy-MM-dd',
          },
          required: true,
        },
        {
          id: 'loginAt',
          type: 'datetime',
          name: 'loginAt',
          label: '预约时间',
          props: {
            placeholder: '请选择预约时间',
            valueFormat: 'yyyy-MM-dd HH:mm:ss',
          },
          required: '{{ state.birthday !== ""}}',
        },
        {
          id: 'time',
          type: 'timePicker',
          name: 'time',
          label: '提醒时间',
          props: {
            clearable: true,
          },
          required: true,
        },
        {
          id: 'years',
          type: 'inputNumber',
          name: 'years',
          label: '工作年限',
          props: {
            min: 0,
            max: 50,
          },
        },
        {
          id: 'progress',
          type: 'slider',
          name: 'progress',
          label: '资料完善度',
          props: {
            min: 0,
            max: 100,
          },
        },
        {
          id: 'rating',
          type: 'rate',
          name: 'rating',
          label: '体验评分',
          props: {
            clearable: true,
          },
        },
        {
          id: 'color',
          type: 'colorPicker',
          name: 'color',
          label: '主题颜色',
        },
        {
          id: 'qr-code',
          type: 'qrCode',
          label: '资料二维码',
          props: {
            size: 110,
            value: '{{ state.qrCode }}',
          },
        },
        {
          id: 'profile-images',
          type: 'images',
          name: 'profileImages',
          label: '资料图片',
          labelWidth: 95,
          props: {
            imageHeight: 104,
            imageWidth: 104,
          },
        },
        {
          id: 'carousel',
          type: 'carousel',
          name: 'carousel',
          label: '资料轮播',
          props: {
            height: 220,
            interval: 3200,
            loop: true,
            showArrow: true,
          },
        },
      ],
    },
  ],
}
