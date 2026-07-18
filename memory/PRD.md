# GARUDA AI — Revenue Universe Foundation

## Original Problem Statement
Build the FIRST production-ready module of GARUDA AI, the long-term AI Operating System.
Module: **Revenue Universe Foundation**. Stack: React + TypeScript + Tailwind, Node.js + Express, MongoDB.
Design: premium, minimal, luxury, black + gold, enterprise. Architecture must be ready to
plug into future subsystems (Mother Brain, Knowledge Engine, Guardian, Creative Universe, AI Agents).

## Architecture (v1 — 2026-02-18)
- **Frontend**: React 19 + TypeScript + Tailwind + Recharts + Tanstack Query + React Router v7
- **Backend**: Node.js 20 + Express 4 + Mongoose 8 + TypeScript (tsx runtime) at `/app/backend-node`
- **Shim**: FastAPI at `/app/backend/server.py` — the container's supervisor is READONLY (uvicorn on
  :8001). server.py boots the Node backend as a child process on 127.0.0.1:4001 and reverse-proxies
  all `/api/*` calls to it. Cookies + JWT flow end-to-end.
- **Auth**: JWT access (15m) + refresh (7d), httpOnly cookies, bcrypt hashes, idempotent admin seed.
- **Data**: Rich demo dataset seeded on first boot (7 opportunities, 7 tasks, 13 revenue records,
  3 notifications, 5 activities).

## Modules Implemented
- Authentication (Login, Register, /me, refresh, logout)
- Central Dashboard (4 KPI cards, revenue trajectory chart, pipeline snapshot, recent activity, operator focus)
- Opportunity Manager (Kanban + List views, drag-drop stage change, full CRUD modal)
- Task Manager (filter tabs, inline complete, linked opportunity, full CRUD modal)
- Earnings Recording (Revenue records table, full CRUD modal, currency, source, linked opportunity)
- Revenue Analytics (monthly bar chart, by-source ranking, top-client table)
- Activity Timeline (grouped by day, icon by event type)
- Notifications (minimal but functional — list, mark-one-read, mark-all-read, top-nav bell dropdown)
- Settings (profile update + password change + placeholder for future subsystem integration cards)

## Database Models (Mongoose, /app/backend-node/src/models)
- `User` — email, name, role, avatarUrl, passwordHash
- `Opportunity` — title, client, source, stage(6), potentialValue, currency, probability, expectedCloseDate, notes, tags
- `Task` — title, description, status(4), priority(4), dueDate, completedAt, linked opportunityId
- `RevenueRecord` — client, amount, currency, source, status(3), recordedAt, linked opportunityId, notes
- `Activity` — type(13 event kinds), title, entityType/entityId, meta, createdAt
- `Notification` — title, body, level(4), read, link, createdAt

## APIs (all under /api, JWT-protected except auth)
- POST /auth/register, /auth/login, /auth/logout, /auth/refresh
- GET  /auth/me
- GET  /dashboard/summary, /dashboard/revenue-analytics
- GET/POST /opportunities, GET/PATCH/DELETE /opportunities/:id
- GET/POST /tasks, PATCH/DELETE /tasks/:id
- GET/POST /revenue, PATCH/DELETE /revenue/:id
- GET  /activity
- GET  /notifications, POST /notifications/read-all, POST /notifications/:id/read
- PATCH /settings/profile, POST /settings/change-password

## Future Integration Points (stubs in place)
`/app/backend-node/src/integrations/` and `/app/backend-node/src/services/eventBus.ts`
- Mother Brain — orchestration + cross-module reasoning
- Knowledge Engine — long-term memory + retrieval
- Guardian — safety / policy / risk scoring
- Creative Universe — generative content pipelines
- AI Agents registry

## What Should Be Built Next (P0/P1/P2 Backlog)

### P0
- Real-time updates (websocket or SSE) for notifications + activity feed
- Multi-user org / workspace model (currently single-owner scoping)
- Server-side search + full-text index over opportunities, tasks, revenue

### P1
- Forecast module (project pipeline → probability-weighted revenue by month)
- Task automation rules (when opp stage = won → create tasks)
- CSV export for revenue, opportunities

### P2
- Team members + roles + delegations
- Import from CRMs (HubSpot, Salesforce)
- Native charts drill-through
