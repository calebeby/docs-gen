import { parseSource } from './test-helper'
import { SyntaxKind } from 'ts-simple-ast'
import { parseType } from './parse-type'

const T = (s: string) =>
  parseSource(`type Foo = ${s}`)
    .getDescendantsOfKind(SyntaxKind.TypeAliasDeclaration)[0]
    .getType()

test('string literal', () => {
  expect(parseType(T("'hello'"))).toMatchSnapshot()
})
test('string', () => {
  expect(parseType(T('string'))).toMatchSnapshot()
})
test('number literal', () => {
  expect(parseType(T('4'))).toMatchSnapshot()
})
test('number', () => {
  expect(parseType(T('number'))).toMatchSnapshot()
})
test('any', () => {
  expect(parseType(T('any'))).toMatchSnapshot()
})
test('null', () => {
  expect(parseType(T('null'))).toMatchSnapshot()
})
test('undefined', () => {
  expect(parseType(T('undefined'))).toMatchSnapshot()
})
test('boolean literal', () => {
  expect(parseType(T('true'))).toMatchSnapshot()
})
test('boolean', () => {
  expect(parseType(T('boolean'))).toMatchSnapshot()
})

describe('object', () => {
  it('should parse correctly with comments', () => {
    expect(
      parseType(
        T(`{
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
      ),
    ).toMatchSnapshot()
  })
  it('should parse string index type', () => {
    expect(
      parseType(
        T(`{
          [key: string]: number
          foo: number
          bar: string
        }`),
      ),
    ).toMatchSnapshot()
  })
  it('should parse number index type', () => {
    expect(
      parseType(
        T(`{
          [key: number]: number
          foo: number
          bar: string
        }`),
      ),
    ).toMatchSnapshot()
  })
})

test('array', () => {
  expect(parseType(T(`number[]`))).toMatchSnapshot()
})
describe('union', () => {
  it('should parse a basic union', () => {
    expect(parseType(T(`(number|'hello')[]`))).toMatchSnapshot()
  })
  it('should parse a union with a boolean', () => {
    expect(parseType(T(`(number|boolean)[]`))).toMatchSnapshot()
  })
})
describe('intersection', () => {
  test('object', () => {
    expect(
      parseType(
        T(`
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
      ),
    ).toMatchSnapshot()
  })
  test('primitive', () => {
    expect(parseType(T(`number & 'hello'`))).toMatchSnapshot()
  })
})
