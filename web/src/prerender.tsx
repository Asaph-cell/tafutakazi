// Build-time rendering of the public pages, for crawlers that don't run JavaScript (most AI crawlers).
// scripts/prerender.mjs calls render() for each public address after `vite build --ssr`.
// Nothing here runs in the browser.
import { renderToString } from 'react-dom/server'
import { prerenderToNodeStream } from 'react-dom/static'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import { AuthProvider } from './lib/auth'

const page = (path: string) => (
  <QueryClientProvider client={new QueryClient()}>
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </MemoryRouter>
  </QueryClientProvider>
)

// Pages and blog bodies load lazily. A first pass with prerender waits until all of them have loaded;
// then renderToString writes the page with everything in place (prerender streams large parts to the end).
export async function render(path: string): Promise<string> {
  const { prelude } = await prerenderToNodeStream(page(path))
  // A Node stream at runtime; the shared types describe the browser version.
  for await (const chunk of prelude as unknown as AsyncIterable<unknown>) void chunk
  return renderToString(page(path))
}
