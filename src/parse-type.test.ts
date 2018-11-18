import { parseSource } from './test-helper'
import { SyntaxKind } from 'ts-simple-ast'
import { parseType } from './parse-type'

const parseTypeFromString = (s: string) => {
  const declaration = parseSource(`type Foo = ${s}`).getDescendantsOfKind(
    SyntaxKind.TypeAliasDeclaration,
  )[0]
  return parseType(declaration.getType(), declaration)
}

test('string literal', () => {
  expect(parseTypeFromString("'hello'")).toMatchSnapshot()
})
test('string', () => {
  expect(parseTypeFromString('string')).toMatchSnapshot()
})
test('number literal', () => {
  expect(parseTypeFromString('4')).toMatchSnapshot()
})
test('number', () => {
  expect(parseTypeFromString('number')).toMatchSnapshot()
})
test('any', () => {
  expect(parseTypeFromString('any')).toMatchSnapshot()
})
test('null', () => {
  expect(parseTypeFromString('null')).toMatchSnapshot()
})
test('undefined', () => {
  expect(parseTypeFromString('undefined')).toMatchSnapshot()
})
test('boolean literal', () => {
  expect(parseTypeFromString('true')).toMatchSnapshot()
})
test('boolean', () => {
  expect(parseTypeFromString('boolean')).toMatchSnapshot()
})

describe('object', () => {
  it('should parse correctly with comments', () => {
    expect(
      parseTypeFromString(`{
        foo: number
        /* bar is
        a really
        long comment */
        bar: 10
        /* comment here */
        baz?: 'hello'
        // UTC
        date: string
      }`),
    ).toMatchSnapshot()
  })
  it('should parse string index type', () => {
    expect(
      parseTypeFromString(`{
          [key: string]: number
          foo: number
          bar: string
        }`),
    ).toMatchSnapshot()
  })
  it('should parse number index type', () => {
    expect(
      parseTypeFromString(`{
          [key: number]: number
          foo: number
          bar: string
        }`),
    ).toMatchSnapshot()
  })
  it('should parse generic/mapped type', () => {
    expect(
      parseTypeFromString(`Partial<{
      hello: string
      goodbye: number
    }>`),
    ).toMatchSnapshot()
    expect(
      parseTypeFromString(`Pick<{
      hello: string
      goodbye: number
    },
    "hello">`),
    ).toMatchSnapshot()
  })
})

test('array', () => {
  expect(parseTypeFromString(`number[]`)).toMatchSnapshot()
})
describe('union', () => {
  it('should parse a basic union', () => {
    expect(parseTypeFromString(`(number|'hello')[]`)).toMatchSnapshot()
  })
  it('should parse a union with a boolean', () => {
    expect(parseTypeFromString(`(number|boolean)[]`)).toMatchSnapshot()
  })
})
describe('intersection', () => {
  test('object', () => {
    expect(
      parseTypeFromString(`
{
  [key: number]: string
  foo: string
  bar: string
} &
{
  /* hello */
  bar?: number
  [key: number]: number
}`),
    ).toMatchSnapshot()
  })
  test('primitive', () => {
    expect(parseTypeFromString(`number & 'hello'`)).toMatchSnapshot()
  })
})

test('broken thing', () => {
  expect(
    parseTypeFromString(`
Partial<{
  username: string
  firstName: string
  lastName: string
  roles: Roles
}>
interface Roles {
  isAdmin: boolean
  isVerified: boolean
}
`),
  ).toMatchInlineSnapshot(`
Object {
  "keys": Array [
    Object {
      "key": "username",
      "optional": true,
      "value": Object {
        "type": 1,
        "value": "string",
      },
    },
    Object {
      "key": "firstName",
      "optional": true,
      "value": Object {
        "type": 1,
        "value": "string",
      },
    },
    Object {
      "key": "lastName",
      "optional": true,
      "value": Object {
        "type": 1,
        "value": "string",
      },
    },
    Object {
      "key": "roles",
      "optional": true,
      "value": Object {
        "keys": Array [
          Object {
            "key": "isAdmin",
            "optional": false,
            "value": Object {
              "type": 1,
              "value": "boolean",
            },
          },
          Object {
            "key": "isVerified",
            "optional": false,
            "value": Object {
              "type": 1,
              "value": "boolean",
            },
          },
        ],
        "type": 4,
      },
    },
  ],
  "type": 4,
}
`)
})
