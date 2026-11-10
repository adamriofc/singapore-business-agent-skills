# Release & Deployment Protocol — `singapore-business-agent-skills`

## Automated 18-Check Release Gate Pipeline

The repository enforces a strict, automated 18-check integrity gate prior to tagging or publishing a release (`v2.0.0`):

1. **Version Alignment**: Synchronization across `package.json`, `package-lock.json`, `registry/index.json`, `bundles/*.json`, and `canonical-metadata.json` (v2.0.0).
2. **CHANGELOG Verification**: Presence of the release entry `## [2.0.0]` in `CHANGELOG.md`.
3. **Plugin Count**: Strict verification of canonical plugin count (6 plugins: tax-sg, hr-sg, legal-sg, finance-sg, strategic-sg, marketing-sg).
4. **Skill Count**: Strict verification of machine-readable skill count (71 skills).
5. **Engine Count**: Strict verification of computational engine count (64 engines).
6. **Golden Test Corpus**: Execution and verification of 130 golden test cases across 6 domains.
7. **Benchmark Artifact**: Validation of `docs/benchmark-results/latest.json`.
8. **SHA-256 Integrity**: Verification of all 8 statutory ruleset hashes against `SHA256SUMS.txt`.
9. **Dynamic Schema Validation**: YAML frontmatter and plugin schema audit across all 71 skills (`tests/schema/validator.test.js`).
10. **Stale Taxonomy Check**: Prevention of deprecated or cross-jurisdictional references.
11. **Production & Governance Files**: Existence of all 11 required governance and operational documentation files.
12. **Git Cleanliness**: Workspace status and uncommitted changes audit.
13. **BENCHMARK.md Version Alignment**: Consistency with `canonical-metadata.json` (v2.0.0).
14. **Dependency Security Audit**: Zero external runtime dependencies (`dependencies: {}`) and zero vulnerabilities on `npm audit --audit-level=high`.
15. **Benchmark Semantic Alignment**: Validation of 6 domain counts in benchmark artifacts.
16. **Release Manifest & Tag Provenance**: Non-self-referencing lineage tracking via `release-manifest.json` (v2.0.0).
17. **Agent Capability Contract Validation**: Structural validation of `registry/capabilities.json` (71 capability contracts).
18. **Suite Bundle Integrity**: Cross-validation of `bundles/*.json` against canonical plugins and capabilities (`scripts/validate-suite.js`).
