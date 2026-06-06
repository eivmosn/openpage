import type { init } from 'modern-monaco'

export type Monaco = Awaited<ReturnType<typeof init>>
export type MonacoEditor = ReturnType<Monaco['editor']['create']>
export type MonacoDisposable = ReturnType<MonacoEditor['onDidChangeModelContent']>

/**
 * 初始化支持 JSON 语言服务的 Modern Monaco。
 *
 * @returns 返回 Monaco API。
 */
export async function createMonaco(): Promise<Monaco> {
  const { init: initializeMonaco } = await import('modern-monaco')

  return initializeMonaco({
    defaultTheme: 'github-light',
    langs: ['json'],
    lsp: {
      formatting: {
        insertSpaces: true,
        tabSize: 2,
      },
      json: {
        allowComments: false,
        trailingCommas: 'error',
      },
    },
  })
}
