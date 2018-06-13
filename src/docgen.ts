import {
  SourceFile,
  SyntaxKind,
  CallExpression,
  Type,
  ts,
  Node,
  TypeNode,
} from 'ts-simple-ast'

type HTTPMethod = 'get' | 'put' | 'post' | 'delete'
const acceptedMethods = ['get', 'put', 'post', 'delete']

export interface Route {
  url: string
  requestType?: Type
  responseType?: Type
  method: HTTPMethod
}

export const isCallHttpMethod = (call: CallExpression) =>
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
            .find(isCallHttpMethod)
          if (call !== undefined) {
            routes.push(call)
          }
        })
      return routes
    }, [])

const isHttpMethod = (s: string): s is HTTPMethod => acceptedMethods.includes(s)

export const parseRoute = (call: CallExpression): Route | undefined => {
  const method = call
    .getChildrenOfKind(SyntaxKind.Identifier)
    .map(id => id.getText())
    .find(id => acceptedMethods.includes(id))
  if (method === undefined || !isHttpMethod(method)) {
    return
  }
  const typeArgs = call.getTypeArguments() as (
    | TypeNode<ts.TypeNode>
    | undefined)[]
  const args = call.getArguments() as (Node<ts.Node> | undefined)[]
  const responseArg = typeArgs[0]
  const requestArg = args[1]
  const responseType = responseArg && responseArg.getType()
  const requestType = requestArg && requestArg.getType()
  const url = call
    .getArguments()[0]
    .getText()
    .replace(/`/g, '')
    .replace(/'/g, '')
    .replace(/\${/g, '{')
  return { responseType, requestType, method, url }
}
