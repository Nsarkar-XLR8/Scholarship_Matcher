# 📋 ScholarMatch Master Feature Plan: Categories A, B, C & D (Zero-Auth Architecture)

## 🎯 Architectural Philosophy & Constraints
1. **100% Zero-Authentication & Zero-Authorization**:
   - No user sign-ups, no login walls, no JWT/sessions, no database user tables, and no personally identifiable information (PII) collection.
   - All state is managed client-side via `localStorage`, React Context, and URL deep-linking query parameters.
   - Program comparisons and shortlisted matches are shared using stateless URL parameters (e.g., `/search?compare=id1,id2,id3`).
2. **Data-Honest & Edge-Case Resilient**:
   - Every mathematical calculation (credit conversion, proof-of-funds, scholarship offsets, currency volatility) incorporates edge cases, fallback defaults, and conditional thresholds.
3. **Public API Protection**:
   - Token-bucket IP rate limiting (100 req/min via NestJS Throttler + Redis) and SHA-256 client fingerprint hashing for anonymous crowdsourced outcome submissions.

---

## 🔍 Deep Breakdown by Feature & Edge Cases

---

### 🏛️ Category A: Academic & Credential Evaluation Engine

#### Feature A1: ECTS Credit Prerequisite Compatibility Checker
* **Overview**: Evaluates undergraduate coursework credits against hard prerequisite barriers for European & international master's programs.
* **Core Logic**:
  * Program schema defines minimum credits required in key subject areas: Mathematics/Statistics (`minMathEcts`), Computer Science/Core Technical (`minCsEcts`), and Theoretical Foundations (`minTheoreticalEcts`).
  * Student can input credits in multiple international systems:
    * **ECTS (European Standard)**: $1.0\times$ multiplier.
    * **US Semester Credit Hours**: $1.0\text{ US Credit} \approx 1.5\text{ ECTS}$ (or configurable ratio).
    * **Indian / Asian Semester Credits**: $1.0\text{ Indian Credit} \approx 1.5\text{ ECTS}$.
    * **UK CATS Credits**: $2.0\text{ CATS} = 1.0\text{ ECTS}$.
* **Edge Cases & Corner Cases**:
  * **Blank / Unspecified Inputs**: If the user leaves credit fields empty, the engine gracefully bypasses the credit check without disqualifying non-technical programs (MBA, Public Policy, Management).
  * **Bridge Course / Conditional Allowance**:
    * If credit deficit is $\le 15\text{ ECTS}$, classify as `CONDITIONAL_BRIDGE_ELIGIBLE` with a clear notice: *"Eligible with up to 2 preparatory bridge courses in Semester 1"*.
    * If credit deficit is $> 15\text{ ECTS}$, classify as `HARD_PREREQUISITE_DEFICIT`.
    * If requirements are fully met, classify as `PREREQUISITES_SATISFIED`.
  * **Non-Technical Fields**: For humanities and holistic business degrees, `minMathEcts = 0`, automatically returning `PREREQUISITES_SATISFIED`.

#### Feature A2: APS Certificate & Degree Recognition Engine (Anabin & uni-assist VPD)
* **Overview**: Informs international students of mandatory regulatory verification procedures specific to destination countries and applicant nationalities.
* **Core Logic**:
  * Germany requires **APS (Akademische Prüfstelle)** certificates for applicants with undergraduate degrees from **India, China, and Vietnam**.
  * Recognizes whether an applicant's university has **Anabin H+** accreditation (full state recognition) vs **H+/-** (conditional).
  * Distinguishes between universities requiring **uni-assist Vorprüfungsdokumentation (VPD)** vs **Direct University Portal** applications.
* **Edge Cases & Corner Cases**:
  * **Non-APS Applicants**: For applicants from countries outside India/China/Vietnam applying to Germany, APS status is cleanly flagged as `NOT_APPLICABLE` rather than confusing the applicant.
  * **3-Year vs 4-Year Bachelor's Degrees**: Informs students whether 3-year European/Bologna-compliant degrees are accepted directly or require WES course-by-course evaluation.

---

### 💰 Category B: Financial Aid, Living Costs & Proof of Funds

#### Feature B1: Statutory Blocked Account (Sperrkonto / Proof of Living Funds) Calculator
* **Overview**: Calculates legally required locked escrow deposits and statutory living proof-of-funds for international student visa issuance.
* **Regulatory Country Standards**:
  * **Germany (Sperrkonto)**: €992/month $\times$ 12 months = **€11,904/year**.
  * **Netherlands (IND Proof of Funds)**: €1,208/month $\times$ 12 months = **€14,500/year**.
  * **United Kingdom (UKVI Maintenance)**:
    * Outside London: £1,023/month $\times$ 9 months = **£9,207**.
    * Inside London: £1,334/month $\times$ 9 months = **£12,006**.
  * **Sweden (Migrationsverket)**: SEK 10,350/month $\times$ 10 months = **SEK 103,500/year**.
  * **France (OFII Minimum)**: €615/month $\times$ 12 months = **€7,380/year**.
  * **Australia (Subclass 500)**: AUD 29,710/year.
  * **Canada (Study Permit Living Cost)**: CAD 20,635/year (outside Quebec).
  * **United States (I-20 Proof of Funds)**: Full 1st Year Tuition + Living (approx. $22,000–$30,000).
* **Edge Cases & Corner Cases**:
  * **Scholarship Offset Deduction**: If a student is awarded a partial or full scholarship, the required statutory blocked deposit is **deducted dollar-for-dollar** by the scholarship stipend amount! (e.g., DAAD full scholarship reduces Germany Sperrkonto requirement to **€0**).
  * **Live Multi-Currency FX Conversion**: Converts the statutory local amount into any of 8 user-selected currencies (`USD`, `EUR`, `GBP`, `CAD`, `AUD`, `SEK`, `SGD`, `MYR`) and displays a recommended **3% FX volatility buffer**.
  * **Discretionary vs Statutory Living Costs**: Clearly differentiates between the legally required escrow deposit vs estimated real-world student living expenses.

#### Feature B2: No-Cosigner International Loan & Aid Eligibility Estimator
* **Overview**: Provides realistic non-collateral, no-cosigner loan eligibility calculations for international master's students (modeled on global lenders like MPOWER Financing and Prodigy Finance).
* **Core Logic**:
  * Evaluates university eligibility based on QS/Times World Ranking (typically top 500), degree level (STEM / MBA / Finance preferred), and country.
  * Estimates maximum loan borrowing capacity: $\text{Max Loan} = \text{Total Cost of Attendance} - \text{Scholarships Received}$.
  * Calculates estimated post-graduation monthly loan repayments assuming realistic 10-year repayment terms and prevailing interest rates ($11.5\%–13.5\%$).
* **Edge Cases & Corner Cases**:
  * **Non-Eligible Universities**: If an institution is not on supported lending lists, clearly displays: *"Institutional or local co-signer loans required"*.
  * **Zero-Auth Privacy**: All loan calculations are 100% client-side and informative — zero credit checks, zero lead capture, zero third-party tracking.

---

### 📝 Category C: Application Document & Essay Intelligence

#### Feature C1: Program Document Checklist & Word-Count Rules
* **Overview**: Provides transparent, structured document preparation guidelines for each specific university program.
* **Core Logic**:
  * **Statement of Purpose (SOP)**: Word count limits (e.g., 500 words, 1,000 words, 2 pages) and specific essay prompt outlines.
  * **Letters of Recommendation (LOR)**: Exact count split between **Academic LORs** (professors) and **Professional LORs** (managers/industry).
  * **CV / Resume Standard**: Specifies whether standard 1-page US resume or European **Europass CV** format is required.
  * **Portfolio / GitHub Requirement**: Flags mandatory portfolio/code repository submissions for Computer Science, AI, and Architecture programs.
* **Edge Cases & Corner Cases**:
  * Differentiates between **Strict Mandatory** vs **Optional/Recommended** documents (e.g. GRE optional, 3rd LOR optional).

#### Feature C2: English Medium of Instruction (MOI) Waiver Detector
* **Overview**: Detects whether an applicant whose previous degree was taught 100% in English can legally waive costly IELTS / TOEFL / PTE exams.
* **Core Logic**:
  * University and program schema tracks `acceptsMoiEnglishWaiver` (boolean) and eligible criteria.
  * Student selects the checkbox: *"My undergraduate degree was 100% English-medium (MOI)"*.
  * Matching engine re-evaluates language requirements: if the university supports MOI, language qualification status transitions from `DISQUALIFIED` / `REACH` $\rightarrow$ `QUALIFIED`.
* **Edge Cases & Corner Cases**:
  * **Selective MOI Acceptance**: Certain elite programs (e.g. Oxford, Cambridge, ETH Zurich) mandate IELTS/TOEFL regardless of previous MOI. The engine displays: *"Strict Test Mandate: MOI Waiver Not Permitted by Department"*.
  * **Documentation Reminder**: Displays clear guidance: *"Must submit official Medium of Instruction letter issued by Registrar/Dean"*.

---

### 🗺️ Category D: Visual & Geographic Intelligence

#### Feature D1: Interactive Global Geospatial University Map View
* **Overview**: Provides an interactive, responsive world map view on `/search` allowing prospective students to explore university campuses, public tuition-free institutions, and scholarship clusters globally.
* **Core Logic**:
  * Campus schema stores exact geospatial coordinates (`latitude`, `longitude`, `city`, `countryCode`).
  * Seamless 3-way view switcher on `/search`:
    1. **UN M49 Geographic Tree View** (Hierarchical Accordion).
    2. **Faceted Filter Grid View** (Cards with score meters).
    3. **Global Geospatial Map View** (Interactive interactive world map with university cluster pins).
  * Interactive map features:
    * Hover tooltip displaying University Name, City, Country, Annual Tuition, and Active Scholarships.
    * Click pin to open Program Drawer with instant application links.
    * Tuition-free public university filter (highlighting Germany, Norway, France).
* **Edge Cases & Corner Cases**:
  * **Multi-Campus Universities**: Correctly plots distinct campus pins for satellite locations (e.g., NYU Main Campus vs Abu Dhabi; Monash Australia vs Malaysia Campus).
  * **Mobile Touch Scroll Isolation**: Implements `data-lenis-prevent="true"` so map panning/zooming does not interfere with parent page smooth scrolling.

#### Feature D2: Shortlist Comparison Export (PDF & Shareable URL)
* **Overview**: Enables prospective students to export their side-by-side shortlisted comparison matrix as a shareable link or print-ready PDF summary for sponsors, parents, or academic advisors.
* **Core Logic**:
  * **Stateless URL Sharing**: Generates shareable URL with encoded program IDs (e.g. `https://scholarmatch.io/search?view=grid&compare=prog-de-tum-cs,prog-nl-delft-ds`). Opening the link instantly populates the Shortlist context and launches the comparison matrix.
  * **Print-Optimized Layout**: Includes `@media print` CSS stylesheet formatting the comparison table with vector logos, crisp typography, clean page breaks, and zero modal UI clutter.
* **Edge Cases & Corner Cases**:
  * **Empty / Invalid IDs in URL**: Gracefully filters out stale or invalid program IDs in query strings without throwing runtime errors.
  * **Local Storage Sync**: Opening a shared link merges foreign program IDs into the user's local shortlist if space permits ($\le 4$ items).
