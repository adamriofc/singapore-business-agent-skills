# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.0.0] - 2026-11-10

### Added
- **Singapore Jurisdictional Core Architecture**:
  - Full jurisdictional independence covering 6 complete enterprise domains: Tax (14 skills), HR (14 skills), Legal (14 skills), Finance (16 skills), Strategic (6 skills), Marketing (7 skills) — total 71 skills dan 64 computational engines.
  - Zero external runtime dependencies (`dependencies: {}`), powered strictly by Node.js standard library (`>=20.0.0`).
- **New Tax Domain Skills & Engines**:
  - `capital-allowance-sg`: Plant & machinery capital allowances under Sections 19, 19A, and Section 19A(10A) Low-Value Asset pooling up to S$30k per YA.
  - `dtl-foreign-tax-credit-sg`: Foreign tax credit relief (DTR and Commonwealth tax credit) under Sections 50 and 50A.
  - `eis-tax-sg`: Enterprise Innovation Scheme (EIS) 400% tax deduction on qualifying innovation spend up to statutory YA caps.
  - `group-relief-sg`: Singapore Group Relief loss transfer between qualifying 75% related corporate entities.
  - `loss-carry-sg`: Loss carry-forward and 1-year loss carry-back under Section 37E with substantial shareholding continuity test.
  - `pillar-two-dtt-sg`: Domestic Top-Up Tax (DTT) and Multinational Enterprise Top-Up Tax (MTT) under OECD Pillar Two GloBE 15% minimum effective tax rate.
  - `s13o-s13u-family-office-sg`: Fund tax exemptions under Sections 13O and 13U for Singapore single-family offices with MAS AUM and local spending tests.
  - `stamp-duty-absd-sg`: Buyer's Stamp Duty (BSD) and Additional Buyer's Stamp Duty (ABSD) tiering for residential and non-residential properties.
  - `tax-audit-risk-sg`: IRAS tax audit risk scoring and SP2DK-equivalent query defense indicators.
  - `tax-residency-sg`: Corporate and individual Singapore tax residency assessment under control & management test.
  - `transfer-pricing-sg`: Singapore transfer pricing guidelines, contemporaneous TPD threshold (S$10M turnover), and arm's length margin evaluations.
- **New HR & Manpower Domain Skills & Engines**:
  - `annual-leave-sg`: Statutory annual leave and child care leave entitlements under Employment Act Part IV.
  - `employment-contract-sg`: Key Employment Terms (KETs) compliance audit under Employment Act Section 95A.
  - `esop-tax-sg`: Tax treatment of Employee Share Ownership (ESOP) and Employee Share Options under Section 10(1)(g) and deemed exercise rules.
  - `flexible-work-arrangement-sg`: Tripartite Guidelines on Flexible Work Arrangement Requests (TG-FWAR) formal response and review protocol.
  - `itemised-payslip-sg`: Itemised payslips compliance under Employment Act Section 96A.
  - `medical-benefits-sg`: Statutory paid sick leave and hospitalization leave entitlements under Employment Act Section 89.
  - `maternity-paternity-leave-sg`: Government-Paid Maternity Leave (GPML) and Government-Paid Paternity Leave (GPPL) entitlement and reimbursement audit.
  - `non-compete-clause-sg`: Enforceability audit of restrictive covenants and restraint of trade clauses under Singapore common law.
  - `probation-notice-period-sg`: Contractual probation period evaluation and statutory notice period termination compliance.
  - `retrenchment-benefit-sg`: Tripartite Advisory on Managing Excess Manpower and statutory mandatory retrenchment notification to MOM.
  - `tdfw-discrimination-sg`: Tripartite Guidelines on Fair Employment Practices (TGFEP) and Workplace Fairness Legislation (WFL) audit.
- **New Legal & Corporate Governance Skills & Engines**:
  - `directors-resolution-sg`: Statutory directors' resolutions in writing (DRIW) and Section 157 fiduciary duty audit.
  - `dormant-company-sg`: Dormant company exemption criteria from financial statement preparation and AGM/AR filings.
  - `employment-claims-etac-sg`: Tripartite Alliance for Dispute Management (TADM) and Employment Claims Tribunal (ECT) jurisdiction audit.
  - `esg-sustainability-reporting-sg`: SGX and ACRA mandatory climate-related disclosures (CRD) aligned with ISSB standards.
  - `insolvency-winding-up-sg`: Insolvency, Restructuring and Dissolution Act (IRDA) 2018 statutory liquidation priority waterfall.
  - `ip-trademark-sg`: Singapore IPOS trademark classification, Nice Classification, and opposition assessment under Trade Marks Act 1998.
  - `nda-singapore`: Singapore law compliant Non-Disclosure Agreements with Trade Secrets Act remedies.
  - `pdpa-consent-management-sg`: PDPA 2012 consent obligation, deemed consent by contractual necessity, and purpose limitation audit.
  - `pdpa-cross-border-transfer-sg`: PDPA Transfer Limitation Obligation, BCRs, standard contractual clauses, and comparable protection assessment.
  - `shareholders-agreement-sg`: Pre-emption rights, tag-along, drag-along, and reserved matters under Singapore Companies Act.
  - `striking-off-sg`: ACRA Section 344A striking off eligibility audit for defunct private companies.
- **New Corporate Finance Domain Skills & Engines**:
  - `altman-zscore-sg`: Bankruptcy risk forecasting using Altman Z''-Score adapted for non-manufacturing and emerging market firms.
  - `break-even-analysis-sg`: Contribution margin and operating break-even volume/revenue analysis under SFRS cost accounting.
  - `burn-rate-runway-sg`: Monthly net cash burn rate and operational cash runway projection for high-growth tech ventures.
  - `cac-ltv-analysis-sg`: Customer Acquisition Cost (CAC), Lifetime Value (LTV), and CAC payback period metrics.
  - `capital-budgeting-sg`: Discounted cash flow (DCF), Net Present Value (NPV), and Internal Rate of Return (IRR) project appraisal.
  - `cash-flow-waterfall-sg`: Priority cash flow waterfall for senior debt, subordinated debt, and equity distributions.
  - `dscr-debt-covenant-sg`: Debt Service Coverage Ratio (DSCR), Interest Coverage Ratio (ICR), and debt covenant breach auditing.
  - `dupont-analysis-sg`: 3-stage and 5-stage DuPont Return on Equity (ROE) decomposition.
  - `fx-forward-hedging-sg`: Forward contract hedging calculations and covered interest rate parity for SGD currency exposure.
  - `goodwill-impairment-sg`: SFRS(I) 1-36 Impairment of Assets and Cash-Generating Unit (CGU) carrying value review.
  - `lease-accounting-sfrs16`: SFRS(I) 16 Leases Right-of-Use (ROU) asset and lease liability amortization schedule.
  - `revenue-recognition-sfrs115`: SFRS(I) 15 5-step revenue recognition model evaluation.
  - `saas-metrics-sg`: Monthly Recurring Revenue (MRR), Annual Recurring Revenue (ARR), and Net Retention Rate (NRR).
  - `vcc-distribution-waterfall`: Variable Capital Companies (VCC) Act fund distribution waterfall with European/American carried interest.
- **New Strategic Planning Skills & Engines**:
  - `ansoff-matrix-sg`: Ansoff Growth Vector evaluation adapted for Singapore regional market expansion.
  - `bcg-matrix-sg`: Boston Consulting Group Growth-Share Matrix portfolio classification.
  - `porter-five-forces-sg`: Industry competitive intensity evaluation under Michael Porter's Five Forces.
  - `scenario-planning-sg`: Strategic What-If sensitivity and scenario simulation modeling.
  - `swot-analysis-sg`: Quantitative Internal Factor Evaluation (IFE) and External Factor Evaluation (EFE) matrix.
- **New Growth Marketing Domain Skills & Engines**:
  - `ad-budget-allocation-sg`: Multi-channel marketing budget allocation across SEA digital channels.
  - `asas-advertising-code-sg`: Advertising Standards Authority of Singapore (ASAS) code and Consumer Protection (Fair Trading) Act compliance.
  - `cohort-retention-sg`: User cohort retention curve modeling and churn velocity forecasting.
  - `customer-segmentation-sg`: Firmographic and behavioral customer segmentation matrix.
  - `marketing-roi-attribution-sg`: Multi-touch attribution modeling (First-Touch, Last-Touch, Linear, Time-Decay).
  - `roas-cac-channel-sg`: Return on Ad Spend (ROAS) and Blended Customer Acquisition Cost evaluation.
  - `spam-control-act-sg`: Singapore Spam Control Act (Cap. 311A) unsolicited electronic marketing message compliance.
- **Enterprise Verification & Testing Infrastructure**:
  - 130 Golden Test Cases across 6 domains in `tests/golden/`.
  - Static Golden Corpus Test Runner (`tests/units/golden-corpus.test.js`) with 813 test assertions.
  - Total test assertions in `tests/`: 1,357 assertions (melampaui target 1.000+).
  - 3-Tier Benchmark Suite with 683 assertions across 130 cases and throughput of 150k - 350k+ ops/sec.
  - Fully verified Bubblewrap sandbox isolation (`scripts/sandbox-test.sh`).

### Removed
- Removed bilateral/cross-border residue modules (`dta-sg-id` and `cross-border-holding-sg-id`) to focus strictly on Singapore domestic regulatory jurisdiction.

---

## [1.0.0] - 2026-11-06

### Added
- **Taxation Domain (IRAS)**:
  - `cit-tax-sg`: Corporate Income Tax (CIT) 17% calculation incorporating Start-Up Tax Exemption (SUTE), Partial Tax Exemption (PTE), YA 2024 50% CIT Rebate, and CIT Rebate Cash Grant.
  - `gst-sg`: Goods & Services Tax (GST) calculation supporting statutory 9% rate (from 2024), 8% (2023), 7% (pre-2023), retrospective & prospective compulsory registration liability audit, and quarterly input/output GST return ledger.
  - `wht-sg`: Statutory Withholding Tax (WHT) under Income Tax Act Sections 45, 45A, and 45D (interest 15%, royalties 10%, technical service fees 17%, director fees 24%).
  - `dta-sg-id`: Singapore-Indonesia Double Tax Agreement (DTA) bilateral relief engine for dividends (Art 10: 10%), interest (Art 11: 10%), royalties (Art 12: 10%), and independent personal services (Art 14).
- **Human Resources & Manpower Domain (MOM & CPF)**:
  - `cpf-calculator`: Central Provident Fund (CPF) calculation with statutory progressive Ordinary Wage (OW) ceiling transition ($6,800 in 2024, $7,400 in 2025, $8,000 in 2026), age brackets, Additional Wage (AW) ceiling cap, Skills Development Levy (SDL), and ethnic self-help group funds (CDAC, MBMF, SINDA, ECF).
  - `mom-overtime`: Employment Act 1968 Part IV coverage evaluation, 1.5x basic rate overtime pay calculation, statutory 72-hour monthly OT limit and 12-hour daily work limit compliance audit, and annual leave entitlement.
  - `compass-scoring`: MOM Complementarity Assessment Framework (COMPASS) deterministic evaluation for Employment Pass (EP) eligibility across 4 foundational criteria (Salary, Qualifications, Diversity, Support for Local Employment) and 2 bonus criteria (Skills Bonus, Strategic Economic Priorities).
  - `foreign-workforce-quota`: Dependency Ratio Ceiling (DRC) and S-Pass sub-quota calculation across Services, Manufacturing, Construction, Process, and Marine Shipyard sectors, with Foreign Worker Levy (FWL) tiering.
- **Corporate Governance & Legal Domain (ACRA & PDPA)**:
  - `acra-statutory-deadlines`: Companies Act 1967 statutory AGM and Annual Return (AR) filing deadline calculations for private non-listed and public listed companies, late filing penalty audit, and Sections 145/171 governance compliance check.
  - `small-company-audit`: Small Company Audit Exemption evaluation under the Thirteenth Schedule of the Companies Act 1967 (revenue <= S$10M, assets <= S$10M, employees <= 50) including 2-of-3 consecutive years rule and corporate group consolidation test.
  - `pdpa-breach-notification`: Personal Data Protection Act 2012 (Part VIA) mandatory data breach notification evaluation (72-hour statutory deadline to PDPC), significant harm and significant scale (>=500 individuals) triggers, and turnover-based penalty ceiling.
- **Corporate Finance Domain (MAS & SFRS)**:
  - `sora-wacc`: Corporate Weighted Average Cost of Capital (WACC) using the Singapore Overnight Rate Average (SORA) benchmark rate, CAPM cost of equity, and 17% CIT debt tax shield.
  - `working-capital-sg`: Working capital efficiency, liquidity ratios (Current, Quick, Cash ratios), and Cash Conversion Cycle (DSO, DIO, DPO) under Singapore Financial Reporting Standards (SFRS).
- **Strategic Planning & Cross-Border Domain**:
  - `enterprise-grant-sg`: Enterprise Singapore (EnterpriseSG) and IMDA grant co-funding evaluation for Enterprise Development Grant (EDG), Productivity Solutions Grant (PSG), and Market Readiness Assistance (MRA).
  - `cross-border-holding-sg-id`: Cross-border holding structure optimization comparing Direct Investment vs Singapore Holding Company intermediary under the SG-ID DTA, Section 13(8) foreign-sourced dividend tax exemption, Single-Tier 0% outbound dividend tax, and Section 13W capital gains safe harbour.
- **Security & Integrity Infrastructure**:
  - 100% zero external runtime dependencies (`dependencies: {}`).
  - Cryptographic SHA-256 trust anchor verification for statutory rulesets (`SHA256SUMS.txt`).
  - Closed payload security boundaries for prompt injection defense (`engines/security-sanitizer.js`).
  - 18-Check Automated Release Gate (`scripts/validate-release.js`).
  - Bubblewrap unprivileged sandbox testing runner (`scripts/sandbox-test.sh`).
  - Production CLI binary (`bin/sg-agent-skills.js`).
  - Comprehensive TypeScript type definitions (`index.d.ts`).
