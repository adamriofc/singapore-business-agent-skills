#!/usr/bin/env node
/**
 * Golden Test Suite Generator (`scripts/generate-golden-test.js`)
 * Generates `tests/units/golden-corpus.test.js` with individual assertions for all 130 golden cases.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const goldenDir = path.join(ROOT, 'tests/golden');
const domains = ['tax-sg', 'hr-sg', 'legal-sg', 'finance-sg', 'strategic-sg', 'marketing-sg'];

let lines = [];
lines.push("'use strict';");
lines.push("");
lines.push("const assert = require('assert');");
lines.push("const engines = require('../../index.js');");
lines.push("");
lines.push("function runCase(engineName, input) {");
lines.push("  const fn = engines[engineName];");
lines.push("  if (typeof fn !== 'function') throw new Error('Missing engine: ' + engineName);");
lines.push("  let res;");
lines.push("  if (engineName === 'calculateSingaporeGstRate') {");
lines.push("    res = fn(input.dateStr);");
lines.push("  } else {");
lines.push("    res = fn(input);");
lines.push("  }");
lines.push("  const flattened = {};");
lines.push("  if (typeof res === 'number') {");
lines.push("    flattened.rate = res;");
lines.push("    flattened.value = res;");
lines.push("    flattened.result = res;");
lines.push("    flattened.npvSgd = res;");
lines.push("    flattened.irr = res;");
lines.push("    flattened.forwardRate = res;");
lines.push("    return flattened;");
lines.push("  }");
lines.push("  function recurse(obj) {");
lines.push("    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return;");
lines.push("    for (const [k, v] of Object.entries(obj)) {");
lines.push("      if (v !== null && typeof v === 'object' && !Array.isArray(v)) {");
lines.push("        recurse(v);");
lines.push("      } else {");
lines.push("        flattened[k] = v;");
lines.push("      }");
lines.push("    }");
lines.push("  }");
lines.push("  recurse(res);");
lines.push("  return flattened;");
lines.push("}");
lines.push("");
lines.push("function runGoldenCorpusTests() {");
lines.push("  console.log('🇸🇬 Running 130 Golden Corpus Static Verification Tests across 6 Domains...\\n');");

let totalAsserts = 0;

for (const domain of domains) {
  const filePath = path.join(goldenDir, `${domain}.json`);
  const cases = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  lines.push(`  // ==========================================`);
  lines.push(`  // Domain: ${domain} (${cases.length} cases)`);
  lines.push(`  // ==========================================`);
  lines.push(`  console.log('  📂 Testing ${domain} golden cases...');`);

  for (const c of cases) {
    lines.push(`  { // Case: ${c.caseId}`);
    lines.push(`    const input = ${JSON.stringify(c.input)};`);
    lines.push(`    const res1 = runCase(${JSON.stringify(c.engine)}, input);`);
    lines.push(`    assert.ok(res1 !== null && typeof res1 === 'object', 'Result must be object for ${c.caseId}');`);
    totalAsserts++;

    for (const [key, expVal] of Object.entries(c.expected)) {
      if (typeof expVal === 'number') {
        lines.push(`    assert.ok(typeof res1[${JSON.stringify(key)}] === 'number' && Math.abs(res1[${JSON.stringify(key)}] - ${expVal}) <= 0.0001, '${c.caseId} numeric ${key} expected ${expVal}');`);
      } else {
        lines.push(`    assert.strictEqual(res1[${JSON.stringify(key)}], ${JSON.stringify(expVal)}, '${c.caseId} value ${key} mismatch');`);
      }
      totalAsserts++;
    }

    lines.push(`    const res2 = runCase(${JSON.stringify(c.engine)}, input);`);
    lines.push(`    assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2), 'Determinism 2x for ${c.caseId}');`);
    totalAsserts++;

    lines.push(`    const res3 = runCase(${JSON.stringify(c.engine)}, input);`);
    lines.push(`    assert.strictEqual(JSON.stringify(res2), JSON.stringify(res3), 'Determinism 3x for ${c.caseId}');`);
    totalAsserts++;

    lines.push(`  }`);
  }

  lines.push(`  console.log('    ✅ ${domain}: ${cases.length} cases verified.');`);
  lines.push("");
}

lines.push(`  console.log('\\n====================================================================');`);
lines.push(`  console.log('🎉 All 130 Golden Corpus Cases Passed with ${totalAsserts} Assertions!');`);
lines.push("}");
lines.push("");
lines.push("runGoldenCorpusTests();");
lines.push("");

const targetPath = path.join(ROOT, 'tests/units/golden-corpus.test.js');
fs.writeFileSync(targetPath, lines.join('\n'));
console.log(`Generated ${targetPath} with ${totalAsserts} assertions across ${domains.length} domains.`);
