# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
