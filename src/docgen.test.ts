import { SyntaxKind } from 'ts-simple-ast'
import { parseSource } from './test-helper'

import { findRoutes, parseRoute } from './docgen'

test('findRoutes', () => {
  const src = `
    export const foo = () => get<Foo>('/blah')
    export const blah = () => get<Blah>('/asdflkasdf')
    export const asdf = () => zap<Blah>('/asdflkasdf')
    export const asdf2 = () => put<Blah>('/asdflkasdf')
    export const asdf3 = () => putRequest<Blah>('/something')
    const blah = () => get<Blah>('/asdflkasdf')
    `
  expect(findRoutes(parseSource(src)).map(d => d.print())).toMatchSnapshot()
})

test('parseRoute with comment', () => {
  const src = `
    /**
     * this is a leading comment
     */
    // another leading comment
    export const asdf3 = () => putRequest<Blah>('/something')
    `
  expect(parseRoute(findRoutes(parseSource(src))[0]).comment).toMatchSnapshot()
})

test('parseRoute get', () => {
  const src = `
get<Foo>(\`/blah/\${asdf}\`)
`
  const call = parseSource(src).getDescendantsOfKind(
    SyntaxKind.CallExpression,
  )[0]
  const parsedRoute = parseRoute(call)
  expect(parsedRoute.responseNode.getType().getText()).toMatchSnapshot()
  expect(parsedRoute.method).toMatchSnapshot()
  expect(parsedRoute.url).toMatchSnapshot()
})

test('parseRoute put', () => {
  const src = 'put<Foo>(`/blah/${asdf}`, {name: "hello"})'
  const call = parseSource(src).getDescendantsOfKind(
    SyntaxKind.CallExpression,
  )[0]
  const parsedRoute = parseRoute(call)
  expect(parsedRoute.responseNode.getType().getText()).toMatchSnapshot()
  expect(parsedRoute.requestNode.getType().getText()).toMatchSnapshot()
  expect(parsedRoute.method).toMatchSnapshot()
  expect(parsedRoute.url).toMatchSnapshot()
})

test('parseRoute deleteRequest', () => {
  const src = 'deleteRequest<boolean>(`/blah/${asdf}`)'
  const call = parseSource(src).getDescendantsOfKind(
    SyntaxKind.CallExpression,
  )[0]
  const parsedRoute = parseRoute(call)
  expect(parsedRoute.responseNode.getType().getText()).toMatchSnapshot()
  expect(parsedRoute.method).toMatchSnapshot()
  expect(parsedRoute.url).toMatchSnapshot()
})
