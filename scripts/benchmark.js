#!/usr/bin/env node
/**
 * Singapore Business Agent Skills — Deterministic Benchmark Harness (`scripts/benchmark.js`)
 *
 * Three-Tier Benchmark Pipeline:
 *  1. Deterministic Accuracy : Computational engines vs golden corpus (must be 100%)
 *  2. Determinism             : 3x identical executions verification (zero-drift guarantee)
 *  3. Performance             : Measured operations/sec & latency per benchmark domain
 *
 * Usage:
 *   node scripts/benchmark.js
 *   node scripts/benchmark.js --json-report docs/benchmark-results/latest.json
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');

const ROOT = path.join(__dirname, '..');
const engines = require(path.join(ROOT, 'index.js'));

function loadGolden(name) {
  const filePath = path.join(ROOT, 'tests/golden', `${name}.json`);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Golden test file not found: ${filePath}`);
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function runCase(c) {
  const fn = engines[c.engine];
  if (typeof fn !== 'function') {
    throw new Error(`Engine '${c.engine}' not found in index.js for case '${c.caseId}'`);
  }

  let res;
  if (c.engine === 'calculateSingaporeGstRate') {
    res = fn(c.input.dateStr);
  } else {
    res = fn(c.input);
  }

  const flattened = {};

  if (typeof res === 'number') {
    flattened.rate = res;
    flattened.value = res;
    flattened.result = res;
    flattened.npvSgd = res;
    flattened.irr = res;
    flattened.forwardRate = res;
    return flattened;
  }

  // Flatten nested objects for direct expected comparisons
  function recurse(obj) {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return;
    for (const [k, v] of Object.entries(obj)) {
      if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
        recurse(v);
      } else {
        flattened[k] = v;
      }
    }
  }

  recurse(res);
  return flattened;
}

function assertMatch(caseId, expected, actual) {
  let assertions = 0;
  for (const [key, expVal] of Object.entries(expected)) {
    const actVal = actual[key];
    if (typeof expVal === 'number' && typeof actVal === 'number') {
      if (Math.abs(expVal - actVal) > 0.0001) {
        throw new Error(`[${caseId}] Numeric mismatch for '${key}': expected ${expVal}, got ${actVal}`);
      }
    } else if (expVal !== actVal) {
      throw new Error(`[${caseId}] Value mismatch for '${key}': expected ${JSON.stringify(expVal)}, got ${JSON.stringify(actVal)}`);
    }
    assertions++;
  }
  return assertions;
}

function runBenchmark() {
  console.log("🇸🇬 Singapore Business Agent Skills — Deterministic Benchmark Harness");
  console.log("====================================================================\n");

  const domains = ['tax-sg', 'hr-sg', 'legal-sg', 'finance-sg', 'strategic-sg', 'marketing-sg'];
  let totalCases = 0;
  let accuracyPassed = 0;
  let determinismPassed = 0;
  let totalAssertions = 0;

  // 1. Accuracy & Determinism Test
  console.log("Tier 1 & Tier 2: Evaluating Deterministic Accuracy & Zero-Drift Repeatability...");
  for (const domain of domains) {
    const cases = loadGolden(domain);
    console.log(`\n  📂 Domain [${domain}]: Evaluating ${cases.length} golden cases...`);

    for (const c of cases) {
      totalCases++;
      // Run execution 1
      const res1 = runCase(c);
      const caseAssertions = assertMatch(c.caseId, c.expected, res1);
      totalAssertions += caseAssertions;
      accuracyPassed++;

      // Run execution 2 and 3 for determinism check
      const res2 = runCase(c);
      const res3 = runCase(c);
      const str1 = JSON.stringify(res1);
      const str2 = JSON.stringify(res2);
      const str3 = JSON.stringify(res3);

      if (str1 === str2 && str2 === str3) {
        determinismPassed++;
        totalAssertions += 2; // 2 determinism equality assertions per case
      } else {
        throw new Error(`[${c.caseId}] Determinism violation: non-identical outputs across 3 executions!`);
      }

      console.log(`    ✅ [${c.caseId}] Passed (Accuracy: 100%, 3x Determinism: 100%, Assertions: ${caseAssertions + 2})`);
    }
  }

  console.log(`\n--------------------------------------------------------------------`);
  console.log(`✅ Tier 1 Deterministic Accuracy: ${accuracyPassed}/${totalCases} (${((accuracyPassed/totalCases)*100).toFixed(2)}%)`);
  console.log(`✅ Tier 2 Determinism Pass Rate:  ${determinismPassed}/${totalCases} (${((determinismPassed/totalCases)*100).toFixed(2)}%)`);
  console.log(`✅ Total Benchmark Assertions:    ${totalAssertions} verified across ${totalCases} cases (${totalCases * 3} executions)\n`);

  // 2. Performance Throughput Benchmark
  console.log("Tier 3: Measuring Engine Computational Throughput (ops/sec) & Latencies...");
  const domainResults = {};
  const ITERATIONS_PER_CASE = 5000;

  for (const domain of domains) {
    const cases = loadGolden(domain);
    const latencies = [];
    const t0 = performance.now();

    for (let i = 0; i < ITERATIONS_PER_CASE; i++) {
      for (const c of cases) {
        const start = performance.now();
        runCase(c);
        latencies.push(performance.now() - start);
      }
    }

    const totalTimeMs = performance.now() - t0;
    const totalOps = cases.length * ITERATIONS_PER_CASE;
    const opsPerSec = Math.round((totalOps / totalTimeMs) * 1000);

    latencies.sort((a, b) => a - b);
    const avgLatencyMs = Number((totalTimeMs / totalOps).toFixed(4));
    const p99Index = Math.floor(latencies.length * 0.99);
    const p99LatencyMs = Number(latencies[p99Index].toFixed(4));

    domainResults[domain] = {
      opsPerSec,
      avgLatencyMs,
      p99LatencyMs
    };

    console.log(`  ⚡ [${domain.padEnd(12)}]: ${opsPerSec.toLocaleString().padStart(8)} ops/sec | avg: ${avgLatencyMs} ms | p99: ${p99LatencyMs} ms`);
  }

  // Generate / Write JSON report if requested
  const reportArgIndex = process.argv.indexOf('--json-report');
  if (reportArgIndex !== -1 && process.argv[reportArgIndex + 1]) {
    const reportPath = path.resolve(process.argv[reportArgIndex + 1]);
    const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
    const reportData = {
      date: new Date().toISOString(),
      version: pkg.version,
      nodeVersion: process.version,
      domains: domainResults
    };
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2) + '\n');
    console.log(`\n📄 Benchmark artifact written to: ${reportPath}`);
  }

  console.log("\n====================================================================");
  console.log("🎉 Singapore Business Agent Skills Benchmark COMPLETED SUCCESSFULLY!");
}

if (require.main === module) {
  try {
    runBenchmark();
  } catch (err) {
    console.error(`\n❌ Benchmark failed:`, err);
    process.exit(1);
  }
}

module.exports = { runBenchmark };
