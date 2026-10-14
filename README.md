# Tafutakazi

Fresh graduates in Kenya do short tasks set by real companies, explain their work on video,
and get seen by people who are hiring.

- `web/` — the website (React, Vite, TypeScript, Tailwind)
- `supabase/migrations/` — database tables, privacy rules and storage
- `supabase/tests/` — checks that the privacy rules hold (`npm install && npm test`)
- `brand/` — logo and favicon
- `project/` — wireframes

## Run locally

1. `cd web && npm install`
2. Copy `web/.env.example` to `web/.env.local` and fill in the Supabase URL and anon key.
3. `npm run dev` and open http://localhost:5181
