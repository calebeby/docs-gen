import Project, { Node, CallExpression } from 'ts-simple-ast'
import { findRoutes, parseRoute, Route } from './docgen'
import { format } from './format'
import { printType } from './print-type'
import { parseType } from './parse-type'

interface RouteCollection {
  url: string
  routes: Route[]
}

const printFormatType = (n: Node) =>
  `
\`\`\`ts
${format(printType(parseType(n.getType(), n)))}\`\`\`
`

const printRoute = (route: Route) => {
  let text = `\n## \`${route.method.toUpperCase()}\`\n`
  if (route.comment) {
    text += '\n' + route.comment + '\n'
  }
  if (route.requestNode) {
    text += `
### Request
${printFormatType(route.requestNode)}\n`
  }
  if (route.responseNode) {
    text += `
### Response
${printFormatType(route.responseNode)}`
  }
  return text
}

const printRouteCollection = (routeCollection: RouteCollection) =>
  `# \`/${routeCollection.url}\`
${routeCollection.routes.map(printRoute).join('\n')}`

const printIndexEntry = (routeCollection: RouteCollection) => {
  const headerID = routeCollection.url.replace(/[{}/]/g, '').toLowerCase()
  return `- [\`/${routeCollection.url}\`](#${headerID})`
}

const mergeUrls = (routes: RouteCollection[] = [], currentRoute: Route) => {
  const matchingValue = routes.find(u => u.url === currentRoute.url)
  if (matchingValue === undefined) {
    routes.push({ url: currentRoute.url, routes: [currentRoute] })
  } else {
    matchingValue.routes.push(currentRoute)
  }
  return routes
}

export const printDocs = (input: CallExpression[]) => {
  const routeCollections = input
    .map(parseRoute)
    .filter((r): r is Route => r !== undefined)
    .reduce<RouteCollection[]>(mergeUrls, [])

  const index = routeCollections
    .map(printIndexEntry)
    .sort()
    .join('\n')

  const body = routeCollections
    .map(printRouteCollection)
    .sort()
    .join('\n')

  return '# Index\n\n' + index + '\n\n' + body
}

export const run = (input: string) => {
  const project = new Project()
  const file = project.createSourceFile('file.ts', input)
  return printDocs(findRoutes(file))
}
