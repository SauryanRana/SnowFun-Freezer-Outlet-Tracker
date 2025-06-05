# Snowfun Nepal – Freezer & Outlet Tracker  
**Project Structure Guide**

This document explains how the source code and resources are organized in the repository. It follows modern best-practices for a TypeScript-first, monorepo full-stack application powered by:

* Front-end – Next.js + React + TailwindCSS + Leaflet  
* Back-end – Node.js + Express + TypeORM + PostgreSQL  
* Auth & Storage – JWT, Firebase Storage  
* Tooling – pnpm workspaces, ESLint/Prettier, Vitest/Jest, Husky, GitHub Actions

```
snowfun-nepal/
├── apps/
│   ├── web/                    # Next.js front-end
│   │   ├── public/             # Static assets (logo, icons, marker PNGs)
│   │   ├── src/
│   │   │   ├── components/     # Re-usable UI components
│   │   │   ├── features/       # Feature-based folders (Auth, Map, Shops…)
│   │   │   ├── hooks/          # Custom React hooks
│   │   │   ├── lib/            # Client-side helpers (api.ts, auth.ts)
│   │   │   ├── pages/          # Next.js route pages
│   │   │   ├── styles/         # Tailwind config & global CSS
│   │   │   └── types/          # Shared TypeScript types/interfaces
│   │   ├── .env.local.example  # Front-end env template
│   │   ├── next.config.mjs
│   │   └── tsconfig.json
│   └── api/                    # Express back-end
│       ├── src/
│       │   ├── controllers/    # Route logic (auth, shops, fridges…)
│       │   ├── middleware/     # JWT auth, error handler, RBAC guard
│       │   ├── models/         # TypeORM entities (User, Dealer, Shop…)
│       │   ├── routes/         # Express routers grouped by module
│       │   ├── services/       # Business logic, DB, external APIs
│       │   ├── utils/          # Helper utilities (logger, validator)
│       │   └── index.ts        # App bootstrap
│       ├── ormconfig.ts        # TypeORM + PostgreSQL config
│       ├── .env.example        # Back-end env template
│       └── tsconfig.json
├── packages/                   # Shared code across apps
│   ├── ui/                     # Design-system (Tailwind components)
│   ├── config/                 # Shared TS configs, ESLint, Prettier
│   └── types/                  # Cross-package type definitions
├── prisma/                     # DB schema & migrations (optional alt. to TypeORM)
│   ├── schema.prisma
│   └── migrations/
├── scripts/                    # Dev/CI helper scripts (seed, backup…)
├── tests/                      # End-to-end & integration tests (Playwright)
├── .github/
│   └── workflows/              # CI/CD pipelines (build, lint, deploy)
├── docker/                     # Docker & docker-compose definitions
│   ├── api.Dockerfile
│   ├── web.Dockerfile
│   └── docker-compose.yml
├── .env.example                # Root-level env for monorepo settings
├── package.json
├── pnpm-workspace.yaml
├── README.md
└── LICENSE
```

---

## 1. `apps/` – Executable Applications
### 1.1 `web/` (Next.js Front-end)
Organised by **feature-folder** pattern to encourage cohesion:

* **components/** – presentational, dumb.
* **features/** – each folder owns its UI, state, API hooks, tests.
* **pages/** – top-level routes (`/login`, `/admin`, `/psr`, `/shop/[id]`).
* **lib/** – thin API layer (Axios) pointing to `api/` service.
* **styles/** – `tailwind.config.cjs`, `globals.css`, theme tokens.

### 1.2 `api/` (Express Back-end)
* **controllers/** – accept request, call service, return DTO.
* **services/** – heavy lifting (DB, storage, geocoding).
* **models/** – TypeORM entities inc. relations & validation decorators.
* **middleware/** – auth, RBAC, logging, Multer (file upload) config.

---

## 2. `packages/` – Shared Libraries
Facilitates true **code-sharing** and design-consistency:

* `ui/` – button, modal, input, snack-bar pre-styled with Tailwind.
* `config/` – `eslint-config-snowfun`, `tsconfig`, prettier rules.
* `types/` – universal TS types for DTOs (`UserRole`, `FridgeStatus`).

All published to local workspace through `pnpm` aliases.

---

## 3. `prisma/` (Optional)
If Prisma is preferred over TypeORM, keep schema here and generate client consumed by both API and tests.

---

## 4. Environment Files
```
.env               # Generic root variables (NODE_ENV, PORT)
apps/api/.env      # DB_URL, JWT_SECRET, FIREBASE_*, MAPBOX_KEY
apps/web/.env.local# NEXT_PUBLIC_API_URL, NEXT_PUBLIC_MAPBOX_KEY
```
Always commit `*.example` templates **only**.

---

## 5. Tooling & Quality
* **ESLint & Prettier** – unified rules via `packages/config`.
* **Husky + lint-staged** – pre-commit hooks.
* **Vitest/Jest** – unit tests in both apps.
* **Playwright** – E2E across the stack (runs in `tests/`).
* **GitHub Actions** – lint, test, build, deploy to Vercel/Render.

---

## 6. Docker & Deployment
* `docker-compose.yml` – orchestrates `api`, `web`, `db` (PostgreSQL).
* Individual Dockerfiles for production builds.
* Multi-stage deploy guidelines in `README.md`.

---

## 7. Scripts
Common dev tasks:

```bash
pnpm dev            # concurrent web + api with hot-reload
pnpm lint           # lint all packages
pnpm test           # run unit tests
pnpm db:migrate     # run TypeORM/Prisma migrations
pnpm seed           # populate sample dealers, shops, fridges
```

---

## 8. Suggested Branching Strategy
```
main -> production deploy
dev  -> staging deploy
feat/xyz, fix/bug-xyz -> PR to dev
```

---

### Naming Conventions Summary
* **PascalCase** for React components.
* **camelCase** for files inside `lib`, `utils`.
* **kebab-case** for route folders (`/shop/[id]`).

---

## 9. Next Steps
1. **Clone** repo & run `pnpm i`.
2. Copy `.env.example` files ⟶ fill API keys:
   * `GOOGLE_MAPS_API_KEY` or none if using OSM.
   * `FIREBASE_API_KEY`, `FIREBASE_STORAGE_BUCKET`.
   * `JWT_SECRET`, `DATABASE_URL`.
3. `pnpm dev` to boot full stack locally.

Welcome to Snowfun Nepal’s codebase—happy coding! 🍦
