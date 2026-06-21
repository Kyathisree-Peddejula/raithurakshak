# RaithuRakshak

A farmer safety platform focused on lightning-related emergencies in rural India. Helps district officers register farmers, monitor weather, issue lightning risk alerts, track last known locations, and manage emergency responses.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/raithu-rakshak run dev` — run the frontend (port 23658)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind CSS + shadcn/ui
- API: Express 5 (Node.js)
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI contract (source of truth)
- `lib/db/src/schema/` — DB tables: farmers, family_members, locations, lightning_alerts, emergency_alerts, weather_data
- `artifacts/api-server/src/routes/` — Express route handlers (farmers, family, locations, alerts, weather, dashboard)
- `artifacts/raithu-rakshak/src/pages/` — React pages (Dashboard, Farmers, FarmerRegister, FarmerDetail, Family, Weather, LightningAlerts, EmergencyAlerts, Locations)
- `artifacts/raithu-rakshak/src/components/` — Shared components (AppLayout, Sidebar, SeverityBadge)

## Architecture decisions

- Node.js/Express backend instead of Python Flask (Replit workspace is pnpm/Node.js based)
- PostgreSQL via Drizzle ORM for the database (not SQLite)
- Contract-first API: OpenAPI spec → Orval codegen → typed React Query hooks
- Deep forest green + amber color palette to convey authority and urgency for emergency operations
- SeverityBadge component used consistently for risk levels: critical=red, high=orange, medium=yellow, low=green

## Product

RaithuRakshak provides district officers and emergency teams with:
- **Dashboard** — real-time summary of active farmers, emergencies, lightning alerts, and district risk
- **Farmer Registry** — register and manage farmers with GPS coordinates, Aadhaar, and contact info
- **Family Management** — register family members as emergency contacts
- **Weather Monitoring** — per-district weather cards with temperature, humidity, wind, and lightning risk
- **Lightning Alerts** — issue and track district-level lightning risk warnings with severity levels
- **Emergency Alerts** — report and resolve farmer emergencies (lightning strikes, medical, missing)
- **Live Locations** — track last known GPS location of all registered farmers

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- After any OpenAPI spec change, always run `pnpm --filter @workspace/api-spec run codegen` before touching frontend code
- The `/locations` endpoint uses `DISTINCT ON` SQL — specific to PostgreSQL (won't work on SQLite)
- Dashboard `/recent-alerts` combines lightning and emergency alert IDs; use composite keys for React rendering

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
