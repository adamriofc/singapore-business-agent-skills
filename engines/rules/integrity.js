/**
 * Cryptographic SHA-256 Ruleset Integrity & Tamper Protection Anchor
 * (`engines/rules/integrity.js`)
 *
 * Verifies that all statutory rulesets match the signed SHA-256 trust anchor hashes.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const EXPECTED_HASHES = {
  'acra-statutory-rules.json': 'a49ddd95a56951f8ab913e5fb6fce5a2de6f42af79cb62f70a17732ba09d2558',
  'cit-rules.json': '30d0061460cd06cd096e14234dad9aee9b04dc9cdc08c6f2598e00c26ed5a82c',
  'compass-rules.json': '322d71bcf8903e2abcdcbd7d9947d579ca9a2fd24ff02013d5321acf20621d73',
  'cpf-rules.json': '34e3ab3adcfd4d8bc99f4a30f63cde724bb2213213adb6e21c1d75a74f831c48',
  'gst-rules.json': '9951cde8002960dfa26a57483467c37915758297f4f8bb56a5da6635e71a1955',
  'mom-workforce-rules.json': 'eebf9f3818dd9eb5fd4ed8e75d34380e93bfc3218e663cab15b4d68287828f62',
  'pdpa-rules.json': '8efad5242814c8ca12aa60aabb7cf88f305578c1efcf7ccc7f0029cf51f8c43f',
  'wht-dta-rules.json': '7b1e776335a9113197d507e9453390c7e7b73299b285606fb49e7510dee06e00'
};

const REQUIRED_RULESETS = Object.keys(EXPECTED_HASHES);

function verifyRulesetIntegrity(fileBasename, overrideFilePath = null) {
  const expected = EXPECTED_HASHES[fileBasename];
  if (!expected) {
    throw new Error('No registered hash manifest for: ' + fileBasename);
  }
  const filePath = overrideFilePath || path.join(__dirname, fileBasename);
  if (!fs.existsSync(filePath)) {
    throw new Error('Missing ruleset file: ' + fileBasename);
  }
  const content = fs.readFileSync(filePath);
  const actual = crypto.createHash('sha256').update(content).digest('hex');
  if (actual !== expected) {
    throw new Error('Cryptographic Integrity Violation: Ruleset ' + fileBasename + ' has been tampered with! Expected ' + expected + ', got ' + actual);
  }
  return {
    status: 'VERIFIED',
    file: fileBasename,
    hash: actual
  };
}

function verifyAllRulesets() {
  const results = [];
  for (const file of REQUIRED_RULESETS) {
    results.push(verifyRulesetIntegrity(file));
  }
  return {
    status: 'ALL_VERIFIED',
    verifiedCount: results.length,
    results
  };
}

module.exports = {
  EXPECTED_HASHES,
  REQUIRED_RULESETS,
  verifyRulesetIntegrity,
  verifyAllRulesets
};
