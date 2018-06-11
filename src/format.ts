import prettier from 'prettier'

const options = {
  semi: false,
  parser: 'typescript',
}

const prefix = 'type Data = '

export const format = (text: string) => prettier.format(prefix + text, options)
