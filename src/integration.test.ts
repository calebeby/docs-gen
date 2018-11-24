import { run } from './runner'

test('type', () => {
  const input = `
interface BasicEventInfo {
  name: string // from TBA short name
  district?: string
  week?: number
  // UTC date
  startDate: string
  // UTC date
  endDate: string
  // Only if user is logged in
  starred?: boolean
  location: {
    lat: number
    lon: number
  }
}

// comment
/**
 * this is a comment on getEvents
 */
// another comment
export const getEvents = () => request<BasicEventInfo[]>('GET', 'events')

interface EventInfo extends BasicEventInfo {
  webcasts: {
    type: 'twitch' | 'youtube'
    url: string
  }
  location: {
    name: string
    lat: number
    lon: number
  }
}

export const getEventInfo = (eventKey: string) =>
  request<EventInfo>('GET', \`event/\${eventKey}/info\`)

interface Report {
  team: string
  stats: { [key: string]: Stat }
  notes: { [key: string]: string }
  eventKey: string
  matchKey: string
}

export const submitReport = (report: Report) =>
  request<{report: string}>(
    'PUT',
    \`events/\${eventKey}/matches/\${eventKey}_\${matchKey}/reports\`,
    {},
    report,
  )

interface Roles {
  isAdmin: boolean
  isVerified: boolean
}

interface EditableUser {
  username: string
  firstName: string
  lastName: string
  password: string
  roles: Roles
}

export const modifyUser = (userId: number, user: Partial<EditableUser>, filter: string, queryParam?: number) =>
  request<null>('PATCH', \`users/\${userId}\`, {queryParam, filter}, user)
`
  expect(run(input)).toMatchSnapshot()
})

export const modifyUser = (
  userId: number,
  user: Partial<EditableUser>,
  filter: string,
  queryParam?: number,
) => request<null>('PATCH', `users/${userId}`, { queryParam, filter }, user)
