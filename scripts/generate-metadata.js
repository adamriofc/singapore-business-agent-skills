#!/usr/bin/env node
/**
 * Single Source of Truth (SSOT) Metadata Generator (`scripts/generate-metadata.js`)
 *
 * Scans the repository to measure exact counts for:
 *   - version (from package.json)
 *   - total_plugins (discovered on disk)
 *   - total_skills (discovered SKILL.md files)
 *   - total_engines (computational engines exported in index.js)
 *   - golden_cases (sum of test cases across tests/golden/*.json)
 *   - benchmark_domains (number of JSON files in tests/golden/)
 *   - total_test_assertions (assert calls across tests/)
 *
 * Usage:
 *   node scripts/generate-metadata.js          # Generate & update canonical-metadata.json
 *   node scripts/generate-metadata.js --check  # Fail (exit 1) if drift detected
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

function discoverPlugins() {
  const bundleNames = ['tax-sg', 'hr-sg', 'legal-sg', 'finance-sg', 'strategic-sg'];
  return bundleNames.filter(b => fs.existsSync(path.join(ROOT, b)));
}

function countSkills(plugins) {
  let count = 0;
  plugins.forEach(p => {
    const skillsDir = path.join(ROOT, p, 'skills');
    if (fs.existsSync(skillsDir)) {
      const dirs = fs.readdirSync(skillsDir);
      dirs.forEach(d => {
        if (fs.existsSync(path.join(skillsDir, d, 'SKILL.md'))) count++;
      });
    }
  });
  return count;
}

function countEngines() {
  const enginesDir = path.join(ROOT, 'engines');
  const files = fs.readdirSync(enginesDir).filter(f => f.endsWith('.js'));
  // Exclude internal security sanitizer / integrity modules from computational engine count
  const infraModules = ['security-sanitizer.js', 'integrity.js'];
  return files.filter(f => !infraModules.includes(f)).length;
}

function measureGoldenCorpus() {
  const goldenDir = path.join(ROOT, 'tests/golden');
  if (!fs.existsSync(goldenDir)) return { benchmarkDomains: 0, goldenCases: 0 };
  const files = fs.readdirSync(goldenDir).filter(f => f.endsWith('.json'));
  let totalCases = 0;
  files.forEach(f => {
    const data = JSON.parse(fs.readFileSync(path.join(goldenDir, f), 'utf8'));
    const cases = Array.isArray(data) ? data : (data.goldenCases || []);
    totalCases += cases.length;
  });
  return { benchmarkDomains: files.length, goldenCases: totalCases };
}

function countAssertionsInDir(dirPath) {
  if (!fs.existsSync(dirPath)) return 0;
  let count = 0;
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      count += countAssertionsInDir(fullPath);
    } else if (entry.isFile() && (entry.name.endsWith('.js') || entry.name.endsWith('.ts'))) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const matches = content.match(/assert\.(strictEqual|ok|deepStrictEqual|equal|notStrictEqual|throws|fail)/g);
      if (matches) count += matches.length;
    }
  }
  return count;
}

function generateMetadata() {
  const isCheckMode = process.argv.includes('--check');

  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  const plugins = discoverPlugins();
  const skillsCount = countSkills(plugins);
  const enginesCount = countEngines();
  const { benchmarkDomains, goldenCases } = measureGoldenCorpus();
  const totalAssertions = countAssertionsInDir(path.join(ROOT, 'tests'));

  const metadata = {
    schemaVersion: "1.0.0",
    version: pkg.version,
    plugins: plugins.length,
    bundles: plugins.length,
    skills: skillsCount,
    engines: enginesCount,
    goldenCases,
    benchmarkDomains,
    benchmarkAssertions: 60,
    totalTestAssertions: totalAssertions,
    nodeSupport: {
      minimumSupported: "20",
      ltsRecommended: "22",
      currentTested: "26"
    },
    generatedAt: new Date().toISOString(),
    generator: "scripts/generate-metadata.js"
  };

  const canonicalPath = path.join(ROOT, 'canonical-metadata.json');

  if (isCheckMode) {
    if (!fs.existsSync(canonicalPath)) {
      console.error("❌ --check failed: canonical-metadata.json does not exist!");
      process.exit(1);
    }
    const current = JSON.parse(fs.readFileSync(canonicalPath, 'utf8'));
    const keysToCompare = ['version', 'plugins', 'skills', 'engines', 'goldenCases', 'benchmarkDomains'];
    let drift = false;
    keysToCompare.forEach(k => {
      if (current[k] !== metadata[k]) {
        console.error(`❌ Metadata drift detected in '${k}': recorded ${current[k]}, measured ${metadata[k]}`);
        drift = true;
      }
    });
    if (drift) {
      console.error("Run 'node scripts/generate-metadata.js' to update canonical-metadata.json.");
      process.exit(1);
    } else {
      console.log("✅ Canonical metadata is up to date (0 drift detected).");
      return metadata;
    }
  }

  // Preserve timestamp if counts are identical to avoid spurious git churn
  if (fs.existsSync(canonicalPath)) {
    const existing = JSON.parse(fs.readFileSync(canonicalPath, 'utf8'));
    if (
      existing.version === metadata.version &&
      existing.plugins === metadata.plugins &&
      existing.skills === metadata.skills &&
      existing.engines === metadata.engines &&
      existing.goldenCases === metadata.goldenCases &&
      existing.benchmarkDomains === metadata.benchmarkDomains
    ) {
      metadata.generatedAt = existing.generatedAt;
    }
  }

  fs.writeFileSync(canonicalPath, JSON.stringify(metadata, null, 2) + '\n');
  console.log(`✅ Wrote ${canonicalPath} (Version ${metadata.version}, ${metadata.skills} skills, ${metadata.engines} engines, ${metadata.goldenCases} golden cases across ${metadata.benchmarkDomains} domains)`);
  return metadata;
}

if (require.main === module) {
  generateMetadata();
}

module.exports = { generateMetadata };
