import pkgUp from 'pkg-dir'
import * as path from 'path'
import { writeFile as _writeFile, exists as _exists, mkdir as _mkdir } from 'fs'
import { promisify } from 'util'
import Project from 'ts-simple-ast'
import { findRoutes } from './docgen'
import { printDocs } from './runner'

const writeFile = promisify(_writeFile)
const exists = promisify(_exists)
const mkdir = promisify(_mkdir)

const main = async () => {
  const root = await pkgUp()
  if (root === null) {
    throw new Error(
      'Cannot find root directory. Please include a package.json in the root directory',
    )
  }
  const srcDir = path.join(root, 'src', 'api')
  const project = new Project({ tsConfigFilePath: 'tsconfig.json' })
  project.addExistingSourceFiles(`${srcDir}/**/*.ts{,x}`)
  project.resolveSourceFileDependencies()
  const files = project.getSourceFiles()
  const routes = files.flatMap(f => findRoutes(f))

  const docs = printDocs(routes)

  const docsFolder = path.join(root, 'docs')
  if (!(await exists(docsFolder))) {
    await mkdir(docsFolder)
  }
  writeFile(path.join(docsFolder, 'docs.md'), docs)
}

main()
