import {
  SourceFile,
  SyntaxKind,
  CallExpression,
  ts,
  Node,
  TypeNode,
} from 'ts-simple-ast'

type HTTPMethod = 'GET' | 'PUT' | 'POST' | 'DELETE' | 'PATCH'

export interface Route {
  url: string
  requestNode?: Node
  responseNode?: Node
  method: HTTPMethod
  comment?: string
}

export const isCallHttpMethod = (call: CallExpression) => {
  const args = call.getArguments()
  return (
    args.length >= 2 &&
    call
      .getChildrenOfKind(SyntaxKind.Identifier)
      .some(id => id.getText() === 'request') &&
    args[0].getType().isStringLiteral() &&
    (args[1].getType().isString() || args[1].getType().isStringLiteral())
  )
}

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

const removeQuotes = (s: string) =>
  s.replace(/^['`"]/, '').replace(/['`"]$/, '')

export const parseRoute = (call: CallExpression): Route | undefined => {
  const method = removeQuotes(call.getArguments()[0].getText()) as HTTPMethod
  const typeArgs = call.getTypeArguments() as (
    | TypeNode<ts.TypeNode>
    | undefined)[]
  const args = call.getArguments() as (Node<ts.Node> | undefined)[]
  const postProcessArg = args[3] || args[2]
  const responseNode =
    typeArgs[0] ||
    (postProcessArg &&
      postProcessArg.getFirstDescendantByKindOrThrow(SyntaxKind.Parameter))

  // if it has a res type param, it doesn't have a postprocess
  const requestNode = args.length === 4 || typeArgs[0] ? args[2] : undefined
  const url = removeQuotes(call.getArguments()[1].getText()).replace(
    /\${/g,
    '{',
  )
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
