'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { verifyRulesetIntegrity, REQUIRED_RULESETS } = require('../../engines/rules/integrity.js');

function runSupplyChainSecurityTests() {
  console.log("🛡️ Running Singapore Supply-Chain Trust Anchor & Integrity Security Tests...\n");
  const rootDir = path.join(__dirname, '../..');

  // 1. Verify Manifest Version Synchronization
  console.log("  [1/4] Verifying Package & Registry Manifest Version Alignment...");
  const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));
  const reg = JSON.parse(fs.readFileSync(path.join(rootDir, 'registry/index.json'), 'utf8'));

  assert.strictEqual(pkg.version, reg.version, "registry index version mismatch with package.json");
  console.log(`  ✅ Version synchronization verified: v${pkg.version}`);

  // 2. Verify Zero External Runtime Dependencies
  console.log("  [2/4] Verifying Zero External Runtime Dependencies...");
  assert.deepStrictEqual(pkg.dependencies || {}, {}, "Runtime dependencies must be strictly empty {}");
  console.log("  ✅ Zero runtime dependencies verified (pure Node.js standard library)");

  // 3. Verify Trust Anchor Checksums
  console.log("  [3/4] Verifying SHA-256 Ruleset Trust Anchor Hashes...");
  for (const ruleFile of REQUIRED_RULESETS) {
    const res = verifyRulesetIntegrity(ruleFile);
    assert.strictEqual(res.status, 'VERIFIED', `Ruleset ${ruleFile} failed integrity verification: ${res.message}`);
    console.log(`  ✅ Checksum verified: ${ruleFile} -> ${res.hash.slice(0, 16)}...`);
  }

  // 4. Verify Transparent Statutory Citations & Issuer Audit Metadata
  console.log("  [4/4] Verifying Transparent Issuer Audit Metadata...");
  for (const ruleFile of REQUIRED_RULESETS) {
    const filePath = path.join(rootDir, 'engines/rules', ruleFile);
    const content = fs.readFileSync(filePath, 'utf8');
    assert.ok(!content.includes('Fake Board'), `File ${ruleFile} contains misleading claim`);
    assert.ok(content.includes('IRAS') || content.includes('ACRA') || content.includes('MOM') || content.includes('CPF') || content.includes('PDPC') || content.includes('MAS') || content.includes('Enterprise Singapore'), `File ${ruleFile} missing Singapore statutory issuer authority`);
  }
  console.log("  ✅ Statutory authority provenance verified across all rulesets.");

  console.log("\n✅ Supply-Chain Trust Anchor & Integrity Verification Passed 100%!");
}

runSupplyChainSecurityTests();
