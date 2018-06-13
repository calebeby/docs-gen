import Project, { Type } from 'ts-simple-ast'
import { findRoutes, parseRoute, Route } from './docgen'
import { format } from './format'
import { printType } from './print-type'
import { parseType } from './parse-type'

interface RouteCollection {
  url: string
  routes: Route[]
}

const printFormatType = (t: Type) =>
  `
\`\`\`ts
${format(printType(parseType(t)))}\`\`\`
`

const printRoute = (route: Route) => {
  let text = `
## \`${route.method.toUpperCase()}\`
`
  if (route.requestType) {
    text += `
### Request
${printFormatType(route.requestType)}\n`
  }
  if ('responseType' in route) {
    text += `
### Response
${printFormatType(route.responseType)}`
  }
  return text
}

const printRouteCollection = (routeCollection: RouteCollection) =>
  `# \`${routeCollection.url}\`
${routeCollection.routes.map(printRoute).join('\n')}`

const mergeUrls = (routes: RouteCollection[] = [], currentRoute: Route) => {
  const matchingValue = routes.find(u => u.url === currentRoute.url)
  if (matchingValue === undefined) {
    routes.push({ url: currentRoute.url, routes: [currentRoute] })
  } else {
    matchingValue.routes.push(currentRoute)
  }
  return routes
}

export const run = (input: string) => {
  const project = new Project()
  const file = project.createSourceFile('file.ts', input)
  return findRoutes(file)
    .map(parseRoute)
    .filter((r): r is Route => r !== undefined)
    .reduce<RouteCollection[]>(mergeUrls, [])
    .map(printRouteCollection)
    .sort()
    .join('\n')
}
