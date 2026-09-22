# ✅ Master Task Checklist (Categories A, B, C & D) — Zero-Auth Architecture

---

## 🔷 Phase 1: Database Schema Expansion (Backend First)

- [ ] **1.1. Schema Modifications (`prisma/schema.prisma`)**:
  - [ ] Add ECTS prerequisite fields to `ProgramRequirement`:
    - `minMathEcts` (Float @default(0.0))
    - `minCsEcts` (Float @default(0.0))
    - `minTheoreticalEcts` (Float @default(0.0))
    - `acceptsMoiEnglishWaiver` (Boolean @default(false))
  - [ ] Add Document & Application rules to `Program`:
    - `sopMaxWords` (Int @default(1000))
    - `lorAcademicCount` (Int @default(2))
    - `lorProfessionalCount` (Int @default(0))
    - `cvFormatRequired` (String @default("STANDARD")) // e.g. "EUROPASS", "STANDARD_1PAGE"
    - `portfolioRequired` (Boolean @default(false))
  - [ ] Add Statutory Proof of Funds & Visa fields to `CountryWorkAndVisaProfile`:
    - `monthlyBlockedAccountLocal` (Float @default(0.0))
    - `blockedAccountCurrency` (String @default("EUR"))
    - `proofOfFundsMonths` (Int @default(12))
    - `requiresApsCertificate` (Boolean @default(false))
    - `anabinRecognitionType` (String @default("H+")) // e.g. "H+", "H+/-"
    - `uniAssistVpdRequired` (Boolean @default(false))
  - [ ] Add Geospatial Coordinates to `Campus`:
    - `latitude` (Float @default(0.0))
    - `longitude` (Float @default(0.0))
- [ ] **1.2. Database Sync & Seeding**:
  - [ ] Push schema to PostgreSQL: `npx prisma db push`
  - [ ] Update `prisma/seed.ts` to populate all new fields across 10 countries and 25+ university programs (e.g. TUM, TU Delft, Oxford, NUS, TU Munich, Monash Malaysia)
  - [ ] Execute database seed: `npm run prisma:seed`

---

## 🔷 Phase 2: Backend API & Business Logic Implementation

- [ ] **2.1. Category A: Academic & Credential Evaluation Engine**:
  - [ ] Update `MatchRequestDto` to support:
    - `mathEcts?: number`
    - `csEcts?: number`
    - `theoryEcts?: number`
    - `creditScale?: 'ECTS' | 'US_SEMESTER' | 'INDIAN_SEMESTER' | 'UK_CATS'`
    - `undergradTaughtInEnglish?: boolean`
    - `applicantCountryIsoCode?: string`
  - [ ] Create ECTS credit normalizer utility in `server/common/utils/credit-converter.util.ts`
  - [ ] Implement ECTS prerequisite compatibility checking logic in `MatchingService` (`PREREQUISITES_SATISFIED`, `CONDITIONAL_BRIDGE_ELIGIBLE`, `HARD_PREREQUISITE_DEFICIT`)
  - [ ] Implement APS certificate and Anabin verification flag resolution in `MatchingService` and `TaxonomyService`
- [ ] **2.2. Category B: Financial Aid, Living Costs & Proof of Funds**:
  - [ ] Implement `getProofOfFundsMatrix()` in `CurrencyService`:
    - Returns statutory escrow minimums, mandatory insurance buffers, and discretionary costs converted live to user currency
    - Calculates exact net blocked account amount after deducting scholarship awards
  - [ ] Expose endpoint: `GET /api/v1/comparison/proof-of-funds?currency=USD&countryCodes=DE,NL,GB,US`
  - [ ] Implement `estimateLoanEligibility()` in `CurrencyService` based on university ranking and degree level
  - [ ] Expose endpoint: `GET /api/v1/comparison/loans`
- [ ] **2.3. Category C: Application Document & MOI Waiver Intelligence**:
  - [ ] Implement MOI English waiver evaluation logic in `MatchingService` (waives language requirements when `undergradTaughtInEnglish = true` and program supports it)
  - [ ] Include document checklist details (`sopMaxWords`, `lorAcademicCount`, `cvFormatRequired`, `portfolioRequired`) in `UniversityService`, `SearchService`, and `MatchingService`
- [ ] **2.4. Category D: Visual & Geographic Intelligence**:
  - [ ] Expose geospatial coordinates (`latitude`, `longitude`, `city`, `countryCode`) in `TaxonomyService.getGeographicProgramsTree()` and `SearchService.searchPrograms()`
- [ ] **2.5. Backend Testing & Build Validation**:
  - [ ] Write unit tests for ECTS conversion, MOI waiver logic, and Proof-of-Funds calculations
  - [ ] Run `npm test` and `npm run build`

---

## 🔷 Phase 3: Frontend UI/UX Implementation (Zero-Auth)

- [ ] **3.1. API Client Updates (`frontend/src/lib/api-client.ts`)**:
  - [ ] Add TypeScript interfaces for ECTS prerequisites, Credential/APS metadata, Proof of Funds breakdown, Loan estimation, and Document checklist
  - [ ] Add API helper functions: `fetchProofOfFundsMatrix()` and `fetchLoanEstimate()`
- [ ] **3.2. Category A Frontend (Match Engine & Program Cards)**:
  - [ ] Add "Undergrad Degree 100% in English (MOI)" toggle on `/match`
  - [ ] Add expandable "ECTS Prerequisite Checker" with credit scale dropdown on `/match`
  - [ ] Add visual badges for APS Certificate and Anabin H+ verification on program cards and detail drawers
- [ ] **3.3. Category B Frontend (Country Matrix & ROI Modal)**:
  - [ ] Add dedicated "Statutory Blocked Account & Visa Proof-of-Funds (Sperrkonto)" matrix cards on `/comparison`
  - [ ] Integrate "No-Cosigner International Loan Estimator (MPOWER/Prodigy)" inside `ROICalculatorModal.tsx`
- [ ] **3.4. Category C Frontend (Document Checklist)**:
  - [ ] Add "Application Documents & Word Counts" checklist section with LOR and SOP requirements inside the program details drawer
- [ ] **3.5. Category D Frontend (Interactive Map & PDF Export)**:
  - [ ] Add 3rd View Toggle: `🗺️ Interactive Global Map View` on `/search` with SVG/Leaflet interactive pins, tuition tooltips, and cluster zoom
  - [ ] Add "Download Comparison PDF" & "Copy Shareable Link" (`?compare=id1,id2`) in `ShortlistDrawer.tsx`
  - [ ] Implement URL parameter listener on page load to automatically restore shortlisted comparison from shared links

---

## 🔷 Phase 4: Quality Assurance & Production Build

- [ ] Run full backend test suite (`npm test`)
- [ ] Build backend bundle (`npm run build`)
- [ ] Build Next.js 16 frontend bundle (`cd frontend && npm run build`)
- [ ] Verify complete zero-auth user journeys across all 4 categories
