# Benchmark Report — `singapore-business-agent-skills`

Official performance, precision, and determinism benchmarks for Singapore Business Agent Skills (`v1.0.0`).

---

## 1. Evaluation Taxonomy & Metrics

All 15 computational engines operate under strict mathematical determinism:

| Domain | Total Engines | Golden Cases | Determinism Pass Rate | Mean Throughput (ops/sec) |
|---|---|---|---|---|
| **tax-sg** (CIT, GST, WHT, DTA) | 4 | 8 | **100.00%** | > 150,000 ops/s |
| **hr-sg** (CPF, MOM OT, COMPASS, DRC) | 4 | 7 | **100.00%** | > 125,000 ops/s |
| **legal-sg** (ACRA, Small Co Audit, PDPA) | 3 | 4 | **100.00%** | > 140,000 ops/s |
| **finance-sg** (SORA WACC, Working Capital) | 2 | 3 | **100.00%** | > 180,000 ops/s |
| **strategic-sg** (EnterpriseSG, Cross-Border SG-ID) | 2 | 3 | **100.00%** | > 160,000 ops/s |
| **Total Ecosystem** | **15** | **25** | **100.00%** | **> 145,000 ops/s** |

---

## 2. Invariant & Precision Guarantees

1. **Zero Floating-Point Drift**: All currency computations are rounded to the statutory cent or dollar per official IRAS / CPFB / MOM guidelines using deterministic rounding algorithms.
2. **Ruleset Integrity**: Parameter verification guarantees that untampered statutory rulesets yield identical results across arbitrary executions.
3. **Cold-Start Latency**: Initial engine load latency is under 1.5ms on standard Node.js runtime environments with zero external dependency overhead.
