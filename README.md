# Snowfun Nepal – Freezer & Outlet Tracker

🍦 _Track freezer inventory, manage PSR visits, and monitor outlet performance across Nepal—all in one dashboard._

![Snowfun Nepal cover](docs/cover.png)

---

## Table of Contents
1. [About](#about)
2. [Features](#features)
3. [Tech Stack](#tech-stack)
4. [Branding & UI](#branding--ui)
5. [Project Structure](#project-structure)
6. [Getting Started](#getting-started)
7. [Environment Variables & API Keys](#environment-variables--api-keys)
8. [Common Scripts](#common-scripts)
9. [Usage Guide](#usage-guide)
10. [Deployment](#deployment)
11. [Contributing](#contributing)
12. [License](#license)
13. [Contact](#contact)

---

## About
**Snowfun Nepal – Freezer & Outlet Tracker** is a full-stack web application for the nationwide distributor **Snowfun Nepal**.  
It helps the company:

* keep a real-time record of ice-cream freezers in shops,
* plan & confirm Pilot Sales Representative (PSR) visits,
* analyse coverage and freezer health with interactive maps and reports.

The UI embraces Snowfun’s official **green & red** branding while retaining a clean, mobile-first design.

---

## Features
### Authentication
* **Dual sign-in methods**  
  * Email + password  
  * Nepali mobile number **OTP** (6-digit code via SMS)
* Refresh-token flow & secure JWT storage
* Role-based access (Admin / PSR)

### Admin
- CRUD for Dealers, Shops, PSRs & Freezers  
- Drag-and-drop shop assignment to PSRs  
- Nepal map with custom Snowfun markers  
- Realtime visit status colouring  
- Dynamic dropdown management (fridge types, brands, models)  
- Analytics dashboard & export to **CSV / PDF**

### PSR (Field Sales)
- Personal route dashboard (map & list)  
- One-tap **“Mark Visited”** with fridge condition checklist  
- Add new shops on the go (GPS pin or manual coords)  
- Offline-first image upload for contracts/photos  
- Daily progress bar & visit reminders (optional push/SMS)

### Shared
- Responsive UI (mobile, tablet, desktop)  
- Soft animations, modern modals & checklists  
- Powerful search & filter tools  
- Comprehensive REST API with Swagger docs  
- Postgres migrations & automatic seeding  
- Docker-first deployments and CI via GitHub Actions  

---

## Tech Stack
| Layer        | Choice                                             |
|--------------|----------------------------------------------------|
| Front-end    | **Next.js (React 18)** + Tailwind CSS              |
| Map          | Leaflet.js + OpenStreetMap (no quota)              |
| Back-end     | **Node.js 20** + Express + TypeORM                 |
| Database     | PostgreSQL 15 (optional PostGIS)                   |
| Storage      | Firebase Storage or Cloudinary                     |
| Auth         | JSON Web Tokens + **OTP via SMS Gateway**          |
| Dev Ops      | Docker, Docker Compose, GitHub Actions             |
| Hosting      | Vercel (web) • Render / Railway (API & DB)         |

> The OTP flow is provider-agnostic—simply plug in your preferred Nepali SMS gateway credentials (`SMS_GATEWAY_URL`, `SMS_API_KEY`).

---

## Branding & UI
| Element | Details |
|---------|---------|
| **Logo** | ![Snowfun Logo](docs/logo.png) |
| **Primary Green** | `#22c55e` |
| **Primary Red**   | `#ef4444` |
| Accent neutrals | Snow white `#ffffff`, off-white `#f8fafc` |
| Fonts | Inter (UI) • Poppins (headings) |
| Icons | Heroicons + Feather icons |
| Theme | Light & optional dark mode with melted ice-cream animations |

The updated Tailwind palette (`snow-green`, `snow-red`) ensures every component—buttons, cards, charts—aligns with the official brand.

---

## Project Structure
```
snowfun-nepal/
├── apps/
│   ├── web/   ← Next.js front-end
│   └── api/   ← Express back-end
├── packages/  ← Shared UI & config
├── prisma/    ← (optional) DB schema
└── docker/    ← Container recipes
```
A full description lives in [`project-structure.md`](docs/project-structure.md).

---

## Getting Started

### Prerequisites
* Node ≥ 18 & pnpm ≥ 8  
* Docker (for DB or full stack)  
* Map & SMS API keys (see below)

### Local Setup
```bash
git clone https://github.com/snowfun-nepal/freezer-tracker.git
cd freezer-tracker
pnpm install
cp .env.example .env                 # root
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.local.example apps/web/.env.local
# → fill in DB, SMS & map keys
docker compose up -d db              # spin up Postgres
pnpm dev                             # runs web + api
```

> Visit `http://localhost:3000` → login with email/password **or** phone + OTP.

---

## Environment Variables & API Keys
| Key | Where | Purpose |
|-----|-------|---------|
| `DATABASE_URL` | api | Postgres connection |
| `JWT_SECRET`, `JWT_REFRESH_SECRET` | api | Token signing |
| `SMS_GATEWAY_URL`, `SMS_API_KEY` | api | Send OTP SMS |
| `FIREBASE_API_KEY`, `FIREBASE_STORAGE_BUCKET` | api | Image uploads |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` _or_ `NEXT_PUBLIC_MAPBOX_TOKEN` | web | Basemap / geocoding |
| `NEXT_PUBLIC_API_URL` | web | Origin of Express API |

All templates are provided as `*.example` files.

---

## Common Scripts
| Command | Description |
|---------|-------------|
| `pnpm dev` | Run API + Web with hot-reload |
| `pnpm lint` | ESLint & Prettier check |
| `pnpm test` | Vitest/Jest unit tests |
| `pnpm db:migrate` | Run TypeORM migrations |
| `pnpm seed` | Insert demo data |
| `pnpm build` | Production build (both apps) |
| `docker compose up -d` | Start full stack in containers |

---

## Usage Guide
### Sign-in Methods
| Method | Flow |
|--------|------|
| Email | Classic email & password form |
| Phone | Enter Nepali number → receive 6-digit OTP via SMS → verify |

After authentication:
* **Admin** → full dashboard  
* **PSR** → assigned route & checklist  

Detailed guides live in `docs/user-manual/`.

---

## Deployment
A full walkthrough is in [`deployment-guide.md`](deployment-guide.md).  
TL;DR:

```bash
# Build and run with Docker Compose
docker compose -f docker/docker-compose.yml --env-file apps/api/.env up -d --build
```

Or use **Vercel (web)** + **Render (API & DB)** – copy env variables via dashboard UI.

---

## Contributing
PRs are welcome! Please:

1. Fork the repo & create feature branch.  
2. Run `pnpm lint && pnpm test`.  
3. Submit pull request describing motivation.

Issues & feature requests → GitHub Issues.

---

## License
Distributed under the **MIT License**. See `LICENSE` for details.

---

## Contact
**Snowfun Nepal**  
‣ Email: support@snowfun.com.np  
‣ Website: https://snowfun.com.np  
<br/>
_Made with 🍦, ❤️, **#22c55e**, and **#ef4444** in Nepal._
