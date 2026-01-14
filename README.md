# Express Template (Node + Express + SQLite + VentoJS)

A minimal starter template for web apps using Node.js, Express, TypeScript, SQLite, Drizzle ORM, and VentoJS templates. Use this repository as the base for new projects that need a simple, well-structured starting point.

---

## Tech stack

- Node.js (TypeScript)
- Express (v5)
- SQLite (file-based database)
- Drizzle ORM + drizzle-kit (migrations)
- express-session + better-sqlite3-session-store
- VentoJS (view templates)
- tsx + tsc for local development & build
- Kamal (deployment)

---

## Quick start 🚀

### Prerequisites

- Node.js (24+ reccommended)

### Install

```bash
# install dependencies
npm install
```

### Development

```bash
# start dev server (tsx watch)
npm run dev
```

The dev script runs `tsx watch src/server.ts` so changes are picked up automatically.

### Build & Start

```bash
# compile TypeScript
npm run build
# run compiled app
npm start
```

### Test

```bash
npm test
# (this is a placeholder test script included in the template)
```

---

## Database (SQLite + Drizzle ORM) 🗄️

This template uses SQLite via `better-sqlite3` and Drizzle ORM for schema and queries.

- DB connection: `src/db/db.ts`
- Schema: `src/db/schema.ts`
- Migrations: `drizzle/`

Set the database file path with `DB_FILE_NAME` (the app resolves this to an absolute path).

### Migrations and seeding

```bash
# generate migrations from schema changes
npm run db:generate
# apply migrations
npm run db:migrate
# seed data
npm run db:seed
```

---

## Session management 🔐

Sessions are handled by `express-session` with a SQLite-backed store.

- Middleware: `src/middleware/sessionStore.ts`
- Store: `better-sqlite3-session-store`
- Session DB file: `sessions.db`

Key defaults:

- Cookie name: `sid`
- `SESSION_SECRET` env var (defaults to `dev-secret` for local dev)
- Secure cookies in production (`NODE_ENV=production`)

---

## Views (VentoJS) 🎨

Templates live under `views/`. The layout files are in `views/layouts/` and pages in `views/pages/`. VentoJS files in this repo use the `.vto` extension.

Add routes in `src/server.ts` and render views with the configured template engine.

---

## Project structure 📁

- `src/` - TypeScript source (server, routes, helpers)
- `views/` - VentoJS templates (`layouts/`, `pages/`)
- `config/` - config files (e.g., deploy.yml)
- `drizzle/` - Drizzle migrations and metadata
- `Dockerfile` - container image
- `package.json` - scripts and dependencies
- `tsconfig.json` - TypeScript config

---

## Deployment (Kamal) 🚢

This repo includes a Kamal config at `config/deploy.yml`. Use it to build and deploy the Docker image to your server.

Typical flow:

```bash
# from your machine
kamal setup
kamal deploy
```

Update `config/deploy.yml` with your registry, server, and environment settings before deploying.

---

## Docker 🐳

This repo includes a `Dockerfile`. To build and run:

```bash
docker build -t express-template .
docker run -p 3000:3000 --env NODE_ENV=production express-template
```

Adjust env vars or volumes as needed.

---

## Scripts (from `package.json`) ⚙️

- `npm run dev` — runs `tsx watch src/server.ts` for development
- `npm run build` — runs `tsc` to compile to `dist/`
- `npm start` — runs the compiled `dist/server.js`
- `npm run db:generate` — generate Drizzle migrations
- `npm run db:migrate` — apply Drizzle migrations
- `npm run db:seed` — seed data
- `npm test` — placeholder test script

---

## Contributing 🤝

Feel free to open issues or submit PRs. Suggested additions:

- Example CRUD routes
- Example auth flow

---


