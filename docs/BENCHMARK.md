# Benchmark Report — `singapore-business-agent-skills`

Official performance, precision, and determinism benchmarks for Singapore Business Agent Skills (`v2.0.0`).

---

## 1. Evaluation Taxonomy & Metrics

All 64 computational engines operate under strict mathematical determinism across 6 domains:

| Domain | Total Engines | Golden Cases | Benchmark Assertions | Determinism Pass Rate | Mean Throughput (ops/sec) | Latency (avg / p99) |
|---|---|---|---|---|---|---|
| **tax-sg** (CIT, GST, WHT, Capital Allowances, EIS, S13O/U, Pillar Two, etc.) | 14 | 25 | 134 | **100.00%** | > 185,000 ops/s | 0.0054 ms / 0.0427 ms |
| **hr-sg** (CPF, COMPASS, Overtime, DRC Quota, KETs, ESOP, Leaves, etc.) | 13 | 25 | 132 | **100.00%** | > 155,000 ops/s | 0.0064 ms / 0.0312 ms |
| **legal-sg** (ACRA, Small Co Audit, PDPA, IRDA, ESG, IPOS, etc.) | 13 | 22 | 114 | **100.00%** | > 345,000 ops/s | 0.0029 ms / 0.0085 ms |
| **finance-sg** (SORA WACC, DCF, SFRS 15/16, VCC, SaaS, Z''-Score, etc.) | 13 | 25 | 133 | **100.00%** | > 160,000 ops/s | 0.0062 ms / 0.0407 ms |
| **strategic-sg** (EnterpriseSG Grants, Ansoff, BCG, Porter 5 Forces, etc.) | 5 | 15 | 80 | **100.00%** | > 305,000 ops/s | 0.0032 ms / 0.0086 ms |
| **marketing-sg** (ASAS, Spam Control, Retention, ROAS, CAC/LTV, etc.) | 6 | 18 | 90 | **100.00%** | > 350,000 ops/s | 0.0028 ms / 0.0076 ms |
| **Total Ecosystem** | **64** | **130** | **683** | **100.00%** | **> 250,000 ops/s** | **< 0.0045 ms / 0.0232 ms** |

---

## 2. Invariant & Precision Guarantees

1. **Zero Floating-Point Drift**: All monetary and percentage calculations employ deterministic arithmetic rounding conforming precisely to IRAS, CPF Board, MOM, and ACRA statutory mandates.
2. **Ruleset Integrity**: 8 official statutory JSON rulesets are protected via SHA-256 trust anchors verified before engine initialization.
3. **Cold-Start Latency**: Initial engine load latency is under 0.8ms on standard Node.js runtime environments (`>=20.0.0`) with zero external dependency overhead (`dependencies: {}`).
4. **Three-Tier Benchmark Harness**: Every release executes Tier 1 accuracy verification, Tier 2 determinism multi-run validation (3x identical output verification), and Tier 3 high-throughput stress testing.
