import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const serverDirectory = fileURLToPath(new URL('../dist/server/', import.meta.url))
const serverEntry = new URL('../dist/server/index.js', import.meta.url)

const workerSource = `export default {
  async fetch(request, env) {
    const response = await env.ASSETS.fetch(request)
    const acceptsHtml = (request.headers.get('accept') ?? '').includes('text/html')

    if (response.status !== 404 || request.method !== 'GET' || !acceptsHtml) {
      return response
    }

    const indexUrl = new URL(request.url)
    indexUrl.pathname = '/index.html'
    return env.ASSETS.fetch(new Request(indexUrl, request))
  },
}
`

await mkdir(serverDirectory, { recursive: true })
await writeFile(serverEntry, workerSource, 'utf8')
