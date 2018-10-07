import prettier, { Options } from 'prettier'

const options: Options = {
  semi: false,
  parser: 'typescript',
}

const prefix = 'type Data = '

export const format = (text: string) => prettier.format(prefix + text, options)
