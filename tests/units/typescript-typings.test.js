'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const sbas = require('../../index.js');

function runTypescriptTypingsTests() {
  console.log("🇸🇬 Running TypeScript Typings Verification Tests...\n");

  const dtsPath = path.join(__dirname, '../../index.d.ts');
  assert.strictEqual(fs.existsSync(dtsPath), true, "index.d.ts must exist");

  const dtsContent = fs.readFileSync(dtsPath, 'utf8');

  // Verify that every exported function and constant in index.js is declared in index.d.ts
  const exportedKeys = Object.keys(sbas);
  console.log(`  Verifying ${exportedKeys.length} exported members against index.d.ts...`);

  const missingDeclarations = [];
  exportedKeys.forEach(key => {
    // Check if the declaration contains 'export function <key>' or 'export const <key>' or '<key>:'
    const regex = new RegExp(`export\\s+(function|const)\\s+${key}\\b|${key}\\s*:`, 'm');
    if (!regex.test(dtsContent)) {
      missingDeclarations.push(key);
    }
  });

  if (missingDeclarations.length > 0) {
    throw new Error(`Missing TypeScript declarations for: ${missingDeclarations.join(', ')}`);
  }

  console.log(`  ✅ All ${exportedKeys.length} exports are strictly declared in index.d.ts`);
  console.log("\n✅ TypeScript Typings Verification Passed 100%!");
}

runTypescriptTypingsTests();
