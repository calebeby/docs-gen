import { Type, SymbolFlags, Symbol, ts, Node } from 'ts-simple-ast'

export enum NodeTypes {
  Literal = 0,
  Base = 1,
  Object = 4,
  Array = 5,
  Union = 6,
  Intersection = 7,
}

const parseKeyVal = (prop: Symbol, node: Node) => {
  const value = parseType(prop.getTypeAtLocation(node), node)
  const optional = prop.hasFlags(SymbolFlags.Optional)
  const parsed: {
    key: string
    optional: boolean
    value: ParsedType
    comment?: string
  } = {
    key: prop.getName(),
    optional,
    value:
      optional && value.type === NodeTypes.Union
        ? {
            ...value,
            // if it is optional exclude undefined from the type
            subTypes: value.subTypes.filter(
              sub =>
                !(sub.type === NodeTypes.Base && sub.value === 'undefined'),
            ),
          }
        : value,
  }
  const declaration = prop.getDeclarations()[0]
  if (declaration) {
    const commentRange = declaration.getLeadingCommentRanges()
    if (commentRange.length > 0) {
      parsed.comment = commentRange[0].getText().trim()
    }
  }
  return parsed
}

const parseObject = (t: Type, node: Node) => {
  const obj: ParsedObject = {
    type: NodeTypes.Object,
    keys: t.getProperties().map(p => parseKeyVal(p, node)),
  }
  const stringIndexType = t.getStringIndexType()
  const numberIndexType = t.getNumberIndexType()
  if (stringIndexType !== undefined) {
    obj.stringIndex = parseType(stringIndexType, node)
  }
  if (numberIndexType !== undefined) {
    obj.numberIndex = parseType(numberIndexType, node)
  }
  return obj
}

const parseArray = (t: Type, node: Node) =>
  parseType(t.getArrayType() as Type<ts.Type>, node)

interface ParsedTrue extends ParsedLiteral {
  value: 'true'
}

interface ParsedFalse extends ParsedLiteral {
  value: 'false'
}

const isTypeLiteral = (t: ParsedType): t is ParsedLiteral =>
  t.type === NodeTypes.Literal
const isTrueType = (t: ParsedType): t is ParsedTrue =>
  isTypeLiteral(t) && t.value === 'true'
const isFalseType = (t: ParsedType): t is ParsedFalse =>
  isTypeLiteral(t) && t.value === 'false'

const parseUnion = (t: Type, node: Node) => {
  const types = t.getUnionTypes().map(t => parseType(t, node))
  if (types.find(isTrueType) && types.find(isFalseType)) {
    return types
      .filter(type => !isTrueType(type) && !isFalseType(type))
      .concat({ type: NodeTypes.Base, value: 'boolean' })
  }
  return types
}

interface ParsedLiteral {
  type: NodeTypes.Literal
  value: string
}
interface ParsedBaseType {
  type: NodeTypes.Base
  value: 'string' | 'number' | 'boolean' | 'any' | 'null' | 'undefined'
}
export type ParsedType =
  | ParsedLiteral
  | ParsedBaseType
  | ParsedArray
  | ParsedUnion
  | ParsedObject
  | ParsedIntersection
interface ParsedArray {
  type: NodeTypes.Array
  subType: ParsedType
}
interface ParsedUnion {
  type: NodeTypes.Union
  subTypes: ParsedType[]
}
interface ParsedObjectKey {
  key: string
  optional: boolean
  comment?: string
  value: ParsedType
}
interface ParsedObject {
  stringIndex?: ParsedType
  numberIndex?: ParsedType
  type: NodeTypes.Object
  keys: ParsedObjectKey[]
}
interface ParsedIntersection {
  type: NodeTypes.Intersection
  subTypes: ParsedType[]
}

const isObject = (t: Type<ts.Type>): boolean => {
  if (t.isArray()) return false
  if (t.isObject()) return true
  const def = t.getDefault()
  return def ? isObject(def) : false
}

const parseIntersection = (t: Type, node: Node): ParsedType => {
  const subTypes = t.getIntersectionTypes()
  if (subTypes.every(isObject)) {
    const subObjects = subTypes.map(obj => parseObject(obj, node))
    const subKeys = subObjects.reduce<{ [key: string]: ParsedObjectKey }>(
      (acc, subObject) => {
        subObject.keys.forEach(k => (acc[k.key] = k))
        return acc
      },
      {},
    )
    return Object.assign({}, ...subObjects, {
      keys: Object.entries(subKeys).map(([, key]) => key),
    })
  }
  return {
    type: NodeTypes.Intersection,
    subTypes: subTypes.map(t => parseType(t, node)),
  }
}

export const parseType = (t: Type, node: Node): ParsedType => {
  if (node === undefined) {
    throw new Error('its bad' + t.getText())
  }
  // console.log(t.getText(), node.getText())
  if (t.isLiteral()) return { type: NodeTypes.Literal, value: t.getText() }
  if (t.isString()) return { type: NodeTypes.Base, value: 'string' }
  if (t.isNumber()) return { type: NodeTypes.Base, value: 'number' }
  if (t.isBoolean()) return { type: NodeTypes.Base, value: 'boolean' }
  if (t.isArray())
    return { type: NodeTypes.Array, subType: parseArray(t, node) }
  if (t.isUnion())
    return { type: NodeTypes.Union, subTypes: parseUnion(t, node) }
  if (t.isUndefined()) return { type: NodeTypes.Base, value: 'undefined' }
  if (t.isNull()) return { type: NodeTypes.Base, value: 'null' }
  if (t.getText() === 'any') return { type: NodeTypes.Base, value: 'any' }
  if (t.isIntersection()) return parseIntersection(t, node)
  if (isObject(t)) return parseObject(t, node)

  throw new Error(`Unrecognized type: ${t.getText()}`)
}
