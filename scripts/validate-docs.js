#!/usr/bin/env node
/**
 * Documentation Integrity & SSOT Validator (`scripts/validate-docs.js`)
 *
 * Verifies current-state documentation consistency against canonical metadata.
 * Validates BENCHMARK.md, README.md, CHANGELOG.md, SKILL_PROTOCOL.md, and docs/RELEASE.md.
 *
 * Usage:
 *   node scripts/validate-docs.js
 *   npm run validate:docs
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

function read(relPath) {
  return fs.readFileSync(path.join(ROOT, relPath), 'utf8');
}

function containsAll(content, needles, label) {
  let errors = 0;
  needles.forEach(needle => {
    if (!content.includes(needle)) {
      console.error(`❌ ${label}: missing '${needle}'`);
      errors++;
    }
  });
  return errors;
}

function validateDocs() {
  console.log("📚 Running Documentation Integrity & SSOT Validator...\n");
  let errors = 0;

  const metadataPath = path.join(ROOT, 'canonical-metadata.json');
  if (!fs.existsSync(metadataPath)) {
    console.error("❌ Missing canonical-metadata.json. Run 'npm run generate:metadata' first.");
    process.exit(1);
  }
  const metadata = JSON.parse(read('canonical-metadata.json'));

  // 1. BENCHMARK.md checks
  console.log("  [1/6] Verifying docs/BENCHMARK.md metrics...");
  const benchmarkMd = read('docs/BENCHMARK.md');
  errors += containsAll(benchmarkMd, [
    `v${metadata.version}`,
    `${metadata.goldenCases}`,
    `${metadata.engines}`
  ], 'docs/BENCHMARK.md alignment');

  // 2. README.md checks
  console.log("  [2/6] Verifying README.md current-state narrative & stats...");
  const readme = read('README.md');
  errors += containsAll(readme, [
    `v${metadata.version}`,
    `${metadata.skills}`,
    `${metadata.plugins}`,
    `${metadata.engines}`
  ], 'README.md alignment');

  // 3. CHANGELOG.md release entry check
  console.log("  [3/6] Verifying CHANGELOG.md release entry...");
  const changelog = read('CHANGELOG.md');
  if (!changelog.includes(`## [${metadata.version}]`)) {
    console.error(`❌ CHANGELOG.md missing entry for '## [${metadata.version}]'.`);
    errors++;
  }

  // 4. docs/RELEASE.md checks
  console.log("  [4/6] Verifying docs/RELEASE.md release gate alignment...");
  const releaseMd = read('docs/RELEASE.md');
  errors += containsAll(releaseMd, [
    '18-Check Release Gate Pipeline',
    `${metadata.plugins} plugins`,
    `${metadata.skills} skills`,
    `${metadata.engines} engines`
  ], 'docs/RELEASE.md alignment');

  // 5. SKILL_PROTOCOL.md checks
  console.log("  [5/6] Verifying SKILL_PROTOCOL.md standard contracts...");
  const skillProtocol = read('SKILL_PROTOCOL.md');
  errors += containsAll(skillProtocol, [
    'Standard Operating Procedure for Autonomous Business Agents',
    'Doctrine of Deterministic Computation',
    'Closed Payload Security Protocol'
  ], 'SKILL_PROTOCOL.md contract');

  // 6. Stale taxonomy check across documentation
  console.log("  [6/6] Checking for stale taxonomy or deprecated identifiers...");
  const currentDocFiles = [
    'README.md', 'SKILL_PROTOCOL.md', 'CHANGELOG.md', 'PROVENANCE.md',
    'SECURITY.md', 'docs/BENCHMARK.md', 'docs/RELEASE.md'
  ];
  const staleTerms = ['sovereign-core', 'sovereign business core', 'sg-tax-id', 'sg-hr-id'];
  currentDocFiles.forEach(docFile => {
    const filePath = path.join(ROOT, docFile);
    if (!fs.existsSync(filePath)) return;
    const content = read(docFile);
    staleTerms.forEach(term => {
      if (content.toLowerCase().includes(term)) {
        console.error(`❌ Stale Taxonomy in ${docFile}: contains deprecated term '${term}'`);
        errors++;
      }
    });
  });

  if (errors > 0) {
    console.error(`\n❌ Documentation Validation Failed with ${errors} error(s).`);
    process.exit(1);
  } else {
    console.log("\n✅ Documentation Validation Passed. All validated current-state documentation fields are in SSOT alignment.");
  }
}

if (require.main === module) {
  validateDocs();
}

module.exports = { validateDocs };
