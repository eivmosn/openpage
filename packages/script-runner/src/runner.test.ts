import { describe, expect, it } from 'vitest'
import { clearScriptCache, compileScript, runScript, ScriptExecutionError } from './index'

describe('@openpage/script-runner', () => {
  it('executes scripts and records state patches', async () => {
    const state = {
      form: {
        count: 1,
        total: 0,
      },
    }

    const result = await runScript('state.form.count += 1\nstate.form.total = sum(state.form.count, 2)', {
      state,
      helpers: {
        sum: (left: number, right: number) => left + right,
      },
      debug: true,
    })

    expect(result.ok).toBe(true)
    expect(state.form.count).toBe(2)
    expect(state.form.total).toBe(4)
    expect(result.patches.map(patch => patch.path.join('.'))).toEqual([
      'form.count',
      'form.total',
    ])
    expect(result.reads?.map(path => path.join('.'))).toContain('form.count')
    expect(result.helperCalls).toEqual(['sum'])
  })

  it('rolls back state changes when scripts fail', async () => {
    const state = {
      form: {
        count: 1,
      },
    }

    const result = await runScript('state.form.count = 2\nthrow new Error("boom")', {
      state,
    })

    expect(result.ok).toBe(false)
    expect(result.error).toBeInstanceOf(ScriptExecutionError)
    expect(state.form.count).toBe(1)
    expect(result.patches).toHaveLength(1)
  })

  it('removes newly created fields when failed scripts are rolled back', async () => {
    const state: Record<string, unknown> = {
      form: {},
    }

    const result = await runScript('state.form.temp = 1\nstate.created = true\nthrow new Error("boom")', {
      state,
    })

    expect(result.ok).toBe(false)
    expect(state).toEqual({
      form: {},
    })
  })

  it('throws wrapped errors when throwOnError is enabled', async () => {
    await expect(runScript('throw new Error("boom")', {
      state: {},
      throwOnError: true,
    })).rejects.toBeInstanceOf(ScriptExecutionError)
  })

  it('supports nested array row updates through proxies', async () => {
    const state = {
      rows: [
        { value: 1 },
        { value: 2 },
      ],
    }

    const result = await runScript('state.rows.forEach(row => { row.value += 1 })', {
      state,
    })

    expect(result.ok).toBe(true)
    expect(state.rows.map(row => row.value)).toEqual([2, 3])
    expect(result.patches.map(patch => patch.path.join('.'))).toEqual([
      'rows.0.value',
      'rows.1.value',
    ])
  })

  it('supports common JavaScript syntax scenarios', async () => {
    const state = {
      form: {
        result: 0,
        optional: 0,
        spreadLength: 0,
      },
    }

    const result = await runScript(`
      function createCounter(start) {
        let value = start

        return function next(step = 1) {
          value += step
          return value
        }
      }

      class Box {
        constructor(value) {
          this.value = value
        }

        add(value) {
          return this.value + value
        }
      }

      const next = createCounter(1)
      const values = [1, 2, 3]
      const record = { a: 1, b: 2 }
      const [first, ...tail] = values
      const { a, ...rest } = record
      const doubledTotal = values
        .map(value => value * 2)
        .filter(value => value > 2)
        .reduce((total, value) => total + value, 0)

      let total = 0

      for (let index = 0; index < values.length; index += 1) {
        total += values[index]
      }

      for (const value of values) {
        total += value
      }

      for (const key in record) {
        total += record[key]
      }

      let guard = 0
      while (guard < 2) {
        total += guard
        guard += 1
      }

      do {
        total += 1
      } while (false)

      try {
        throw new TypeError('handled')
      }
      catch (error) {
        total += error instanceof TypeError ? 1 : 0
      }

      switch (first) {
        case 1:
          total += 10
          break
        default:
          total -= 10
      }

      state.form.result = total +
        doubledTotal +
        new Box(5).add(6) +
        await Promise.resolve(4) +
        next(2) +
        next() +
        a +
        rest.b
      state.form.optional = rest?.b ?? 0
      state.form.spreadLength = [...tail, doubledTotal].length
    `, {
      state,
    })

    expect(result.ok).toBe(true)
    expect(state.form.result).toBe(63)
    expect(state.form.optional).toBe(2)
    expect(state.form.spreadLength).toBe(3)
  })

  it('caches compiled scripts by default', () => {
    clearScriptCache()

    const firstRunner = compileScript('return state.count + 1')
    const secondRunner = compileScript('return state.count + 1')

    expect(firstRunner).toBe(secondRunner)
  })

  it('keeps unknown identifiers inside the script error boundary', async () => {
    const result = await runScript('missingValue + 1', {
      state: {},
    })

    expect(result.ok).toBe(false)
    expect(result.error?.message).toContain('missingValue is not defined')
  })

  it('supports custom error message formatting', async () => {
    const result = await runScript('throw new Error("boom")', {
      state: {},
      formatErrorMessage: ({ phase, message }) => `custom:${phase}:${message}`,
    })

    expect(result.ok).toBe(false)
    expect(result.error?.message).toBe('custom:runtime:boom')
  })

  it('exposes timer helpers through default globals', async () => {
    const state = {
      globalsOk: false,
    }

    const result = await runScript(`
      const timeoutId = setTimeout(() => {}, 0)
      const intervalId = setInterval(() => {}, 100)
      const key = {}
      const weakMap = new WeakMap()
      const weakSet = new WeakSet()
      const url = new URL('https://open.page/?name=runner')
      const params = new URLSearchParams(url.search)

      weakMap.set(key, true)
      weakSet.add(key)
      clearTimeout(timeoutId)
      clearInterval(intervalId)

      state.globalsOk = Boolean(
        Array.isArray(Array.from(new Set([1]))) &&
        new Map([['count', 1]]).get('count') === 1 &&
        Object.keys({ ok: true }).includes('ok') &&
        weakMap.get(key) &&
        weakSet.has(key) &&
        Math.max(1, 2) === 2 &&
        JSON.parse(JSON.stringify({ ok: true })).ok &&
        new Date(0).getFullYear() === 1970 &&
        new RegExp('runner').test('script-runner') &&
        Number('1') === 1 &&
        String(1) === '1' &&
        Boolean(1) === true &&
        parseInt('10', 10) === 10 &&
        parseFloat('1.5') === 1.5 &&
        isFinite(1) &&
        isNaN(Number.NaN) &&
        Object.is(NaN, Number.NaN) &&
        encodeURIComponent('a b') === 'a%20b' &&
        decodeURIComponent('a%20b') === 'a b' &&
        params.get('name') === 'runner' &&
        typeof console.log === 'function' &&
        Infinity > 1 &&
        undefined === void 0 &&
        new TypeError('x') instanceof Error &&
        await Promise.resolve(true)
      )
    `, {
      state,
    })

    expect(result.ok).toBe(true)
    expect(state.globalsOk).toBe(true)
  })

  it('allows timer callbacks to mutate captured state proxies after the main run', async () => {
    const state = {
      form: {
        count: 1,
      },
    }

    const result = await runScript('setTimeout(() => { state.form.count = 2 }, 0)', {
      state,
    })

    expect(result.ok).toBe(true)
    expect(result.patches).toEqual([])

    await new Promise(resolve => setTimeout(resolve, 10))
    expect(state.form.count).toBe(2)
  })
})
