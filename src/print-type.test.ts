import { printType } from './print-type'
import { NodeTypes } from './parse-type'

test('literal', () => {
  expect(printType({ type: NodeTypes.Literal, value: 'hello' })).toEqual(
    'hello',
  )
  expect(printType({ type: NodeTypes.Literal, value: '100' })).toEqual('100')
  expect(printType({ type: NodeTypes.Literal, value: 'false' })).toEqual(
    'false',
  )
})

test('number', () => {
  expect(printType({ type: NodeTypes.Base, value: 'number' })).toEqual('number')
})

test('any', () => {
  expect(printType({ type: NodeTypes.Base, value: 'any' })).toEqual('any')
})

test('boolean', () => {
  expect(
    printType({
      type: NodeTypes.Base,
      value: 'boolean',
    }),
  ).toEqual('boolean')
})

test('string', () => {
  expect(printType({ type: NodeTypes.Base, value: 'string' })).toEqual('string')
})

describe('array', () => {
  it('should print without parens', () => {
    expect(
      printType({
        type: NodeTypes.Array,
        subType: { type: NodeTypes.Base, value: 'string' },
      }),
    ).toEqual('string[]')
    expect(
      printType({
        type: NodeTypes.Array,
        subType: {
          type: NodeTypes.Array,
          subType: { type: NodeTypes.Base, value: 'string' },
        },
      }),
    ).toEqual('string[][]')
    expect(
      printType({
        type: NodeTypes.Array,
        subType: {
          type: NodeTypes.Object,
          keys: [
            {
              key: 'foo',
              optional: false,
              value: { type: NodeTypes.Base, value: 'string' },
            },
          ],
        },
      }),
    ).toEqual('{\nfoo: string\n}[]')
  })
  it('should print with parens', () => {
    expect(
      printType({
        type: NodeTypes.Array,
        subType: {
          type: NodeTypes.Union,
          subTypes: [
            { type: NodeTypes.Base, value: 'string' },
            { type: NodeTypes.Base, value: 'number' },
          ],
        },
      }),
    ).toEqual('(string | number)[]')
    expect(
      printType({
        type: NodeTypes.Array,
        subType: {
          type: NodeTypes.Intersection,
          subTypes: [
            { type: NodeTypes.Base, value: 'string' },
            { type: NodeTypes.Base, value: 'number' },
          ],
        },
      }),
    ).toEqual('(string & number)[]')
  })
})

test('intersection', () => {
  expect(
    printType({
      type: NodeTypes.Intersection,
      subTypes: [
        { type: NodeTypes.Base, value: 'string' },
        { type: NodeTypes.Base, value: 'boolean' },
        { type: NodeTypes.Literal, value: '"hello"' },
      ],
    }),
  ).toEqual('string & boolean & "hello"')
})

test('union', () => {
  expect(
    printType({
      type: NodeTypes.Union,
      subTypes: [
        { type: NodeTypes.Literal, value: '"hello"' },
        { type: NodeTypes.Literal, value: '"goodbye"' },
        { type: NodeTypes.Literal, value: '3' },
      ],
    }),
  ).toEqual('"hello" | "goodbye" | 3')
})

test('object', () => {
  expect(
    printType({
      type: NodeTypes.Object,
      stringIndex: {
        type: NodeTypes.Union,
        subTypes: [
          { type: NodeTypes.Base, value: 'number' },
          { type: NodeTypes.Base, value: 'string' },
        ],
      },
      numberIndex: {
        type: NodeTypes.Union,
        subTypes: [
          { type: NodeTypes.Literal, value: '"hello"' },
          { type: NodeTypes.Literal, value: '"goodbye"' },
        ],
      },
      keys: [
        {
          key: 'hello',
          optional: true,
          comment: '// hi',
          value: {
            type: NodeTypes.Union,
            subTypes: [
              { type: NodeTypes.Literal, value: '"hello"' },
              { type: NodeTypes.Literal, value: '40' },
            ],
          },
        },
        {
          key: 'goodbye',
          comment: '/* good\nbye */',
          optional: false,
          value: {
            type: NodeTypes.Base,
            value: 'string',
          },
        },
      ],
    }),
  ).toEqual(`{
[key: string]: number | string,
[key: number]: "hello" | "goodbye",
// hi
hello?: "hello" | 40,
/* good
bye */
goodbye: string
}`)
})
