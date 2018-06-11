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

export const getEvents = () => get<BasicEventInfo[]>('/events')

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
  get<EventInfo>(\`/event/\${eventKey}/info\`)

interface Report {
  team: string
  stats: { [key: string]: Stat }
  notes: { [key: string]: string }
  eventKey: string
  matchKey: string
}

export const submitReport = (report: Report) =>
  put(
    \`events/\${eventKey}/matches/\${eventKey}_\${matchKey}/reports\`,
    report
  )
`
  expect(run(input)).toMatchSnapshot()
})
