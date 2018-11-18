import { SyntaxKind } from 'ts-simple-ast'
import { parseSource } from './test-helper'

import { findRoutes, parseRoute } from './docgen'

test('findRoutes', () => {
  const src = `
    export const foo = () => request<Foo>('GET', '/blah')
    export const blah = () => request<Blah>('PUT', '/asdflkasdf')
    export const asdf = () => request<Blah>('POST', '/asdflkasdf')
    export const asdf2 = () => request<Blah>('DELETE', '/asdflkasdf')
    export const asdf3 = () => request<Blah>('POST', '/something')
    const blah = () => request<Blah>('POST', '/asdflkasdf')
    `
  expect(findRoutes(parseSource(src)).map(d => d.print()))
    .toMatchInlineSnapshot(`
Array [
  "request<Foo>('GET', '/blah')",
  "request<Blah>('PUT', '/asdflkasdf')",
  "request<Blah>('POST', '/asdflkasdf')",
  "request<Blah>('DELETE', '/asdflkasdf')",
  "request<Blah>('POST', '/something')",
]
`)
})

test('parseRoute with comment', () => {
  const src = `
    /**
     * this is a leading comment
     */
    // another leading comment
    export const asdf3 = () => request<Blah>('GET', '/something')
    `
  expect(parseRoute(findRoutes(parseSource(src))[0]).comment)
    .toMatchInlineSnapshot(`
"this is a leading comment
another leading comment"
`)
})

test('parseRoute get', () => {
  const src = `
request<{name: string}>('GET', \`/blah/\${asdf}\`)
`
  const call = parseSource(src).getDescendantsOfKind(
    SyntaxKind.CallExpression,
  )[0]
  const parsedRoute = parseRoute(call)
  expect(parsedRoute.responseNode.getType().getText()).toMatchInlineSnapshot(
    `"{ name: string; }"`,
  )
  expect(parsedRoute.method).toMatchInlineSnapshot(`"GET"`)
  expect(parsedRoute.url).toMatchInlineSnapshot(`"/blah/{asdf}"`)
})

test('parseRoute put', () => {
  const src =
    'request("PUT", `/blah/${asdf}`, (d: {age: number}) => d, {name: "hello"})' // eslint-disable-line no-template-curly-in-string
  const call = parseSource(src).getDescendantsOfKind(
    SyntaxKind.CallExpression,
  )[0]
  const parsedRoute = parseRoute(call)
  expect(parsedRoute.responseNode.getType().getText()).toMatchInlineSnapshot(
    `"{ age: number; }"`,
  )
  expect(parsedRoute.requestNode.getType().getText()).toMatchInlineSnapshot(
    `"{ name: string; }"`,
  )
  expect(parsedRoute.method).toMatchInlineSnapshot(`"PUT"`)
  expect(parsedRoute.url).toMatchInlineSnapshot(`"/blah/{asdf}"`)
})

test('parseRoute deleteRequest', () => {
  const src = 'request<boolean>("DELETE", `/blah/${asdf}`)' // eslint-disable-line no-template-curly-in-string
  const call = parseSource(src).getDescendantsOfKind(
    SyntaxKind.CallExpression,
  )[0]
  const parsedRoute = parseRoute(call)
  expect(parsedRoute.responseNode.getType().getText()).toMatchInlineSnapshot(
    `"boolean"`,
  )
  expect(parsedRoute.method).toMatchInlineSnapshot(`"DELETE"`)
  expect(parsedRoute.url).toMatchInlineSnapshot(`"/blah/{asdf}"`)
})
