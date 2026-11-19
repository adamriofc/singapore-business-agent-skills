#!/usr/bin/env bash
# Package Smoke Installation & Module Export Test (`scripts/package-smoke-test.sh`)
# Packs repository tarball, installs in isolated temp environment, and verifies module exports.
# Compatible with read-only host environments & sandboxes (tmpfs cache).

set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEMP_DIR=$(mktemp -d /tmp/sbas-smoke-XXXXXX)
CACHE_DIR=$(mktemp -d /tmp/sbas-cache-XXXXXX)

cleanup() {
  rm -rf "$TEMP_DIR" "$CACHE_DIR"
  if [ -n "$TARBALL_PATH" ] && [ -f "$TARBALL_PATH" ]; then
    rm -f "$TARBALL_PATH"
  fi
}
trap cleanup EXIT

echo "📦 Running Singapore Agent Skills Package Smoke Installation & Export Test..."

cd "$ROOT_DIR"
TARBALL=$(npm pack --pack-destination "$TEMP_DIR" --cache "$CACHE_DIR" --quiet | tail -n 1)
TARBALL_PATH="$TEMP_DIR/$TARBALL"

if [ ! -f "$TARBALL_PATH" ]; then
  echo "❌ Error: Tarball was not created at expected path: $TARBALL_PATH"
  exit 1
fi

echo "  [1/3] Created package tarball: $TARBALL"

cd "$TEMP_DIR"
npm init -y --cache "$CACHE_DIR" > /dev/null
npm install "$TARBALL_PATH" --cache "$CACHE_DIR" --quiet > /dev/null

echo "  [2/3] Successfully installed tarball into isolated temp environment: $TEMP_DIR"

# Verify module requiring & domain package completeness
node -e "
const fs = require('fs');
const path = require('path');

const pkg = require('singapore-business-agent-skills/package.json');
console.log('    ✓ Package name:', pkg.name, 'v' + pkg.version);

const sbas = require('singapore-business-agent-skills');
const pkgRoot = path.dirname(require.resolve('singapore-business-agent-skills/package.json'));

// 1. Verifikasi seluruh 6 domain directory ada di dalam paket tarball
const expectedDomains = ['tax-sg', 'hr-sg', 'legal-sg', 'finance-sg', 'strategic-sg', 'marketing-sg'];
expectedDomains.forEach(domain => {
  const domainDir = path.join(pkgRoot, domain);
  if (!fs.existsSync(domainDir)) {
    throw new Error('Tarball package missing canonical domain directory: ' + domain);
  }
});
console.log('    ✓ All 6 canonical domain directories verified in installed tarball');

// 2. Verifikasi total file SKILL.md di ke-6 domain berjumlah tepat 71
let totalSkills = 0;
expectedDomains.forEach(domain => {
  const skillsDir = path.join(pkgRoot, domain, 'skills');
  if (fs.existsSync(skillsDir)) {
    const items = fs.readdirSync(skillsDir, { withFileTypes: true });
    items.forEach(item => {
      if (item.isDirectory()) {
        const skillMd = path.join(skillsDir, item.name, 'SKILL.md');
        if (fs.existsSync(skillMd)) totalSkills++;
      }
    });
  }
});
if (totalSkills !== 71) {
  throw new Error('Tarball package skill count mismatch: expected 71, found ' + totalSkills);
}
console.log('    ✓ Complete 71 SKILL.md files verified in installed tarball (6 domains)');

// 3. Test representative engines across all 6 domains
// 3a. Domain Tax: CIT
const cit = sbas.calculateSingaporeCit({ chargeableIncome: 100000, isQualifyingStartup: true });
if (cit.netTaxPayableSgd !== 2125) throw new Error('Smoke test failed for calculateSingaporeCit (got ' + cit.netTaxPayableSgd + ')');
console.log('    ✓ [Tax] Engine calculateSingaporeCit executed successfully');

// 3b. Domain HR: CPF
const cpf = sbas.calculateSingaporeCpf({ ordinaryWage: 6000, age: 30, residentialStatus: 'CITIZEN' });
if (cpf.contributions.employeeCpfSgd !== 1200) throw new Error('Smoke test failed for calculateSingaporeCpf');
console.log('    ✓ [HR] Engine calculateSingaporeCpf executed successfully');

// 3c. Domain Legal: ACRA
const acra = sbas.calculateAcraStatutoryDeadlines({ financialYearEndDate: '2025-12-31' });
if (acra.statutoryFilingTimeline.agmDeadlineDate !== '2026-06-30') throw new Error('Smoke test failed for calculateAcraStatutoryDeadlines');
console.log('    ✓ [Legal] Engine calculateAcraStatutoryDeadlines executed successfully');

// 3d. Domain Finance: NPV
const npv = sbas.calculateNpv(100000, [35000, 45000, 50000], 0.08);
if (npv !== 10679.27) throw new Error('Smoke test failed for calculateNpv (got ' + npv + ')');
console.log('    ✓ [Finance] Engine calculateNpv executed successfully');

// 3e. Domain Marketing: Paid Advertising ROI & 9% GST
const adsRoi = sbas.calculateSingaporeAdsRoi({
  adSpendExcludingGstSgd: 10000,
  acquiredCustomersCount: 200,
  totalAttributedRevenueSgd: 40000,
  isB2bGstRegistered: true
});
if (adsRoi.mediaSpendTaxBreakdownSgd.statutory9PercentGst !== 900 || adsRoi.performanceRatios.returnOnAdSpendRoas !== 4.0) {
  throw new Error('Smoke test failed for calculateSingaporeAdsRoi');
}
console.log('    ✓ [Marketing] Engine calculateSingaporeAdsRoi executed successfully');

// 3f. Ruleset Integrity
const integrity = sbas.verifyAllRulesets();
if (integrity.status !== 'ALL_VERIFIED') throw new Error('Smoke test failed for verifyAllRulesets');
console.log('    ✓ Ruleset integrity verification executed successfully (8 rulesets valid)');
"

echo "  [3/3] Smoke test clean-up completed."
echo "✅ Singapore Package Smoke Test PASSED 100%!"
