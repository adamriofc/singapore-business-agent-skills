# Release & Deployment Protocol — `singapore-business-agent-skills`

## Automated 18-Check Release Gate Pipeline

The repository enforces a strict, automated 18-check integrity gate prior to tagging or publishing a release:

1. **Version Alignment**: Synchronization across `package.json`, `package-lock.json`, `registry/index.json`, and `canonical-metadata.json`.
2. **CHANGELOG Verification**: Presence of the version release entry in `CHANGELOG.md`.
3. **Plugin Count**: Strict verification of canonical plugin count (5 plugins).
4. **Skill Count**: Strict verification of machine-readable skill count (15 skills).
5. **Engine Count**: Strict verification of computational engine count (15 engines).
6. **Golden Test Corpus**: Execution and verification of golden cases.
7. **Benchmark Artifact**: Validation of `docs/benchmark-results/latest.json`.
8. **SHA-256 Integrity**: Verification of all 8 statutory ruleset hashes against `SHA256SUMS.txt`.
9. **Dynamic Schema Validation**: YAML frontmatter and plugin schema audit (`tests/schema/validator.test.js`).
10. **Stale Taxonomy Check**: Prevention of deprecated or misnamed plugin references.
11. **Production & Governance Files**: Existence of all required governance and operational documentation.
12. **Git Cleanliness**: Workspace status and uncommitted changes audit.
13. **BENCHMARK.md Version Alignment**: Consistency with `canonical-metadata.json`.
14. **Dependency Security Audit**: Zero vulnerabilities on `npm audit --audit-level=high`.
15. **Benchmark Semantic Alignment**: Validation of domain count in benchmark artifacts.
16. **Release Manifest & Tag Provenance**: Non-self-referencing lineage tracking via `release-manifest.json`.
17. **Agent Capability Contract Validation**: Structural validation of `registry/capabilities.json`.
18. **Suite Bundle Integrity**: Cross-validation of `bundles/*.json` against canonical plugins and capabilities.
