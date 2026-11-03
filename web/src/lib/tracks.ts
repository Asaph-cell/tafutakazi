import data from '../tracks/tracks.json'

// Skill tracks: what a job needs, free places to learn it, and interview questions.
// The text lives in tracks/tracks.json so the Cloudflare functions can read the titles too.
export type Track = {
  slug: string
  role: string
  name: string
  summary: string
  skills: [string, string][]
  learn: [string, string, string][]
  questions: [string, string][]
}

export const TRACKS = data as unknown as Track[]

export const trackBySlug = (slug: string | undefined) => TRACKS.find((t) => t.slug === slug)

export const trackForRole = (role: string | undefined) =>
  TRACKS.find((t) => t.role.toLowerCase() === (role ?? '').toLowerCase())

// Every job interview comes back to these.
export const COMMON_QUESTIONS: [string, string][] = [
  ['Tell me about yourself.', 'One minute: what you studied, what you can do, and why this job. Skip your life story.'],
  ['Why do you want to work here?', 'Name something real about the company, then link it to what you want to do.'],
  ['You have no work experience. Why should we hire you?', 'Show proof instead: a task, a project or something you organised.'],
  ['Tell me about a time you failed.', 'Choose a real failure. Spend most of your answer on what you changed afterwards.'],
  ['What is your biggest strength?', 'Name one, then give an example that proves it.'],
  ['What are your salary expectations?', 'Look up the usual range first. Give a range and say you are open to discussing it.'],
  ['Where do you see yourself in five years?', 'Show that you want to grow in this field. You do not need a perfect plan.'],
  ['Do you have any questions for us?', 'Always ask one or two, such as what a good first three months looks like.'],
]
