#!/usr/bin/env node
// Nodus CRM MCP server — stdio JSON-RPC, zero dependencies.
// Talks straight to Supabase PostgREST so no npm install is needed.
//
// Required env:
//   SUPABASE_URL              e.g. https://jphmelqgdorzqnxfezzc.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY service-role key (Supabase dashboard → Settings → API)
//   NODUS_WORKSPACE_ID        workspace uuid the tools operate in
//
// The service-role key bypasses RLS, so this server must only run locally
// on a trusted machine. Every query is still hard-scoped to the configured
// workspace so a stray call can't touch anything else.

const SUPABASE_URL = process.env.SUPABASE_URL
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const WS = process.env.NODUS_WORKSPACE_ID

if (!SUPABASE_URL || !KEY || !WS) {
  console.error('Missing env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, NODUS_WORKSPACE_ID')
  process.exit(1)
}

const REST = `${SUPABASE_URL}/rest/v1`

async function rest(path, { method = 'GET', body, headers = {} } = {}) {
  const res = await fetch(`${REST}/${path}`, {
    method,
    headers: {
      apikey: KEY,
      Authorization: `Bearer ${KEY}`,
      'Content-Type': 'application/json',
      Prefer: method === 'GET' ? 'count=none' : 'return=representation',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${text}`)
  return text ? JSON.parse(text) : null
}

const enc = encodeURIComponent

// ---- company resolution -------------------------------------------------

async function findCompanies(query) {
  return rest(`companies?workspace_id=eq.${WS}&deleted_at=is.null&name=ilike.${enc('*' + query + '*')}&select=id,name,status,follow_up,last_contact,users_count,county,www&order=name&limit=20`)
}

async function resolveCompany(nameOrId) {
  const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (uuidRe.test(nameOrId)) {
    const rows = await rest(`companies?id=eq.${nameOrId}&workspace_id=eq.${WS}&select=id,name,status`)
    if (!rows.length) throw new Error(`No company with id ${nameOrId} in this workspace`)
    return rows[0]
  }
  const matches = await findCompanies(nameOrId)
  const exact = matches.find(c => c.name.toLowerCase() === nameOrId.toLowerCase())
  if (exact) return exact
  if (matches.length === 1) return matches[0]
  if (matches.length === 0) throw new Error(`No company matching "${nameOrId}"`)
  throw new Error(`Ambiguous company "${nameOrId}" — matches: ${matches.map(c => c.name).join(', ')}. Use the exact name or id.`)
}

// ---- tools ---------------------------------------------------------------

const ACTIVITY_TYPES = ['Call', 'Email', 'Follow-up', 'Meeting', 'Demo', 'Pakkumine', 'Note', 'Support', 'Other']

const tools = {
  search_companies: {
    description: 'Search companies by name (partial match). Returns id, name, status, follow-up and last-contact dates.',
    schema: { type: 'object', properties: { query: { type: 'string', description: 'Part of the company name' } }, required: ['query'] },
    async run({ query }) {
      return findCompanies(query)
    },
  },

  get_company: {
    description: 'Full picture of one company: fields, contact persons, latest activities, synced emails, open tasks and notes. Accepts a name or uuid.',
    schema: { type: 'object', properties: { company: { type: 'string', description: 'Company name or id' } }, required: ['company'] },
    async run({ company }) {
      const c = await resolveCompany(company)
      const [full, people, activities, tasks, notes, emails] = await Promise.all([
        rest(`companies?id=eq.${c.id}&select=*`),
        rest(`people?company_id=eq.${c.id}&deleted_at=is.null&select=name,role,email,phone,is_primary&order=is_primary.desc`),
        rest(`activities?company_id=eq.${c.id}&select=type,title,body,created_at,reminder&order=created_at.desc&limit=10`),
        rest(`tasks?company_id=eq.${c.id}&done=eq.false&select=title,due_date&order=due_date`),
        rest(`notes?company_id=eq.${c.id}&select=body,created_at&order=created_at.desc&limit=10`),
        rest(`emails?company_id=eq.${c.id}&select=subject,from_name,direction,received_at,preview&order=received_at.desc&limit=10`),
      ])
      return { company: full[0], contacts: people, recent_activities: activities, open_tasks: tasks, notes, recent_emails: emails }
    },
  },

  list_follow_ups: {
    description: 'Companies with a follow-up due today or overdue (default), or within the next N days.',
    schema: { type: 'object', properties: { within_days: { type: 'number', description: 'Also include follow-ups up to N days ahead (default 0 = today + overdue)' } } },
    async run({ within_days = 0 }) {
      const until = new Date(Date.now() + within_days * 86400000).toISOString().split('T')[0]
      return rest(`companies?workspace_id=eq.${WS}&deleted_at=is.null&follow_up=lte.${until}&select=id,name,status,follow_up&order=follow_up`)
    },
  },

  list_open_tasks: {
    description: 'All open (not done) tasks in the workspace with company names, ordered by due date.',
    schema: { type: 'object', properties: {} },
    async run() {
      return rest(`tasks?workspace_id=eq.${WS}&done=eq.false&select=id,title,due_date,companies(name)&order=due_date`)
    },
  },

  create_activity: {
    description: `Log an activity on a company (also bumps its last-contact date). Types: ${ACTIVITY_TYPES.join(', ')}.`,
    schema: {
      type: 'object',
      properties: {
        company: { type: 'string', description: 'Company name or id' },
        type: { type: 'string', enum: ACTIVITY_TYPES },
        title: { type: 'string' },
        body: { type: 'string', description: 'Optional details' },
        reminder: { type: 'string', description: 'Optional reminder date YYYY-MM-DD' },
      },
      required: ['company', 'type', 'title'],
    },
    async run({ company, type, title, body, reminder }) {
      const c = await resolveCompany(company)
      const rows = await rest('activities', { method: 'POST', body: { company_id: c.id, type, title, body: body || null, reminder: reminder || null } })
      await rest(`companies?id=eq.${c.id}`, { method: 'PATCH', body: { last_contact: new Date().toISOString() } })
      return { created: rows[0], company: c.name }
    },
  },

  create_task: {
    description: 'Create a task for a company.',
    schema: {
      type: 'object',
      properties: {
        company: { type: 'string', description: 'Company name or id' },
        title: { type: 'string' },
        due_date: { type: 'string', description: 'Optional due date YYYY-MM-DD' },
      },
      required: ['company', 'title'],
    },
    async run({ company, title, due_date }) {
      const c = await resolveCompany(company)
      const rows = await rest('tasks', { method: 'POST', body: { company_id: c.id, title, due_date: due_date || null } })
      return { created: rows[0], company: c.name }
    },
  },

  add_note: {
    description: 'Add a note to a company.',
    schema: {
      type: 'object',
      properties: {
        company: { type: 'string', description: 'Company name or id' },
        body: { type: 'string', description: 'Note text' },
      },
      required: ['company', 'body'],
    },
    async run({ company, body }) {
      const c = await resolveCompany(company)
      const rows = await rest('notes', { method: 'POST', body: { company_id: c.id, body } })
      return { created: rows[0], company: c.name }
    },
  },

  set_follow_up: {
    description: 'Set or clear the follow-up date of a company.',
    schema: {
      type: 'object',
      properties: {
        company: { type: 'string', description: 'Company name or id' },
        date: { type: 'string', description: 'YYYY-MM-DD, or empty string to clear' },
      },
      required: ['company', 'date'],
    },
    async run({ company, date }) {
      const c = await resolveCompany(company)
      const rows = await rest(`companies?id=eq.${c.id}`, { method: 'PATCH', body: { follow_up: date || null } })
      return { company: rows[0].name, follow_up: rows[0].follow_up }
    },
  },
}

// ---- MCP stdio JSON-RPC plumbing ----------------------------------------

function send(msg) {
  process.stdout.write(JSON.stringify(msg) + '\n')
}

function toolList() {
  return Object.entries(tools).map(([name, t]) => ({ name, description: t.description, inputSchema: t.schema }))
}

async function handle(req) {
  const { id, method, params } = req
  if (method === 'initialize') {
    return send({ jsonrpc: '2.0', id, result: {
      protocolVersion: params?.protocolVersion || '2024-11-05',
      capabilities: { tools: {} },
      serverInfo: { name: 'nodus-crm', version: '0.1.0' },
    } })
  }
  if (method === 'notifications/initialized') return
  if (method === 'ping') return send({ jsonrpc: '2.0', id, result: {} })
  if (method === 'tools/list') return send({ jsonrpc: '2.0', id, result: { tools: toolList() } })
  if (method === 'tools/call') {
    const tool = tools[params?.name]
    if (!tool) return send({ jsonrpc: '2.0', id, error: { code: -32602, message: `Unknown tool: ${params?.name}` } })
    try {
      const result = await tool.run(params?.arguments || {})
      return send({ jsonrpc: '2.0', id, result: { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] } })
    } catch (err) {
      return send({ jsonrpc: '2.0', id, result: { content: [{ type: 'text', text: `Error: ${err.message}` }], isError: true } })
    }
  }
  if (id !== undefined) send({ jsonrpc: '2.0', id, error: { code: -32601, message: `Method not found: ${method}` } })
}

let buffer = ''
process.stdin.setEncoding('utf8')
process.stdin.on('data', chunk => {
  buffer += chunk
  let idx
  while ((idx = buffer.indexOf('\n')) !== -1) {
    const line = buffer.slice(0, idx).trim()
    buffer = buffer.slice(idx + 1)
    if (!line) continue
    let req
    try { req = JSON.parse(line) } catch { continue }
    handle(req).catch(err => {
      if (req.id !== undefined) send({ jsonrpc: '2.0', id: req.id, error: { code: -32603, message: err.message } })
    })
  }
})
process.stdin.on('end', () => process.exit(0))
