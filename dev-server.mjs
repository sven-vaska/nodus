import { createServer } from 'vite'
const root = '/Users/svenvaska/Documents/00_Projects/CRM/nodus'
process.chdir(root)
const server = await createServer({ root, server: { port: parseInt(process.env.PORT || '5178') } })
await server.listen()
server.printUrls()
