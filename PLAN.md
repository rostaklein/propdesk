# PropDesk — House Inspection Tracker

## Overview

App for tracking problems/defects found during house inspections before handover from developer to owner. Three roles collaborate: **Owner**, **Technical Advisor**, and **Developer**. Problems are organized by property, phase, and room — with photos, comments, resolution tracking, and a full audit trail.

---

## Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| **Monorepo** | Turborepo | Simple, fast, keeps FE/BE together |
| **Frontend** | React + Vite | Fast dev, simple build |
| **Styling** | Tailwind CSS + shadcn/ui | Rapid UI, great defaults |
| **Backend** | Node.js + tRPC | End-to-end type safety with zero codegen |
| **ORM** | Drizzle | Type-safe, lightweight, great Postgres support |
| **Database** | PostgreSQL | Your preference, perfect fit |
| **Auth** | Better Auth | Simple, self-hosted, supports email/password + magic links |
| **File Storage** | S3-compatible (R2 / MinIO local) | Presigned uploads, no files through the server |
| **Deploy** | Railway (or Fly.io) | Easy Postgres included, git-push deploy, works with Claude Code web |

### Why tRPC over REST/GraphQL?

- Full TypeScript inference from backend to frontend — no codegen, no schema drift
- Works perfectly with React Query under the hood (caching, optimistic updates)
- You're already a TS shop, so this is the natural fit

### Why Drizzle over Prisma?

- Thinner abstraction, SQL-like syntax, faster cold starts
- Better for a project this size — Prisma's migration engine is overkill here

### Why Better Auth?

- Self-hosted (no vendor lock-in), supports multiple strategies
- Simple role-based access fits our 3-role model
- Alternative: Lucia Auth (also great, slightly more manual)

---

## Data Model

```
users
  id            UUID PK
  email         TEXT UNIQUE NOT NULL
  name          TEXT NOT NULL
  role          ENUM('owner', 'advisor', 'developer')
  password_hash TEXT
  created_at    TIMESTAMPTZ
  updated_at    TIMESTAMPTZ

properties
  id            UUID PK
  name          TEXT NOT NULL
  address       TEXT
  developer_id  UUID FK -> users
  owner_id      UUID FK -> users
  floor_plan_url TEXT          -- S3 key
  created_at    TIMESTAMPTZ
  updated_at    TIMESTAMPTZ

phases
  id            UUID PK
  property_id   UUID FK -> properties
  name          TEXT NOT NULL  -- e.g. "Interior Phase 1", "Technical Acceptance"
  sort_order    INT
  status        ENUM('upcoming', 'active', 'completed')
  created_at    TIMESTAMPTZ
  updated_at    TIMESTAMPTZ

problems
  id            UUID PK
  phase_id      UUID FK -> phases
  property_id   UUID FK -> properties
  reported_by   UUID FK -> users
  title         TEXT NOT NULL
  description   TEXT
  room          TEXT NOT NULL        -- e.g. "Kitchen", "Bathroom 2F"
  location_detail TEXT               -- e.g. "Behind door, left wall"
  severity      ENUM('minor', 'medium', 'high', 'critical')
  status        ENUM('open', 'in_progress', 'resolved', 'verified', 'wont_fix')
  fix_by_date   DATE                 -- optional deadline
  created_at    TIMESTAMPTZ
  updated_at    TIMESTAMPTZ

problem_photos
  id            UUID PK
  problem_id    UUID FK -> problems
  uploaded_by   UUID FK -> users
  url           TEXT NOT NULL        -- S3 key
  caption       TEXT
  created_at    TIMESTAMPTZ

comments
  id            UUID PK
  problem_id    UUID FK -> problems
  author_id     UUID FK -> users
  body          TEXT NOT NULL
  is_resolution BOOLEAN DEFAULT false  -- marks "this resolved it"
  created_at    TIMESTAMPTZ
  updated_at    TIMESTAMPTZ

audit_log
  id            UUID PK
  entity_type   TEXT NOT NULL        -- 'problem', 'comment', 'phase', etc.
  entity_id     UUID NOT NULL
  action        TEXT NOT NULL        -- 'created', 'updated', 'status_changed', etc.
  actor_id      UUID FK -> users
  changes       JSONB                -- { field: { old, new } }
  created_at    TIMESTAMPTZ
```

### Key Design Decisions

- **`is_resolution` on comments** — any comment can be flagged as "this resolves it". The actual status lives on the problem. This keeps things flexible (developer marks resolved, owner can verify or reopen).
- **`audit_log` with JSONB changes** — captures exactly what changed and who did it. Cheap to write, easy to query.
- **`problem_photos` separate table** — multiple photos per problem, each with its own metadata.
- **`status` workflow**: `open` → `in_progress` → `resolved` → `verified` (owner confirms) or `wont_fix`.

---

## Permissions Model

| Action | Owner | Advisor | Developer |
|--------|-------|---------|-----------|
| Create problem | ✅ | ✅ | ❌ |
| Edit problem | ✅ (own) | ✅ | ❌ |
| Change severity | ✅ | ✅ | ❌ |
| Add comment | ✅ | ✅ | ✅ |
| Mark resolved | ❌ | ❌ | ✅ |
| Mark verified | ✅ | ✅ | ❌ |
| Reopen problem | ✅ | ✅ | ❌ |
| Upload photos | ✅ | ✅ | ✅ |
| Manage phases | ✅ | ❌ | ❌ |
| Manage property | ✅ | ❌ | ❌ |
| View audit log | ✅ | ✅ | ✅ (own property) |
| CSV import/export | ✅ | ✅ | ✅ |
| Print view | ✅ | ✅ | ✅ |

---

## File Upload Strategy

1. Frontend requests a presigned upload URL from the backend (`getUploadUrl` tRPC mutation)
2. Backend generates a presigned S3 PUT URL (scoped to user/property path)
3. Frontend uploads directly to S3 — no file goes through our server
4. Frontend confirms upload, backend stores the S3 key in the DB
5. For viewing, backend generates presigned GET URLs (short-lived)

For local dev: MinIO in Docker (S3-compatible). For prod: Cloudflare R2 (cheap, no egress fees) or AWS S3.

---

## CSV Import/Export

**Export:**
- Filter current view → download as CSV
- Columns: Phase, Room, Title, Description, Severity, Status, Fix-by Date, Reported By, Created At
- Simple: server generates CSV from filtered query, streams to client

**Import:**
- Upload CSV with same column format
- Backend validates rows, shows preview with errors
- User confirms → bulk insert
- Good for migrating from existing spreadsheets

---

## Print View

Dedicated `/print` route (or `?print=true`) that renders:
- Property name + phase header
- Table of visible/filtered problems
- Checkbox column (empty) for workers to tick off
- Severity color coding (works in B&W too — uses icons/symbols)
- QR code linking back to the digital version
- CSS `@media print` styles — no app chrome, just the list

---

## Audit Log / Changelog

Every mutation goes through a middleware that:
1. Captures the "before" state
2. Runs the mutation
3. Diffs before/after
4. Writes to `audit_log` with the actor, entity, action, and JSONB changes

UI: Timeline view on each problem showing all changes + comments interleaved, sorted by time. Also a global audit log page (filterable by entity type, user, date range).

---

## Project Structure

```
propdesk/
├── apps/
│   ├── web/                    # React + Vite frontend
│   │   ├── src/
│   │   │   ├── components/     # Shared UI components
│   │   │   ├── features/       # Feature modules
│   │   │   │   ├── auth/
│   │   │   │   ├── properties/
│   │   │   │   ├── phases/
│   │   │   │   ├── problems/
│   │   │   │   ├── comments/
│   │   │   │   ├── audit/
│   │   │   │   └── print/
│   │   │   ├── lib/            # tRPC client, utils
│   │   │   └── routes/         # Page routes (React Router)
│   │   └── ...
│   └── api/                    # tRPC backend
│       ├── src/
│       │   ├── routers/        # tRPC routers per feature
│       │   ├── middleware/      # Auth, audit logging
│       │   ├── db/
│       │   │   ├── schema.ts   # Drizzle schema
│       │   │   └── migrations/
│       │   ├── services/       # Business logic (S3, CSV, etc.)
│       │   └── index.ts        # Express + tRPC adapter
│       └── ...
├── packages/
│   └── shared/                 # Shared types, enums, validation (zod schemas)
├── docker-compose.yml          # Postgres + MinIO for local dev
├── turbo.json
├── package.json
└── PLAN.md
```

---

## Implementation Phases

### Phase 1 — Foundation (do first)
- [x] Plan
- [ ] Monorepo setup (Turborepo, packages, apps)
- [ ] Database schema + Drizzle setup + migrations
- [ ] Auth (email/password, role assignment)
- [ ] Basic tRPC routers: users, properties, phases
- [ ] Minimal frontend: login, property list, phase list

### Phase 2 — Core Problem Tracking
- [ ] Problem CRUD (create, list, filter, edit, status transitions)
- [ ] Problem detail page with photo gallery
- [ ] Comments + resolution marking
- [ ] File upload (presigned URLs → S3/MinIO)
- [ ] Permissions enforcement per role

### Phase 3 — Productivity Features
- [ ] Audit log middleware + timeline UI
- [ ] CSV export (filtered)
- [ ] CSV import with preview/validation
- [ ] Print view with checkboxes
- [ ] Dashboard with summary stats (open by severity, by phase, etc.)

### Phase 4 — Polish & Deploy
- [ ] Railway/Fly.io deploy setup
- [ ] Email notifications (optional — problem assigned, resolved, etc.)
- [ ] Mobile-responsive refinements (you'll use this on-site on your phone)
- [ ] Floor plan viewer with pin markers (stretch goal — click on floor plan to mark location)

---

## Open Questions / Decisions to Make

1. **Auth strategy**: Email/password is simplest to start. Magic links nicer UX but needs email sending. Start with password, add magic links later?
2. **Multi-property**: You mention one house now — but schema supports multiple. Good to have from day 1.
3. **Notifications**: Email? Push? Or just check the app? Can add later.
4. **Floor plan interaction**: Cool stretch goal — click on the uploaded floor plan image to pin problem location. SVG overlay approach. Not MVP.
5. **Invite flow**: How does the developer/advisor get access? Simple: owner creates account and invites via email link with role pre-assigned.
