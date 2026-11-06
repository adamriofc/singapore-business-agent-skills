'use strict';

const assert = require('assert');
const { execSync } = require('child_process');
const path = require('path');

function runCliTests() {
  console.log("🇸🇬 Running Singapore Agent Skills CLI Binary Tests...\n");

  const binPath = path.join(__dirname, '../../bin/sg-agent-skills.js');

  // 1. Version Flag
  const versionOutput = execSync(`node "${binPath}" --version`, { encoding: 'utf8' }).trim();
  assert.strictEqual(versionOutput, 'v1.0.0');
  console.log("  ✅ CLI: --version outputs v1.0.0");

  // 2. Help Flag
  const helpOutput = execSync(`node "${binPath}" --help`, { encoding: 'utf8' });
  assert.strictEqual(helpOutput.includes('Singapore Business Agent Skills (SBAS) - CLI'), true);
  console.log("  ✅ CLI: --help outputs usage text");

  // 3. CIT Command
  const citRaw = execSync(`node "${binPath}" cit --income=100000 --startup=true --ya=2024`, { encoding: 'utf8' });
  const citRes = JSON.parse(citRaw);
  assert.strictEqual(citRes.yearOfAssessment, 2024);
  assert.strictEqual(citRes.exemptionScheme, 'START_UP_TAX_EXEMPTION_SUTE');
  assert.strictEqual(typeof citRes.netTaxPayableSgd, 'number');
  console.log("  ✅ CLI: 'cit' command executed and returned valid JSON");

  // 4. CPF Command
  const cpfRaw = execSync(`node "${binPath}" cpf --ow=6000 --age=30 --status=CITIZEN --year=2024`, { encoding: 'utf8' });
  const cpfRes = JSON.parse(cpfRaw);
  assert.strictEqual(cpfRes.residentialStatus, 'CITIZEN');
  assert.strictEqual(cpfRes.contributions.employeeCpfSgd, 1200);
  assert.strictEqual(cpfRes.contributions.employerCpfSgd, 1020);
  console.log("  ✅ CLI: 'cpf' command executed with statutory contributions");

  // 5. Integrity Command
  const intRaw = execSync(`node "${binPath}" integrity`, { encoding: 'utf8' });
  const intRes = JSON.parse(intRaw);
  assert.strictEqual(intRes.status, 'ALL_VERIFIED');
  assert.strictEqual(intRes.verifiedCount, 8);
  console.log("  ✅ CLI: 'integrity' command verified 8 ruleset files cryptographically");

  console.log("\n✅ All CLI Binary Tests Passed 100%!");
}

runCliTests();
