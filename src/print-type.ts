import { ParsedType, NodeTypes } from './parse-type'
interface KeyvalPair {
  key: string
  optional: boolean
  comment?: string
  value: ParsedType
}

const printKeyval = ({ key, value, optional, comment }: KeyvalPair): string => {
  let str = ''
  if (comment) {
    str += comment + '\n'
  }
  str += key
  if (optional) {
    str += '?'
  }
  str += ': ' + printType(value)
  return str
}

const printIndex = (prefix: string) => (index?: ParsedType) => {
  if (index === undefined) {
    return ''
  }
  return printKeyval({ key: prefix, value: index, optional: false }) + ',\n'
}

const printStringIndex = printIndex('[key: string]')
const printNumberIndex = printIndex('[key: number]')

export const printType = (type: ParsedType): string => {
  if (type.type === NodeTypes.Literal) {
    return type.value
  }
  if (type.type === NodeTypes.Base) {
    return type.value
  }
  if (type.type === NodeTypes.Union) {
    return type.subTypes.map(printType).join(' | ')
  }
  if (type.type === NodeTypes.Object) {
    const keyvalPairs = type.keys.map(printKeyval)
    return (
      '{\n' +
      printStringIndex(type.stringIndex) +
      printNumberIndex(type.numberIndex) +
      keyvalPairs.join(',\n') +
      '\n}'
    )
  }
  if (type.type === NodeTypes.Array) {
    if (
      type.subType.type === NodeTypes.Union ||
      type.subType.type === NodeTypes.Intersection
    ) {
      return `(${printType(type.subType)})[]`
    }
    return `${printType(type.subType)}[]`
  }
  if (type.type === NodeTypes.Intersection) {
    return type.subTypes.map(printType).join(' & ')
  }
  throw new Error(`Unrecognized type: ${JSON.stringify(type, null, 2)}`)
}
