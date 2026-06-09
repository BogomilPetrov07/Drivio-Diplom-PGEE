# Drivio — Diploma Project (v1)

> **ARCHIVED** — This is v1 of Drivio, built as my diploma project at PGEE (January–April 2026).
> See [Drivio](https://github.com/BogomilPetrov07/Drivio) for the rewritten architecture with Next.js 15, Fastify, tRPC, and Turborepo.

---

A modern web platform for driving schools, instructors, students, and administrators. The project combines training management, role-based access, real-time communication, and centralized administrative logic into a single system.

## Highlights

- Multi-level role-based access (Super Admin, School Admin, Instructor, Student)
- React frontend with Vite, TypeScript, Tailwind CSS, and Zustand
- Node.js backend with Express, TypeScript, and Drizzle ORM
- PostgreSQL database and Redis integration
- Socket.IO for real-time functionality
- PWA support and optimization for modern browsers

## Tech Stack

### Frontend

| Technology | Version |
|------------|---------|
| React | 19 |
| TypeScript | 5.x |
| Vite | 6.x |
| Tailwind CSS | 4 |
| DaisyUI | 4 |
| React Router | 7 |
| Zustand | 5 |
| Vitest | 3.x |

### Backend

| Technology | Version |
|------------|---------|
| Node.js | 22 |
| Express | 5 |
| TypeScript | 5.x |
| Drizzle ORM | 0.39 |
| PostgreSQL | 18 |
| Redis | 7 |
| Socket.IO | 4.x |
| Vitest | 3.x |

## Project Structure

```text
Drivio/
├── frontend/            # Client-side (React + Vite)
│   ├── src/
│   │   ├── components/  # UI components
│   │   ├── pages/       # Role-based pages
│   │   ├── hooks/       # Custom hooks
│   │   ├── stores/      # Zustand state management
│   │   ├── services/    # API calls
│   │   ├── i18n/        # Localization (BG/EN)
│   │   └── utils/       # Utility functions
│   └── public/
├── backend/             # API, business logic, and database
│   ├── src/
│   │   ├── modules/     # Modules: auth, dashboard, onboarding, support
│   │   ├── middlewares/  # Auth, CORS, error handling
│   │   ├── config/      # DB, Redis, JWT, Infisical
│   │   └── utils/       # Email, password, JWT helpers
│   └── drizzle/         # DB schemas and migrations
└── README.md
```

## Local Setup

### 1. Install Dependencies

```bash
cd frontend
npm install

cd ../backend
npm install
```

### 2. Start Frontend

```bash
cd frontend
npm run dev
```

### 3. Start Backend

```bash
cd backend
npm run dev
```

## Commands

### Frontend

```bash
npm run build      # Production build
npm run lint       # Linting
npm run test       # Tests
```

### Backend

```bash
npm run build      # Production build
npm run typecheck  # TypeScript check
npm run test       # Tests
```

### Database

```bash
npm run db:generate   # Generate migrations
npm run db:migrate    # Apply migrations
npm run db:refresh    # Refresh schema
```

## Roles and Access

| Role | Description | Access |
|------|-------------|--------|
| **Super Admin** | Global administrator | Manage requests, support, all schools |
| **School Admin** | Driving school administrator | People, cars, schedules, instructors |
| **Instructor** | Instructor | Own schedule, students, lessons |
| **Student** | Student | Schedule, progress, instructors |

## Key Features

- **Scheduling System** — Weekly time slots, automatic instructor allocation
- **Lesson Management** — Start with code, verification, auto-completion
- **Real-time Communication** — Socket.IO for notifications and live updates
- **Support System** — Tickets, messaging, admin replies
- **Multilingual** — Bulgarian and English (i18n)
- **PWA** — Offline support, home screen installation
- **Themes** — Light/Dark mode

## Architecture Decisions

| Decision | Reason |
|----------|--------|
| Zustand for state | Lightweight, TypeScript-friendly, minimal boilerplate |
| Drizzle ORM | Type-safe SQL, no magic, fast migrations |
| Socket.IO | Real-time with fallback transport |
| Infisical SDK | Centralized secrets management |
| DaisyUI | Ready-made components with Tailwind |

## Environment

- Frontend and backend use separate `.env` files
- Recommended Node.js version: `22.x`
- Backend requires running PostgreSQL and Redis services
- Infisical for secrets management (optional)

---

**License:** All Rights Reserved

This project and all associated code, documentation, and assets are the exclusive intellectual property of Bogomil Petrov. No part of this repository may be copied, modified, distributed, or used in any form without explicit written permission from the author.

© 2026 Bogomil Petrov. All rights reserved.
