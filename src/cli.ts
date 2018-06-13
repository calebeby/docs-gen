import pkgUp from 'pkg-dir'
import * as path from 'path'
import {
  readFile as _readFile,
  writeFile as _writeFile,
  exists as _exists,
  mkdir as _mkdir,
} from 'fs'
import { promisify } from 'util'
import { run } from './runner'
import { watch } from 'chokidar'

const readFile = promisify(_readFile)
const writeFile = promisify(_writeFile)
const exists = promisify(_exists)
const mkdir = promisify(_mkdir)

const main = async () => {
  const root = await pkgUp()
  if (root === null) {
    console.error(
      'Cannot find root directory. Please include a package.json in the root directory',
    )
    return process.exit(1)
  }
  const srcPath = path.join(root, 'src', 'api.ts')
  const watcher = watch(srcPath)
  const processFile = async () => {
    const docsFolder = path.join(root, 'docs')
    if (!(await exists(docsFolder))) {
      await mkdir(docsFolder)
    }
    const src = await readFile(srcPath, 'utf-8')
    let out
    try {
      out = run(src)
      await writeFile(path.join(docsFolder, 'docs.md'), out)
    } catch (e) {
      console.error(e)
    }
    console.log('done')
  }
  processFile()
  watcher.on('change', processFile)
}

main()
