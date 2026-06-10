import type { ScriptPath, StatePatch } from './types'

export interface ScriptTransactionOptions {
  state: Record<string, unknown>
  debug?: boolean
}

export class ScriptTransaction {
  private readonly state: Record<string, unknown>
  private readonly debug: boolean
  private readonly patches: StatePatch[] = []
  private readonly reads: ScriptPath[] = []
  private readonly helperCalls: string[] = []
  private closed = false

  /**
   * 创建脚本事务。
   *
   * @param options 脚本事务配置。
   */
  constructor(options: ScriptTransactionOptions) {
    this.state = options.state
    this.debug = options.debug === true
  }

  /**
   * 记录一次状态读取。
   *
   * @param path 被读取的状态路径。
   */
  recordRead(path: ScriptPath): void {
    if (this.closed) {
      return
    }

    if (this.debug) {
      this.reads.push([...path])
    }
  }

  /**
   * 记录一次 helper 调用。
   *
   * @param name 被调用的 helper 名称。
   */
  recordHelperCall(name: string): void {
    if (this.closed) {
      return
    }

    if (this.debug) {
      this.helperCalls.push(name)
    }
  }

  /**
   * 写入状态并记录 patch。
   *
   * @param path 被写入的状态路径。
   * @param value 新状态值。
   */
  set(path: ScriptPath, value: unknown): void {
    if (this.closed) {
      writePath(this.state, path, value)
      return
    }

    const oldValue = readPath(this.state, path)
    writePath(this.state, path, value)
    this.patches.push({
      type: 'set',
      path: [...path],
      value,
      oldValue,
    })
  }

  /**
   * 删除状态字段并记录 patch。
   *
   * @param path 被删除的状态路径。
   */
  delete(path: ScriptPath): void {
    if (this.closed) {
      deletePath(this.state, path)
      return
    }

    const oldValue = readPath(this.state, path)
    deletePath(this.state, path)
    this.patches.push({
      type: 'delete',
      path: [...path],
      oldValue,
    })
  }

  /**
   * 提交事务并关闭后续写入。
   */
  commit(): void {
    this.closed = true
  }

  /**
   * 回滚事务内所有写入。
   */
  rollback(): void {
    for (let index = this.patches.length - 1; index >= 0; index -= 1) {
      const patch = this.patches[index]

      if (patch.type === 'set') {
        writePath(this.state, patch.path, patch.oldValue)
      }
      else {
        writePath(this.state, patch.path, patch.oldValue)
      }
    }

    this.closed = true
  }

  /**
   * 关闭事务，后续异步逃逸写入会直接落到状态但不再记录到本次结果。
   */
  close(): void {
    this.closed = true
  }

  /**
   * 获取事务内记录的状态 patch。
   *
   * @returns 返回状态 patch 列表。
   */
  getPatches(): StatePatch[] {
    return this.patches.map(patch => ({
      ...patch,
      path: [...patch.path],
    }))
  }

  /**
   * 获取调试模式下记录的读取路径。
   *
   * @returns 返回状态读取路径列表。
   */
  getReads(): ScriptPath[] {
    return this.reads.map(path => [...path])
  }

  /**
   * 获取调试模式下记录的 helper 调用。
   *
   * @returns 返回 helper 名称列表。
   */
  getHelperCalls(): string[] {
    return [...this.helperCalls]
  }
}

/**
 * 根据路径读取状态值。
 *
 * @param state 状态根对象。
 * @param path 需要读取的路径。
 * @returns 返回路径对应的状态值。
 */
function readPath(state: Record<string, unknown>, path: ScriptPath): unknown {
  let current: unknown = state

  for (const key of path) {
    if (!isObjectLike(current)) {
      return undefined
    }

    current = Reflect.get(current, toPropertyKey(key))
  }

  return current
}

/**
 * 根据路径写入状态值。
 *
 * @param state 状态根对象。
 * @param path 需要写入的路径。
 * @param value 新状态值。
 */
function writePath(state: Record<string, unknown>, path: ScriptPath, value: unknown): void {
  if (path.length === 0) {
    return
  }

  let current: unknown = state

  for (const key of path.slice(0, -1)) {
    if (!isObjectLike(current)) {
      return
    }

    current = Reflect.get(current, toPropertyKey(key))
  }

  if (isObjectLike(current)) {
    Reflect.set(current, toPropertyKey(path[path.length - 1]), value)
  }
}

/**
 * 根据路径删除状态字段。
 *
 * @param state 状态根对象。
 * @param path 需要删除的路径。
 */
function deletePath(state: Record<string, unknown>, path: ScriptPath): void {
  if (path.length === 0) {
    return
  }

  let current: unknown = state

  for (const key of path.slice(0, -1)) {
    if (!isObjectLike(current)) {
      return
    }

    current = Reflect.get(current, toPropertyKey(key))
  }

  if (isObjectLike(current)) {
    Reflect.deleteProperty(current, toPropertyKey(path[path.length - 1]))
  }
}

/**
 * 判断值是否可通过 Reflect 读写属性。
 *
 * @param value 需要判断的值。
 * @returns 返回值是否为对象或函数。
 */
function isObjectLike(value: unknown): value is object {
  return (typeof value === 'object' && value !== null) || typeof value === 'function'
}

/**
 * 转换路径键为对象属性键。
 *
 * @param key 路径键。
 * @returns 返回对象属性键。
 */
function toPropertyKey(key: string | number): string {
  return String(key)
}
