# 🎓 Global Masters Scholarship Matcher — Data-Honest Funding Engine

A high-performance, full-stack, **zero-authentication** platform designed to match prospective master’s students with university programs and multi-scoped scholarship rules worldwide. Built with a **Luxury Light Royal Blue** Next.js 16 frontend and a robust **NestJS 10** backend backed by **PostgreSQL 16**, **OpenSearch 2.11**, **Redis 7**, and **RabbitMQ 3**, engineered to support **30,000+ Daily Active Users (DAU)**.

---

## 🌟 The Data Reality & Core Principles

Unlike superficial scholarship aggregators that promise non-existent "GPA 3.2 → 100% MIT tuition" formulas, **ScholarMatch** operates on real-world financial aid structures:

1. **Explicit Confidence Tiers**:
   - **`VERIFIED` (Official Published Formulas)**: Governed merit-based waivers explicitly published by university aid pages or government bodies (e.g., DAAD, Chevening, German/Malaysian tuition waivers).
   - **`CROWDSOURCED` (Student Distributions)**: Self-reported student admit yields aggregated with **IQR & Z-score outlier detection** to display P25, Median, and P75 funding percentiles.
   - **`SCRAPED_UNVERIFIED`**: Unvalidated scraped rules flagged with amber warnings.

2. **Hierarchical 4-Scope Rule Joins**:
   - **`PROGRAM` Scope**: Field-specific research assistantships and departmental grants.
   - **`UNIVERSITY` Scope**: University-wide Dean's waivers and merit scholarships.
   - **`COUNTRY` Scope**: Government-sponsored funding (e.g., DAAD Germany, Chevening UK).
   - **`GLOBAL` Scope**: International scholarship programs (e.g., Erasmus Mundus).

3. **2-Stage Change Detection & Versioned Ledger**:
   - Admission requirements evolve annually. Every requirement record includes `validFrom` and `validTo` date boundaries. Change detection workers calculate SHA-256 hash diffs to archive superseded rules and log audit events.

4. **UN M49 Geographic Standard**:
   - Standardized country and regional categorization according to UN M49 geography, native currency codes, and data completeness indicators.

---

## 🛠️ Full Technology Stack

### Frontend (Client Layer)
- **Framework**: Next.js 16.3 (App Router + Turbopack Engine)
- **UI & Aesthetics**: React 19, Tailwind CSS (Luxury Light Royal Blue & Porcelain Slate Theme)
- **Animations**: Lenis Smooth Scroll, GSAP 3 (ScrollTrigger Hero Reveals), Framer Motion (Tab Indicators & Score Meters)
- **Icons**: Lucide React

### Backend (Server Layer)
- **Framework**: NestJS 10 with Express & TypeScript 5
- **ORM & Database**: PostgreSQL 16 managed via Prisma ORM with composite `@@index` query optimization
- **Search Engine**: OpenSearch 2.11 (Faceted fuzzy search with automated PostgreSQL fallback)
- **Cache & Rate Limiting**: Redis 7 (Token Bucket IP Rate Limiting: 100 req/min)
- **Message Broker & Workers**: RabbitMQ 3 (Hipolabs sync, OpenAlex enrichment, Change Ledger worker, Dead Letter Queue)
- **Documentation**: Swagger OpenAPI 3.0 (`http://localhost:5000/api/docs`)

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: `v20.x` or `v22.x`
- **Docker Compose**: Installed and active

---

### Step 1: Clone & Install Dependencies

```bash
# Clone the repository
git clone https://github.com/Nsarkar-XLR8/Scholarship_Matcher.git
cd Scholarship_Matcher

# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend && npm install && cd ..
```

---

### Step 2: Launch Infrastructure (Docker Compose)

Start PostgreSQL 16, Redis 7, RabbitMQ 3, and OpenSearch 2.11:

```bash
docker compose up -d
```

---

### Step 3: Synchronize & Seed Database

Push the Prisma schema to PostgreSQL and execute the automated seed script (creates UN M49 geography, ISO countries, universities across DE, NL, GB, US, MY, multi-scoped scholarship rules, and crowdsourced outcome distributions):

```bash
# Push database schema
npx prisma db push

# Seed sample data
npm run prisma:seed
```

---

### Step 4: Run the Backend & Frontend

#### Terminal 1: NestJS Backend API (Port 5000)
```bash
npm run start:dev
```
- **API Base URL**: `http://localhost:5000/api/v1`
- **Swagger Documentation**: `http://localhost:5000/api/docs`
- **Health Check Probe**: `http://localhost:5000/health`

#### Terminal 2: Next.js 16 Luxury Frontend (Port 3000)
```bash
cd frontend
npm run dev
```
- Open **`http://localhost:3000`** in your browser.

---

## 📐 System Architecture Diagram

```
                              ┌────────────────────────────────────────┐
                              │  Next.js 16 Luxury Client (Port 3000)  │
                              │   (Lenis, GSAP, Framer Motion, Axios)  │
                              └───────────────────┬────────────────────┘
                                                  │ Next.js Proxy Rewrite
                              ┌───────────────────▼────────────────────┐
                              │    NestJS REST Gateway (Port 5000)     │
                              │ (Throttler, Swagger, Exception Filter) │
                              └───────────────────┬────────────────────┘
                                                  │
         ┌───────────────────────────┬────────────┴────────────┬───────────────────────────┐
         │                           │                         │                           │
┌────────▼──────────────────┐ ┌──────▼─────────────────┐ ┌──────▼──────────────────┐ ┌──────▼──────────────────┐
│  Geospatial Taxonomy     │ │  Eligibility Matcher    │ │  OpenSearch Explorer    │ │  Outcome & FX Matrix     │
│  (/api/v1/taxonomy)       │ │  (/api/v1/match)        │ │  (/api/v1/search)       │ │  (/api/v1/comparison)   │
└────────┬──────────────────┘ └──────┬──────────────────┘ └──────┬──────────────────┘ └──────┬──────────────────┘
         │                           │                         │                           │
         └───────────────────────────┼─────────────────────────┴───────────────────────────┘
                                     │
         ┌───────────────────────────┴───────────────────────────┐
         │                                                       │
┌────────▼──────────────────────────────┐       ┌────────────────▼──────────────────┐
│  PostgreSQL 16 (Prisma Primary DB)    │       │  Redis 7 (Hot Cache & Rate Limit) │
└───────────────────────────────────────┘       └───────────────────────────────────┘
                                     │
                     ┌───────────────▼───────────────┐
                     │    RabbitMQ Event Queue       │
                     └───────────────┬───────────────┘
                                     │
         ┌───────────────────────────┼───────────────────────────┐
         │                           │                           │
┌────────▼──────────────┐ ┌──────────▼──────────────┐ ┌──────────▼──────────────────┐
│ Hipolabs Sync Worker  │ │ OpenAlex Worker        │ │ 2-Stage Change Detection   │
└───────────────────────┘ └────────────────────────┘ └────────────────────────────┘
```

---

## 📡 API Endpoint Overview

| Endpoint | Method | Description |
|---|---|---|
| `/health` | `GET` | System Liveness & Readiness probe (PostgreSQL & Redis health check). |
| `/api/v1/match` | `POST` | Normalizes GPA to 4.0 scale & evaluates program qualification (`QUALIFIED`, `REACH`, `SAFETY`). |
| `/api/v1/search/programs` | `POST` | OpenSearch multi-faceted program search with PostgreSQL fallback. |
| `/api/v1/taxonomy/tree` | `GET` | Retrieves full UN M49 Geographic Catalog (Continents -> Regions -> Countries). |
| `/api/v1/comparison/countries` | `GET` | Live FX-normalized multi-country cost matrix (USD, EUR, GBP, MYR). |
| `/api/v1/outcomes/report` | `POST` | Submits student self-reported admit yield with IQR & Z-score outlier filtering. |

---

## 🧪 Verification & Testing

Run unit test suites and production build validation:

```bash
# Run NestJS Backend Unit Tests (3 Passed, 9/9 Tests)
npm test

# Build Backend Code Bundle
npm run build

# Build Next.js 16 Production Bundle (0 Errors, Turbopack Compiled)
cd frontend && npm run build
```

---

## 📄 License

MIT License. Designed and engineered for prospective students worldwide.
