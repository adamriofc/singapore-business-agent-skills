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

# Verify module requiring
node -e "
const pkg = require('singapore-business-agent-skills/package.json');
console.log('    ✓ Package name:', pkg.name, 'v' + pkg.version);

const sbas = require('singapore-business-agent-skills');

// Test CIT
const cit = sbas.calculateSingaporeCit({ chargeableIncome: 100000, isQualifyingStartup: true });
if (cit.netTaxPayableSgd !== 2125) throw new Error('Smoke test failed for calculateSingaporeCit (got ' + cit.netTaxPayableSgd + ')');
console.log('    ✓ Engine calculateSingaporeCit required & executed successfully');

// Test CPF
const cpf = sbas.calculateSingaporeCpf({ ordinaryWage: 6000, age: 30, residentialStatus: 'CITIZEN' });
if (cpf.contributions.employeeCpfSgd !== 1200) throw new Error('Smoke test failed for calculateSingaporeCpf');
console.log('    ✓ Engine calculateSingaporeCpf required & executed successfully');

// Test ACRA
const acra = sbas.calculateAcraStatutoryDeadlines({ financialYearEndDate: '2025-12-31' });
if (acra.statutoryFilingTimeline.agmDeadlineDate !== '2026-06-30') throw new Error('Smoke test failed for calculateAcraStatutoryDeadlines');
console.log('    ✓ Engine calculateAcraStatutoryDeadlines required & executed successfully');

// Test Integrity
const integrity = sbas.verifyAllRulesets();
if (integrity.status !== 'ALL_VERIFIED') throw new Error('Smoke test failed for verifyAllRulesets');
console.log('    ✓ Integrity verification executed successfully (8 rulesets valid)');
"

echo "  [3/3] Smoke test clean-up completed."
echo "✅ Singapore Package Smoke Test PASSED 100%!"
