# Nodus CRM MCP server

Kohalik MCP-server, mille kaudu Claude saab Nodusest infot pärida ja sinna kirjeid lisada.
Puhas Node'i skript — sõltuvusi pole, `npm install` pole vaja.

## Tööriistad

| Tool | Mida teeb |
|---|---|
| `search_companies` | Otsi ettevõtteid nime järgi |
| `get_company` | Ettevõtte täispilt: väljad, kontaktid, activityd, emailid, taskid, märkmed |
| `list_follow_ups` | Tänased ja üle tähtaja follow-upid (või N päeva ette) |
| `list_open_tasks` | Kõik lahtised taskid ettevõtete kaupa |
| `create_activity` | Logi activity (uuendab ka last contact kuupäeva) |
| `create_task` | Loo task |
| `add_note` | Lisa märge |
| `set_follow_up` | Määra/tühjenda follow-up kuupäev |

## Seadistus

1. Võta **service role key**: Supabase dashboard → projekt `jphmelqgdorzqnxfezzc` → Settings → API → `service_role`.
   NB: see võti käib mööda RLS-ist — hoia ainult oma masinas, ära pane git'i ega jaga.

2. Registreeri server (terminalis):

```bash
claude mcp add nodus \
  -e SUPABASE_URL=https://jphmelqgdorzqnxfezzc.supabase.co \
  -e SUPABASE_SERVICE_ROLE_KEY=<service_role_key_siia> \
  -e NODUS_WORKSPACE_ID=ebecd7b2-396a-4ffd-9f5b-2a7efb2908a8 \
  -- /Users/svenvaska/.fnm/node-versions/v24.16.0/installation/bin/node \
     /Users/svenvaska/Documents/00_Projects/CRM/nodus/mcp-server/server.mjs
```

(`NODUS_WORKSPACE_ID` ülal on "Hours" workspace.)

3. Uues Claude'i sessioonis on tööriistad nimega `mcp__nodus__*` olemas.
   Proovi: *"otsi Nodusest Nitrotol"* või *"lisa Nitrotolile follow-up homseks"*.

## Turvamudel (praegune vundament)

- Kõik päringud on koodis lukustatud ühe workspace'i külge (`NODUS_WORKSPACE_ID`) —
  ka service-role võtmega ei pääse tööriistad teiste workspace'ide andmetele ligi.
- Kirjutavad tööriistad piirduvad activityde, taskide, märkmete ja follow-upiga.
  Ettevõtete kustutamist/muutmist meelega pole.
- Kui kunagi on vaja mitme kasutajaga varianti, on järgmine samm sama serveri
  viimine Supabase Edge Function'iks kasutaja enda JWT-ga (siis kehtib RLS).
