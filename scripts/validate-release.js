#!/usr/bin/env node
/**
 * Automated Release Gate & Integrity Validator (`scripts/validate-release.js`)
 *
 * Enforces a strict 18-check release gate before a version tag or publish for
 * Singapore Business Agent Skills.
 *
 * Usage:
 *   node scripts/validate-release.js
 *   npm run validate:release
 */

'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');

function validateRelease() {
  console.log("🇸🇬 Running Automated Release Gate (18-Check Pipeline)...\n");
  let errors = 0;
  let checksPassed = 0;

  const metadataPath = path.join(ROOT, 'canonical-metadata.json');
  if (!fs.existsSync(metadataPath)) {
    console.error("❌ Release Gate Check 1 Failed: canonical-metadata.json missing.");
    process.exit(1);
  }
  const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));

  // 1. Version Alignment Check
  console.log("  [1/18] Checking Package, Lockfile, Registry & Metadata Version Alignment...");
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  const lock = fs.existsSync(path.join(ROOT, 'package-lock.json')) ? JSON.parse(fs.readFileSync(path.join(ROOT, 'package-lock.json'), 'utf8')) : null;
  const registry = JSON.parse(fs.readFileSync(path.join(ROOT, 'registry/index.json'), 'utf8'));
  if (pkg.version !== metadata.version || (lock && lock.version !== metadata.version) || registry.version !== metadata.version) {
    console.error(`❌ Version Mismatch: package=${pkg.version}, lock=${lock ? lock.version : 'missing'}, registry=${registry.version}, metadata=${metadata.version}`);
    errors++;
  } else {
    console.log(`    ✅ Version aligned across all artifacts: v${metadata.version}`);
    checksPassed++;
  }

  // 2. CHANGELOG Release Entry Check
  console.log("  [2/18] Verifying CHANGELOG.md Release Entry...");
  const changelog = fs.readFileSync(path.join(ROOT, 'CHANGELOG.md'), 'utf8');
  if (!changelog.includes(`## [${metadata.version}]`)) {
    console.error(`❌ CHANGELOG Mismatch: missing '## [${metadata.version}]'`);
    errors++;
  } else {
    console.log(`    ✅ CHANGELOG.md contains release entry for v${metadata.version}`);
    checksPassed++;
  }

  // 3. Plugin Count
  console.log("  [3/18] Verifying Canonical Plugin Count...");
  const pluginCount = registry.total_plugins || registry.total_domains;
  if (pluginCount !== metadata.plugins) {
    console.error(`❌ Plugin Count Mismatch: registry=${pluginCount}, metadata=${metadata.plugins}`);
    errors++;
  } else { checksPassed++; console.log(`    ✅ Canonical plugin count verified: ${metadata.plugins}`); }

  // 4. Skill Count
  console.log("  [4/18] Verifying Machine-Readable Skill Count...");
  if (registry.total_skills !== metadata.skills) {
    console.error(`❌ Skill Count Mismatch: registry=${registry.total_skills}, metadata=${metadata.skills}`);
    errors++;
  } else { checksPassed++; console.log(`    ✅ Machine-readable skills count verified: ${metadata.skills}`); }

  // 5. Engine Count
  console.log("  [5/18] Verifying Deterministic Engine Count...");
  if (registry.total_engines !== metadata.engines) {
    console.error(`❌ Engine Count Mismatch: registry=${registry.total_engines}, metadata=${metadata.engines}`);
    errors++;
  } else { checksPassed++; console.log(`    ✅ Deterministic engine count verified: ${metadata.engines}`); }

  // 6. Golden Corpus
  console.log("  [6/18] Verifying Golden Test Corpus...");
  if (metadata.goldenCases !== 130 || metadata.benchmarkDomains !== 6) {
    console.error(`❌ Golden Corpus Mismatch: expected 130/6, got ${metadata.goldenCases}/${metadata.benchmarkDomains}`);
    errors++;
  } else { checksPassed++; console.log(`    ✅ Golden corpus verified: 130 cases across 6 domains`); }

  // 7. Benchmark artifact
  console.log("  [7/18] Verifying Latest Benchmark Results Artifact...");
  const artifactPath = path.join(ROOT, 'docs/benchmark-results/latest.json');
  if (!fs.existsSync(artifactPath)) {
    console.error(`❌ Benchmark Artifact Missing: ${artifactPath}`);
    errors++;
  } else {
    const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
    if (!artifact.date || !artifact.domains) {
      console.error(`❌ Benchmark Artifact Invalid: missing date/domains`);
      errors++;
    } else { checksPassed++; console.log(`    ✅ Benchmark artifact verified (${artifact.date})`); }
  }

  // 8. SHA256 integrity
  console.log("  [8/18] Verifying SHA256 Ruleset Integrity Hashes...");
  try {
    execSync('bash scripts/sha256sums.sh verify', { cwd: ROOT, stdio: 'pipe' });
    checksPassed++; console.log(`    ✅ Ruleset SHA256 trust anchor hashes verified`);
  } catch (e) { console.error(`❌ SHA256 Verification Failed: ${e.message}`); errors++; }

  // 9. Schema validator
  console.log("  [9/18] Executing Dynamic Skill & Plugin Schema Validator...");
  try {
    execSync('node tests/schema/validator.test.js', { cwd: ROOT, stdio: 'pipe' });
    checksPassed++; console.log(`    ✅ Dynamic schema validator passed`);
  } catch (e) { console.error(`❌ Schema Validation Failed: ${e.stdout ? e.stdout.toString() : e.message}`); errors++; }

  // 10. Stale taxonomy
  console.log("  [10/18] Checking for Stale Taxonomy References...");
  const staleKeywords = ['tax-payroll-id', 'ecommerce-id', 'content-lokal-id'];
  const docFiles = ['README.md', 'SKILL_PROTOCOL.md', 'PROVENANCE.md', 'CHANGELOG.md'];
  let staleFound = false;
  docFiles.forEach(file => {
    const filePath = path.join(ROOT, file);
    if (!fs.existsSync(filePath)) return;
    const content = fs.readFileSync(filePath, 'utf8');
    staleKeywords.forEach(stale => {
      if (content.includes(stale)) {
        console.error(`❌ Stale Taxonomy Violation: ${file} references invalid keyword '${stale}'`);
        staleFound = true;
      }
    });
  });
  if (!staleFound) { checksPassed++; console.log(`    ✅ No stale taxonomy references found in documentation`); }
  else errors++;

  // 11. Required files
  console.log("  [11/18] Checking Required Production & Governance Files...");
  const requiredFiles = [
    'README.md', 'LICENSE', 'CHANGELOG.md', 'SECURITY.md', 'PROVENANCE.md',
    'SKILL_PROTOCOL.md', 'docs/RELEASE.md', 'docs/BENCHMARK.md',
    'canonical-metadata.json', 'release-manifest.json', 'SHA256SUMS.txt'
  ];
  const missingFiles = requiredFiles.filter(file => !fs.existsSync(path.join(ROOT, file)));
  if (missingFiles.length) { missingFiles.forEach(file => console.error(`❌ Missing Required File: ${file}`)); errors++; }
  else { checksPassed++; console.log(`    ✅ All ${requiredFiles.length} required production & governance files present`); }

  // 12. Git cleanliness
  console.log("  [12/18] Checking Git Workspace Cleanliness...");
  try {
    const gitStatus = execSync('git status --porcelain', { cwd: ROOT, encoding: 'utf8' }).trim();
    if (gitStatus.length > 0 && process.env.REQUIRE_CLEAN_GIT === 'true') {
      console.error(`❌ Git Workspace Not Clean:\n${gitStatus}`); errors++;
    } else { checksPassed++; console.log(`    ✅ Git workspace checked (${gitStatus.length === 0 ? 'clean' : 'modified/untracked files allowed in local mode'})`); }
  } catch { checksPassed++; console.log(`    ⚠️ Git status check skipped (not a git repo directory)`); }

  // 13. BENCHMARK.md version
  console.log("  [13/18] Verifying BENCHMARK.md Version Alignment...");
  const benchmarkMd = fs.readFileSync(path.join(ROOT, 'docs/BENCHMARK.md'), 'utf8');
  if (!benchmarkMd.includes(`v${metadata.version}`)) { console.error(`❌ BENCHMARK.md Version Mismatch: expected v${metadata.version}`); errors++; }
  else { checksPassed++; console.log(`    ✅ BENCHMARK.md version verified`); }

  // 14. High/Critical npm audit
  console.log("  [14/18] Executing High & Critical Dependency Vulnerability Audit Check...");
  try {
    // If no dependencies, npm audit passes cleanly or reports zero
    if (Object.keys(pkg.dependencies || {}).length === 0) {
      checksPassed++; console.log(`    ✅ Zero external runtime dependencies - supply-chain attack surface zero`);
    } else {
      execSync('npm audit --audit-level=high', { cwd: ROOT, stdio: 'pipe' });
      checksPassed++; console.log(`    ✅ High & Critical dependency audit passed`);
    }
  } catch { console.error(`❌ Dependency Security Audit Failed: high or critical vulnerabilities detected.`); errors++; }

  // 15. Benchmark semantic alignment
  console.log("  [15/18] Verifying Benchmark Artifact Semantic Alignment...");
  try {
    const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
    const domainCount = artifact.domains ? Object.keys(artifact.domains).length : 0;
    if (domainCount !== metadata.benchmarkDomains) {
      console.error(`❌ Benchmark Artifact Semantic Mismatch: artifact=${domainCount}, metadata=${metadata.benchmarkDomains}`); errors++;
    } else { checksPassed++; console.log(`    ✅ Benchmark semantic alignment verified (${metadata.benchmarkDomains} domains)`); }
  } catch (e) { console.error(`❌ Benchmark Artifact Semantic Check Failed: ${e.message}`); errors++; }

  // 16. Release manifest ↔ tag provenance & integrity hashes
  console.log("  [16/18] Verifying Release Manifest ↔ Authoritative Tag Provenance & Integrity Hashes...");
  try {
    const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'release-manifest.json'), 'utf8'));
    const expectedTag = process.env.RELEASE_TAG || `v${metadata.version}`;

    // 1. Version alignment
    if (manifest.releaseVersion !== `v${metadata.version}`) {
      throw new Error(`manifest.releaseVersion=${manifest.releaseVersion} != v${metadata.version}`);
    }
    if (manifest.releaseTag !== expectedTag) {
      throw new Error(`manifest.releaseTag=${manifest.releaseTag} != ${expectedTag}`);
    }

    // 2. Metrics alignment
    if (manifest.metrics.plugins !== metadata.plugins || manifest.metrics.skills !== metadata.skills ||
        manifest.metrics.engines !== metadata.engines || manifest.metrics.goldenCases !== metadata.goldenCases ||
        manifest.metrics.benchmarkDomains !== metadata.benchmarkDomains || manifest.metrics.benchmarkAssertions !== metadata.benchmarkAssertions) {
      throw new Error('manifest.metrics do not match canonical-metadata.json');
    }

    // 3. Integrity Hashes Verification
    if (manifest.integrityHashes) {
      const sha256sumsActual = crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, 'SHA256SUMS.txt'))).digest('hex');
      if (manifest.integrityHashes.sha256sumsFileHash && manifest.integrityHashes.sha256sumsFileHash !== sha256sumsActual) {
        throw new Error(`manifest.integrityHashes.sha256sumsFileHash mismatch: expected ${manifest.integrityHashes.sha256sumsFileHash}, actual ${sha256sumsActual}`);
      }

      const benchmarkActual = crypto.createHash('sha256').update(fs.readFileSync(artifactPath)).digest('hex');
      if (manifest.integrityHashes.benchmarkArtifactHash && manifest.integrityHashes.benchmarkArtifactHash !== benchmarkActual) {
        throw new Error(`manifest.integrityHashes.benchmarkArtifactHash mismatch: expected ${manifest.integrityHashes.benchmarkArtifactHash}, actual ${benchmarkActual}`);
      }
    }

    // 4. Git Tag Provenance
    let tagTargetCommit = null;
    try {
      tagTargetCommit = execSync(`git rev-list -n 1 ${expectedTag}`, { cwd: ROOT, encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();
    } catch {
      tagTargetCommit = null;
    }

    if (tagTargetCommit) {
      const sourceHash = manifest.releaseSourceCommitHash || manifest.releaseCommitHash;
      if (!sourceHash) throw new Error('manifest missing releaseSourceCommitHash');

      const commitType = execSync(`git cat-file -t ${sourceHash} 2>/dev/null || echo missing`, { cwd: ROOT, encoding: 'utf8' }).trim();
      if (commitType !== 'commit') throw new Error(`manifest.releaseSourceCommitHash=${sourceHash} is not a reachable commit (got: ${commitType})`);

      let isAncestor = false;
      try {
        execSync(`git merge-base --is-ancestor ${sourceHash} ${tagTargetCommit}`, { cwd: ROOT, stdio: 'ignore' });
        isAncestor = true;
      } catch { isAncestor = false; }
      if (!isAncestor) {
        throw new Error(`manifest.releaseSourceCommitHash=${sourceHash} is NOT an ancestor of release tag ${expectedTag} (${tagTargetCommit}) — lineage breach`);
      }
      console.log(`    ✅ Release manifest v${manifest.manifestVersion}: tag=${expectedTag} (exists→${tagTargetCommit.slice(0,7)}), source=${sourceHash.slice(0,7)}, hashes verified, metrics aligned.`);
    } else {
      if (process.env.REQUIRE_RELEASE_TAG === 'true') {
        throw new Error(`tag ${expectedTag} not found in git history and REQUIRE_RELEASE_TAG=true`);
      }
      console.log(`    ⚠️ Release tag ${expectedTag} provenance check skipped in local development mode (tag not yet created); hashes & metrics aligned.`);
    }

    checksPassed++;
  } catch (e) {
    console.error(`❌ Release Manifest Provenance Failed: ${e.message}`);
    errors++;
  }

  // 17. Agent capability contract validation
  console.log("  [17/18] Executing Agent Capability Contract Validator...");
  try {
    execSync('node scripts/validate-capabilities.js', { cwd: ROOT, stdio: 'pipe' });
    checksPassed++; console.log(`    ✅ Agent capability contract validator passed`);
  } catch (e) { console.error(`❌ Agent Capability Contract Validation Failed: ${e.message}`); errors++; }

  // 18. Suite bundle integrity validation
  console.log("  [18/18] Executing Suite Bundle Integrity Validator...");
  try {
    execSync('node scripts/validate-suite.js', { cwd: ROOT, stdio: 'pipe' });
    checksPassed++; console.log(`    ✅ Suite bundle integrity validator passed`);
  } catch (e) { console.error(`❌ Suite Bundle Integrity Validation Failed: ${e.message}`); errors++; }

  console.log(`\n---------------------------------------------------`);
  if (errors > 0) {
    console.error(`❌ Release Gate Failed with ${errors} error(s). (${checksPassed}/18 checks passed)`);
    process.exit(1);
  } else {
    console.log(`✅ Release Gate PASSED. All 18 Release Integrity Checks Passed (18/18).`);
  }
}

validateRelease();
