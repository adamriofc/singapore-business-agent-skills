# Singapore Business Agent Skills (SBAS)

[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL_3.0-blue.svg)](LICENSE)
[![Zero Dependencies](https://img.shields.io/badge/dependencies-0-success.svg)](package.json)
[![Node.js Support](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)](package.json)
[![Security Tested](https://img.shields.io/badge/security-hardened-purple.svg)](SECURITY.md)

Production-grade, zero-dependency AI domain-intelligence infrastructure for Singapore corporate legal (ACRA), tax (IRAS), human resources & employment (MOM / CPF), data protection (PDPA), corporate finance (SORA WACC), and cross-border Singapore-Indonesia corporate governance.

---

## 🏛️ Overview & Doctrine

`singapore-business-agent-skills` menyediakan 15 computational engine deterministik dan 15 machine-readable agent skills untuk agen AI otonom, sistem ERP, dan platform corporate secretarial di Singapura.

### Core Architecture Principles:
1. **Zero External Runtime Dependencies (`dependencies: {}`)**: Dibangun 100% dengan standard library murni Node.js (>=20.0.0). Kebal terhadap supply-chain attacks, dependency bloat, dan monkey-patching.
2. **100% Deterministic Computation**: Mengeliminasi risiko halusinasi matematis LLM pada komputasi pajak, CPF, COMPASS, kuota tenaga kerja, dan penalti statuter.
3. **Cryptographic SHA-256 Ruleset Trust Anchor**: Seluruh parameter dan tabel statuter (IRAS, MOM, CPF, ACRA) dikunci kriptografis melalui `SHA256SUMS.txt`.
4. **Closed Payload Prompt Injection Isolation**: Mengamankan input agen dari prompt injection, jailbreaks, dan token delimiter spoofing.
5. **Universal Dual-Execution**: Dapat dijalankan sebagai Node.js module library maupun CLI binary interaktif (`sg-agent-skills` / `sbas`).

---

## 📦 Bundles & Computational Engines

| Domain Bundle | Engine Name | Statutory Mandate / Legal Reference |
|---|---|---|
| **tax-sg** | `calculateSingaporeCit` | Singapore Income Tax Act 1947 Sec 43 (17% CIT, SUTE, PTE, Rebate) |
| **tax-sg** | `calculateGstFiling` / `evaluateGstRegistrationLiability` | Goods and Services Tax Act 1993 (9% GST, Retrospective/Prospective) |
| **tax-sg** | `calculateSingaporeWht` | Income Tax Act 1947 Sec 45, 45A, 45D (Withholding Tax) |
| **tax-sg** | `evaluateDtaSgIdRelief` | Singapore-Indonesia Double Tax Agreement (DTA) Articles 10, 11, 12, 14 |
| **hr-sg** | `calculateSingaporeCpf` | Central Provident Fund Act 1953 (OW Ceilings $6.8k-$8.0k, SDL, SHG) |
| **hr-sg** | `calculateMomOvertimeAndCompliance` | Employment Act 1968 Part IV (1.5x OT, 72h Monthly Cap, Leave) |
| **hr-sg** | `evaluateCompassEpEligibility` | MOM Complementarity Assessment Framework (COMPASS - 40 pts threshold) |
| **hr-sg** | `calculateForeignWorkforceQuota` | Employment of Foreign Manpower Act (DRC, S-Pass Sub-DRC, FWL) |
| **legal-sg** | `calculateAcraStatutoryDeadlines` | Companies Act 1967 Sec 175 & 197 (AGM/AR Deadlines, Sec 145/171) |
| **legal-sg** | `evaluateSmallCompanyAuditExemption` | Companies Act 1967 Thirteenth Schedule (Small Company & Group Test) |
| **legal-sg** | `evaluatePdpaBreachNotification` | Personal Data Protection Act 2012 Part VIA (72h Notice, 10% Turnover Cap) |
| **finance-sg** | `calculateSingaporeWacc` | MAS SORA Benchmark & Corporate WACC with 17% CIT Debt Tax Shield |
| **finance-sg** | `calculateSingaporeWorkingCapital` | Singapore Financial Reporting Standards (SFRS) Liquidity & CCC |
| **strategic-sg** | `evaluateEnterpriseGrant` | Enterprise Singapore (EnterpriseSG) EDG, MRA, PSG Co-Funding |
| **strategic-sg** | `evaluateCrossBorderHoldingStructure` | SG-ID DTA Art 10, ITA Sec 13(8) FSIE, Single-Tier & Sec 13W Safe Harbour |

---

## 🚀 Installation & Usage

### Node.js Library

```javascript
const sbas = require('singapore-business-agent-skills');

// 1. Calculate Corporate Income Tax (CIT) for Qualifying Startup
const cit = sbas.calculateSingaporeCit({
  chargeableIncome: 180000,
  isQualifyingStartup: true,
  yearOfAssessment: 2024,
  hasLocalEmployeeWithCpf: true
});
console.log(`Net CIT Payable: S$${cit.netTaxPayableSgd}`);

// 2. Calculate CPF Contributions with 2024-2026 Ceiling Rules
const cpf = sbas.calculateSingaporeCpf({
  ordinaryWage: 6500,
  age: 32,
  residentialStatus: 'CITIZEN',
  calendarYear: 2024
});
console.log(`Employee CPF: S$${cpf.contributions.employeeCpfSgd}, Employer CPF: S$${cpf.contributions.employerCpfSgd}`);

// 3. Evaluate MOM COMPASS Score for Employment Pass (EP)
const compass = sbas.evaluateCompassEpEligibility({
  monthlySalarySgd: 8500,
  candidateAge: 29,
  sector: 'NON_FINANCIAL_SERVICES',
  salaryPercentileRank: 'P90_AND_ABOVE',
  qualificationLevel: 'TOP_TIER'
});
console.log(`COMPASS Score: ${compass.totalCompassScore} pts (Passed: ${compass.isPassMarkMet})`);

// 4. Verify Cryptographic Integrity of All Rulesets
const integrity = sbas.verifyAllRulesets();
console.log(`Integrity Status: ${integrity.status} (${integrity.verifiedCount} rulesets verified)`);
```

### Command Line Interface (CLI)

```bash
# Calculate Corporate Income Tax
sg-agent-skills cit --income=150000 --startup=true

# Calculate CPF Contributions
sg-agent-skills cpf --ow=6500 --age=30 --status=CITIZEN

# Evaluate MOM COMPASS Score
sg-agent-skills compass --salary=6000 --age=28 --sector=NON_FINANCIAL_SERVICES

# Calculate ACRA Filing Deadlines
sg-agent-skills acra --fye=2025-12-31 --listed=false

# Verify SHA-256 Ruleset Integrity
sg-agent-skills integrity
```

---

## 🛡️ Security & Sandbox Testing

Repositori ini mendukung pengujian mandiri dalam unprivileged Linux sandbox menggunakan Bubblewrap (`bwrap`):

```bash
# Run unit tests inside Bubblewrap sandbox
npm run test:sandbox

# Run isolated package smoke test
npm run test:smoke

# Run security & prompt injection suite
npm run test:security

# Run automated release gate (18-Check Pipeline)
npm run validate:release
```

---

## 📜 License

Didistribusikan di bawah lisensi GNU Affero General Public License v3.0 (AGPL-3.0). Lihat berkas [LICENSE](LICENSE) untuk rincian lengkap.
