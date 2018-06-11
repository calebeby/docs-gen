import Project from 'ts-simple-ast'

export const parseSource = (text: string) => {
  const project = new Project()
  return project.createSourceFile('file.ts', text)
}
