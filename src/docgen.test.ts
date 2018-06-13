import { SyntaxKind } from 'ts-simple-ast'
import { parseSource } from './test-helper'

import { findRoutes, parseRoute } from './docgen'

test('findRoutes', () => {
  const src = `
    export const foo = () => get<Foo>('/blah')
    export const blah = () => get<Blah>('/asdflkasdf')
    export const asdf = () => zap<Blah>('/asdflkasdf')
    export const asdf2 = () => put<Blah>('/asdflkasdf')
    const blah = () => get<Blah>('/asdflkasdf')
    `
  expect(findRoutes(parseSource(src)).map(d => d.print())).toMatchSnapshot()
})

test('parseRoute get', () => {
  const src = 'get<Foo>(`/blah/${asdf}`)'
  const call = parseSource(src).getDescendantsOfKind(
    SyntaxKind.CallExpression,
  )[0]
  const parsedRoute = parseRoute(call)
  expect(parsedRoute.responseType.getText()).toMatchSnapshot()
  expect(parsedRoute.method).toMatchSnapshot()
  expect(parsedRoute.url).toMatchSnapshot()
})

test('parseRoute put', () => {
  const src = 'put<Foo>(`/blah/${asdf}`, {name: "hello"})'
  const call = parseSource(src).getDescendantsOfKind(
    SyntaxKind.CallExpression,
  )[0]
  const parsedRoute = parseRoute(call)
  expect(parsedRoute.responseType.getText()).toMatchSnapshot()
  expect(parsedRoute.requestType.getText()).toMatchSnapshot()
  expect(parsedRoute.method).toMatchSnapshot()
  expect(parsedRoute.url).toMatchSnapshot()
})
