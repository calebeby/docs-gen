import {
  SourceFile,
  SyntaxKind,
  CallExpression,
  Type,
  ts,
  Node,
  TypeNode,
} from 'ts-simple-ast'

type HTTPMethod = 'get' | 'put' | 'post' | 'delete' | 'patch'
const acceptedMethods = [
  'get',
  'put',
  'post',
  'delete',
  'patch',
  'getRequest',
  'putRequest',
  'postRequest',
  'deleteRequest',
  'patchRequest',
]

export interface Route {
  url: string
  requestNode?: Node
  responseNode?: Node
  method: HTTPMethod
  comment?: string
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
    .map(id => id.getText().replace('Request', ''))
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
  const responseNode = responseArg
  const requestNode = requestArg
  const url = call
    .getArguments()[0]
    .getText()
    .replace(/`/g, '')
    .replace(/'/g, '')
    .replace(/\${/g, '{')
  let comment = ''
  const parentExport = call.getFirstAncestorByKind(SyntaxKind.VariableStatement)
  if (parentExport) {
    const leadingComments = parentExport.getLeadingCommentRanges()
    comment = leadingComments
      .map(c =>
        c
          .getText()
          .replace(/^\/\//, '')
          .replace(/^\/\*\*/, '')
          .replace(/^\/\*/, '')
          .replace(/\*\/$/, '')
          .trim(),
      )
      .join('\n')
      .split('\n')
      .map(s =>
        s
          .trim()
          .replace(/^\*/, '')
          .trim(),
      )
      .filter(s => s !== '')
      .join('\n')
  }
  return { responseNode, requestNode, method, url, comment }
}
