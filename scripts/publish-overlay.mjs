import { spawn } from 'node:child_process'
import { readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = resolve(__dirname, '..')
const overlayDir = resolve(rootDir, 'packages/overlay')
const packageJsonPath = resolve(overlayDir, 'package.json')
const sourcePackageName = '@openpage/overlay'
const publishPackageName = 'overlay-vue'
const publishArgs = process.argv.slice(2)

/**
 * 读取 overlay 包配置。
 *
 * @returns {Promise<Record<string, unknown>>} 返回 package.json 对象。
 */
async function readPackageJson() {
  return JSON.parse(await readFile(packageJsonPath, 'utf8'))
}

/**
 * 写入 overlay 包配置。
 *
 * @param {Record<string, unknown>} packageJson package.json 对象。
 * @returns {Promise<void>} 写入完成后返回。
 */
async function writePackageJson(packageJson) {
  await writeFile(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`)
}

/**
 * 执行 pnpm 命令并继承当前终端输出。
 *
 * @param {string[]} args pnpm 参数列表。
 * @param {string} cwd 命令执行目录。
 * @returns {Promise<void>} 命令成功完成后返回。
 */
async function runPnpm(args, cwd = rootDir) {
  await new Promise((resolveCommand, rejectCommand) => {
    const child = spawn('pnpm', args, {
      cwd,
      stdio: 'inherit',
      shell: process.platform === 'win32',
    })

    child.on('error', rejectCommand)
    child.on('close', (code) => {
      if (code === 0) {
        resolveCommand()
        return
      }

      rejectCommand(new Error(`pnpm ${args.join(' ')} exited with code ${code}`))
    })
  })
}

const originalPackageJson = await readPackageJson()

if (originalPackageJson.name !== sourcePackageName) {
  throw new Error(`Expected overlay package name to be ${sourcePackageName}, got ${String(originalPackageJson.name)}.`)
}

try {
  await runPnpm(['--filter', sourcePackageName, 'build'])

  await writePackageJson({
    ...originalPackageJson,
    name: publishPackageName,
  })

  await runPnpm(['publish', ...publishArgs], overlayDir)
}
finally {
  await writePackageJson(originalPackageJson)
}
