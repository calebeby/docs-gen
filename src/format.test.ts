import { format } from './format'

test('format', () => {
  expect(
    format(
      '{ hello?: "hello" | 40, goodbye: {data: ((string | false | {name: "hi" | "bye"})[])}[] }',
    ),
  ).toMatchSnapshot()
})
