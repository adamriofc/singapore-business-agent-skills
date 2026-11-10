#!/usr/bin/env node
/**
 * Singapore Agent Capability Contract Validator (`scripts/validate-capabilities.js`)
 *
 * Verifies that all 15 SKILL.md files and registry/capabilities.json
 * strictly implement the Agent Capability Contract schema.
 *
 * Usage:
 *   node scripts/validate-capabilities.js
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const bundles = ['tax-sg', 'hr-sg', 'legal-sg', 'finance-sg', 'strategic-sg', 'marketing-sg'];

function validateCapabilities() {
  console.log("🇸🇬 Running Agent Capability Contract Schema Validator...\n");
  let errors = 0;
  let totalValidated = 0;

  const catalogPath = path.join(ROOT, 'registry/capabilities.json');
  if (!fs.existsSync(catalogPath)) {
    console.error("❌ Missing registry/capabilities.json. Run 'node scripts/generate-capability-catalog.js' first.");
    process.exit(1);
  }

  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
  const metadataPath = path.join(ROOT, 'canonical-metadata.json');
  const expectedTotal = fs.existsSync(metadataPath)
    ? JSON.parse(fs.readFileSync(metadataPath, 'utf8')).skills
    : 71;

  if (catalog.total_capabilities !== expectedTotal) {
    console.error(`❌ Capability Catalog Mismatch: catalog claims ${catalog.total_capabilities} capabilities, expected ${expectedTotal}.`);
    errors++;
  }

  catalog.capabilities.forEach(entry => {
    if (!entry.id || !entry.bundle || !entry.domain) {
      console.error(`❌ Capability Catalog Violation: entry missing required fields (id, bundle, domain)`);
      errors++;
      return;
    }

    if (!entry.capability || typeof entry.capability !== 'object') {
      console.error(`❌ Capability Contract Violation in capability '${entry.id}': missing 'capability' object`);
      errors++;
      return;
    }

    if (!Array.isArray(entry.capability.requires) || entry.capability.requires.length === 0) {
      console.error(`❌ Capability Contract Violation in capability '${entry.id}': 'capability.requires' must be a non-empty array`);
      errors++;
    } else {
      entry.capability.requires.forEach(req => {
        if (!req.name || !req.type || typeof req.required !== 'boolean') {
          console.error(`❌ Capability Contract Violation in capability '${entry.id}': typed 'requires' item missing name/type/required`);
          errors++;
        }
      });
    }

    if (!Array.isArray(entry.capability.produces) || entry.capability.produces.length === 0) {
      console.error(`❌ Capability Contract Violation in capability '${entry.id}': 'capability.produces' must be a non-empty array`);
      errors++;
    } else {
      entry.capability.produces.forEach(prod => {
        if (!prod.name || !prod.type) {
          console.error(`❌ Capability Contract Violation in capability '${entry.id}': typed 'produces' item missing name/type`);
          errors++;
        }
      });
    }

    totalValidated++;
    console.log(`  ✓ Validated contract for capability: ${entry.id} (${entry.bundle})`);
  });

  console.log(`\n---------------------------------------------------`);
  if (errors > 0) {
    console.error(`❌ Capability Contract Validation FAILED with ${errors} error(s).`);
    process.exit(1);
  } else {
    console.log(`✅ All ${totalValidated} Agent Capability Contracts strictly verified!`);
  }
}

validateCapabilities();
