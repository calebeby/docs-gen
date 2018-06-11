import { SourceFile, SyntaxKind, CallExpression, Type } from 'ts-simple-ast'

type HTTPMethods = 'get' | 'put'
const acceptedMethods = ['get', 'put']

export const isHttpMethod = (call: CallExpression) =>
  call.getTypeArguments().length === 1 &&
  call
    .getChildrenOfKind(SyntaxKind.Identifier)
    .some(id => acceptedMethods.includes(id.getText()))

/*
 * Given a source file, find all exported arrow functions that include a call to get() put() or post()
 */
export const findRoutes = (file: SourceFile) =>
  file
    .getExportedDeclarations()
    .reduce<CallExpression[]>((routes, declaration) => {
      declaration
        .getChildrenOfKind(SyntaxKind.ArrowFunction)
        .forEach(arrowFunc => {
          const call = arrowFunc
            .getDescendantsOfKind(SyntaxKind.CallExpression)
            .find(isHttpMethod)
          if (call !== undefined) {
            routes.push(call)
          }
        })
      return routes
    }, [])

interface HTTPMethod {
  url: string
  responseType: Type
  method: HTTPMethods
}

export interface Get extends HTTPMethod {
  method: 'get'
}

export interface Put extends HTTPMethod {
  requestType: Type
  method: 'put'
}

export type Route = Get | Put

export const parseRoute = (call: CallExpression): Route => {
  const method = call
    .getChildrenOfKind(SyntaxKind.Identifier)
    .find(id => acceptedMethods.includes(id.getText()))
    .print()
  const responseType = call.getTypeArguments()[0].getType()
  const url = call
    .getArguments()[0]
    .getText()
    .replace(/`/g, '')
    .replace(/'/g, '')
    .replace(/\${/g, '{')
  if (method === 'get') {
    return { responseType, method, url }
  } else if (method === 'put') {
    const requestType = call.getArguments()[1].getType()
    return { responseType, requestType, method, url }
  }
}
