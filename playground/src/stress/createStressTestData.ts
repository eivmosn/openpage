import type { ComponentSchema, PageSchema } from '@openpage/core'

export interface StressTestData {
  schema: PageSchema
  state: Record<string, unknown>
}

const GENERATION_BATCH_SIZE = 500
const MAX_STRESS_FIELD_COUNT = 10000

/**
 * 异步生成指定数量的表单字段压力测试数据。
 *
 * @param fieldCount 需要生成的字段数量。
 * @returns 返回压力测试 Schema 与 State。
 */
export async function createStressTestData(fieldCount: number): Promise<StressTestData> {
  const normalizedFieldCount = normalizeFieldCount(fieldCount)
  const children: ComponentSchema[] = []
  const state: Record<string, unknown> = {}

  for (let start = 0; start < normalizedFieldCount; start += GENERATION_BATCH_SIZE) {
    const end = Math.min(start + GENERATION_BATCH_SIZE, normalizedFieldCount)

    for (let index = start; index < end; index++) {
      children.push(createStressField(index))
      assignStressState(state, index)
    }

    await yieldToMainThread()
  }

  return {
    schema: {
      id: 'stress-test-page',
      title: `${normalizedFieldCount} 个表单字段压力测试`,
      children: [
        {
          id: 'stress-form',
          type: 'div',
          children,
        },
      ],
    },
    state,
  }
}

/**
 * 将压力测试字段数量限制为安全整数。
 *
 * @param fieldCount 用户输入的字段数量。
 * @returns 返回限制后的字段数量。
 */
function normalizeFieldCount(fieldCount: number): number {
  if (!Number.isFinite(fieldCount)) {
    return 1_000
  }

  return Math.min(MAX_STRESS_FIELD_COUNT, Math.max(1, Math.floor(fieldCount)))
}

/**
 * 创建指定索引的压力测试字段。
 *
 * @param index 当前字段索引。
 * @returns 返回压力测试字段配置。
 */
function createStressField(index: number): ComponentSchema {
  if (index >= 2 && index % 20 === 0) {
    return createComputedField(index)
  }

  if (index % 25 === 0) {
    return createLinkageField(index)
  }

  if (index % 10 === 0) {
    return createSwitchField(index)
  }

  if (index % 3 === 0) {
    return createNumberField(index)
  }

  return createInputField(index)
}

/**
 * 创建普通文本输入字段。
 *
 * @param index 当前字段索引。
 * @returns 返回文本输入字段配置。
 */
function createInputField(index: number): ComponentSchema {
  return {
    id: `stress-field-${index}`,
    type: 'input',
    name: `field-${index}`,
    label: `文本字段 ${index}`,
    disabled: index % 97 === 0 ? '{{ state["field-1"] === true }}' : undefined,
    visible: index % 101 === 0 ? '{{ state["field-2"] !== "hidden" }}' : undefined,
    props: {
      placeholder: `field-${index}`,
    },
  }
}

/**
 * 创建数字输入字段。
 *
 * @param index 当前字段索引。
 * @returns 返回数字输入字段配置。
 */
function createNumberField(index: number): ComponentSchema {
  return {
    id: `stress-field-${index}`,
    type: 'inputNumber',
    name: `field-${index}`,
    label: `数字字段 ${index}`,
    defaultValue: index % 99 === 0 ? index : undefined,
  }
}

/**
 * 创建计算字段。
 *
 * @param index 当前字段索引。
 * @returns 返回计算字段配置。
 */
function createComputedField(index: number): ComponentSchema {
  return {
    id: `stress-field-${index}`,
    type: 'inputNumber',
    name: `field-${index}`,
    label: `计算字段 ${index}`,
    computedValue: `{{ sum(state["field-${index - 1}"], state["field-${index - 2}"]) }}`,
  }
}

/**
 * 创建开关字段。
 *
 * @param index 当前字段索引。
 * @returns 返回开关字段配置。
 */
function createSwitchField(index: number): ComponentSchema {
  return {
    id: `stress-field-${index}`,
    type: 'switch',
    name: `field-${index}`,
    label: `开关字段 ${index}`,
  }
}

/**
 * 创建包含静态字段联动的单选字段。
 *
 * @param index 当前字段索引。
 * @returns 返回单选联动字段配置。
 */
function createLinkageField(index: number): ComponentSchema {
  return {
    id: `stress-field-${index}`,
    type: 'select',
    name: `field-${index}`,
    label: `联动字段 ${index}`,
    props: {
      options: [
        {
          label: `选项 A-${index}`,
          targetValue: `linked-a-${index}`,
          value: `option-a-${index}`,
        },
        {
          label: `选项 B-${index}`,
          targetValue: `linked-b-${index}`,
          value: `option-b-${index}`,
        },
      ],
    },
    events: {
      onchange: {
        type: 'static',
        dependency: {
          [`field-${index + 1}`]: '{{ $event?.targetValue }}',
        },
      },
    },
  }
}

/**
 * 为指定索引生成随机初始 State。
 *
 * @param state 压力测试 State。
 * @param index 当前字段索引。
 */
function assignStressState(state: Record<string, unknown>, index: number): void {
  const key = `field-${index}`

  if (index >= 2 && index % 20 === 0) {
    return
  }

  if (index % 25 === 0) {
    state[key] = `option-${Math.random() > 0.5 ? 'a' : 'b'}-${index}`
    return
  }

  if (index % 10 === 0) {
    state[key] = Math.random() > 0.5
    return
  }

  if (index % 3 === 0) {
    state[key] = Math.floor(Math.random() * 10_000)
    return
  }

  state[key] = `随机值-${Math.floor(Math.random() * 100_000)}`
}

/**
 * 主动让出主线程，避免大批量数据生成长期阻塞界面。
 *
 * @returns 返回下一轮宏任务完成 Promise。
 */
function yieldToMainThread(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 0))
}
