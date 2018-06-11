import { Type, SymbolFlags, SyntaxKind, Symbol } from 'ts-simple-ast'

export enum NodeTypes {
  Literal,
  Base,
  Object = 4,
  Array,
  Union,
  Intersection,
}

const parseKeyVal = (prop: Symbol) => {
  const parsed: {
    key: string
    optional: boolean
    value: ParsedType
    comment?: string
  } = {
    key: prop.getName(),
    optional: prop.hasFlags(SymbolFlags.Optional),
    value: parseType(prop.getValueDeclaration().getType()),
  }
  const declaration = prop.getDeclarations()[0]
  const commentRange = declaration.getLeadingCommentRanges()
  if (commentRange.length > 0) {
    parsed.comment = commentRange[0].getText().trim()
  }
  return parsed
}

const parseObject = (t: Type) => {
  const obj: ParsedObject = {
    type: NodeTypes.Object,
    keys: t.getProperties().map(parseKeyVal),
  }
  const stringIndexType = t.getStringIndexType()
  const numberIndexType = t.getNumberIndexType()
  if (stringIndexType !== undefined) {
    obj.stringIndex = parseType(stringIndexType)
  }
  if (numberIndexType !== undefined) {
    obj.numberIndex = parseType(numberIndexType)
  }
  return obj
}

const parseArray = (t: Type) => parseType(t.getArrayType())

const parseUnion = (t: Type) => t.getUnionTypes().map(parseType)

interface ParsedLiteral {
  type: NodeTypes.Literal
  value: string
}
interface ParsedBaseType {
  type: NodeTypes.Base
  value: 'string' | 'number' | 'boolean' | 'any'
}
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

export type ParsedType =
  | ParsedLiteral
  | ParsedBaseType
  | ParsedArray
  | ParsedUnion
  | ParsedObject
  | ParsedIntersection

export const parseType = (t: Type): ParsedType => {
  if (t.isLiteralType()) {
    return { type: NodeTypes.Literal, value: t.getText() }
  }
  if (t.isStringType()) {
    return { type: NodeTypes.Base, value: 'string' }
  }
  if (t.isNumberType()) {
    return { type: NodeTypes.Base, value: 'number' }
  }
  if (t.isBooleanType()) {
    return { type: NodeTypes.Base, value: 'boolean' }
  }
  if (t.isArrayType()) {
    return { type: NodeTypes.Array, subType: parseArray(t) }
  }
  if (t.isUnionType()) {
    return { type: NodeTypes.Union, subTypes: parseUnion(t) }
  }
  if (t.isObjectType()) {
    return parseObject(t)
  }
  if (t.isIntersectionType()) {
    const subTypes = t.getIntersectionTypes()
    if (subTypes.every(subType => subType.isObjectType())) {
      const subObjects = subTypes.map(obj => parseObject(obj))
      const subKeys = subObjects.reduce<{ [key: string]: ParsedObjectKey }>(
        (acc, subObject) => {
          subObject.keys.forEach(k => {
            acc[k.key] = k
          })
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
      subTypes: subTypes.map(parseType),
    }
  }
  if (t.getText() === 'any') {
    return { type: NodeTypes.Base, value: 'any' }
  }
  throw new Error(`Unrecognized type: ${t.getText()}`)
}
