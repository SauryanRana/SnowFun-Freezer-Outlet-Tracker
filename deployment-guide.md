# Snowfun Nepal – Deployment Guide

Deploying **Snowfun Nepal – Freezer & Outlet Tracker** to production involves three independently scalable services:

1. PostgreSQL database  
2. Express API (REST server)  
3. Next.js front-end (static + server-side rendered pages)

Below you will find prescriptive instructions for Docker-based self-hosting **and** “serverless” PaaS alternatives (Render / Railway + Vercel).

---

## 1. Prerequisites

| Tool | Version | Purpose |
| ---- | ------- | ------- |
| Node.js | ≥ 18 LTS | Build scripts, local dev |
| pnpm | ≥ 8 | Monorepo package manager |
| Docker | ≥ 20.10 | Containerised deploys |
| Git | any | Source control |
| Cloud account | e.g. AWS / GCP / Render / Railway | Hosting & storage |
| Map key | Google Maps **or** Mapbox | Geospatial tiles / geocoding |
| Cloudinary / Firebase | Image storage (contract photos) |

---

## 2. Environment Variables

Create copies from the provided `*.example` templates and populate **all** values:

### Global (`.env`)
```
NODE_ENV=production
CORS_ORIGIN=https://tracker.snowfun.com
```

### API (`apps/api/.env`)
```
PORT=5000
DATABASE_URL=postgresql://<user>:<pass>@<host>:<port>/snowfun_nepal
JWT_SECRET=change_this_super_secret
JWT_REFRESH_SECRET=another_long_secret
JWT_RESET_SECRET=password_reset_secret
FIREBASE_API_KEY=<firebase-key>
FIREBASE_STORAGE_BUCKET=<bucket>.appspot.com
GOOGLE_MAPS_API_KEY=<optional_if_google>
MAPBOX_KEY=<optional_if_mapbox>
```

### Web (`apps/web/.env.local`)
```
NEXT_PUBLIC_API_URL=https://api.snowfun.com
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=<same_as_above>
NEXT_PUBLIC_MAPBOX_TOKEN=<same_as_above>
```

> 💡 **Tip:** store secrets in the hosting provider’s dashboard, **never** commit them to git.

---

## 3. Database Setup

### 3.1 Provision PostgreSQL

| Option | How-to |
| ------ | ------ |
| Docker | `docker run --name snowfun-db -e POSTGRES_PASSWORD=pass -p 5432:5432 -d postgres:15` |
| Render / Railway | “New PostgreSQL” → copy connection string |
| AWS RDS / GCP CloudSQL | create instance with 15+ |

### 3.2 Initialise schema

The project uses TypeORM migrations (or Prisma if you switched):

```
pnpm i
cd apps/api
pnpm typeorm migration:run
# or prisma migrate deploy
```

### 3.3 Seed lookup tables

```
pnpm ts-node scripts/seed.ts   # inserts roles, fridge_types, etc.
```

---

## 4. Production Build & Deploy

### 4.1 Docker Compose (single VM)

At repo root:

```bash
docker compose -f docker/docker-compose.yml --env-file apps/api/.env up -d --build
```

Services:

* `db` – PostgreSQL 15
* `api` – Express, port 5000
* `web` – Next.js, port 3000 (served by `next start`)
* `nginx` (optional) – TLS termination + reverse-proxy `/api` -> 5000

Update `docker-compose.yml` with your exact `DATABASE_URL` and domain.

### 4.2 Render.com / Railway.app

1. **API**  
   * New **Web Service** → repo path `apps/api`  
   * Runtime: **Dockerfile** (`docker/api.Dockerfile`)  
   * Health check: `/health`  
   * Add environment variables (see section 2)  
2. **Web (Next.js)**  
   * New **Static / Web Service** → repo path `apps/web`  
   * Build command: `pnpm build`  
   * Start command: `pnpm start` (Next.js standalone)  
3. **PostgreSQL Add-On** → attach to both services.  
4. Point `NEXT_PUBLIC_API_URL` to Render API URL.  

### 4.3 Vercel (front-end) + Fly.io / Railway (API)

Frontend:

```
vercel link
vercel --prod
```

Set env vars in Vercel → **Environment Variables**.

Backend:

```
fly launch --dockerfile docker/api.Dockerfile
fly deploy
```

---

## 5. CI/CD (GitHub Actions)

Workflow `.github/workflows/ci.yml` does:

1. Install pnpm, cache deps  
2. Lint + test (`pnpm lint && pnpm test`)  
3. Build web & api images  
4. Push to GH-Registry  
5. Trigger deploy via Render API (or Fly tokens)

Add the required provider secrets to **Repository → Settings → Secrets**.

---

## 6. Data Migrations & Zero-Downtime Strategy

1. `api` container entrypoint runs pending TypeORM migrations before server start.  
2. For hot fixes:  
   ```bash
   docker exec -it snowfun-api pnpm typeorm migration:generate src/migrations/fix
   docker-compose up -d --build api
   ```  
3. Keep a continuous backup: enable **point-in-time recovery** on managed DB or `pg_dump` nightly via cron.

---

## 7. CDN & Image Storage

| Option | Steps |
| ------ | ----- |
| **Firebase Storage** | Create bucket → copy keys → configure CORS for `https://tracker.snowfun.com` |
| **Cloudinary** | Sign up → preset unsigned uploads → set `CLOUDINARY_URL` env → SDK already integrated |

Images are uploaded by API using signed URLs; no extra egress configuration required.

---

## 8. Monitoring & Logging

| Layer | Tooling |
| ----- | ------- |
| Containers | Docker logs → `docker logs -f snowfun-api` |
| Render / Railway | Built-in metrics dashboard |
| Uptime | UptimeRobot or BetterStack ping `https://tracker.snowfun.com/health` |
| Errors | Sentry SDKs (optional) – DSN env `SENTRY_DSN=...` |

---

## 9. Initial Admin Setup

1. After first deploy run:
   ```bash
   POST /api/auth/register
   {
     "email":"admin@snowfun.com",
     "password":"StrongP@ssw0rd!",
     "fullName":"System Admin",
     "roleId":1
   }
   ```
2. Log in → Admin Dashboard → add dealers, PSRs, shops.

---

## 10. Rollback

* Docker: `docker compose down && docker compose up -d --build api=<previous_tag>`  
* Render: deploy from earlier commit  
* Database: restore from snapshot

---

## 11. Checklist Before Go-Live ✅

- [ ] Domain pointed to load-balancer / Vercel / Render  
- [ ] TLS certificate issued (Let’s Encrypt auto on all options)  
- [ ] All secrets present in host envs  
- [ ] Database schema migrated & seeded  
- [ ] Email sender (if password reset email is enabled) configured  
- [ ] Map tiles render correctly (API key quota checked)  
- [ ] Image uploads succeed from staging device  
- [ ] Admin account created, basic data imported  

Congratulations 🥳 — Snowfun Nepal is ready to track freezers nationwide!
