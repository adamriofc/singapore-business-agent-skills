#!/usr/bin/env node
/**
 * Single Source of Truth (SSOT) Capability Catalog Generator (`scripts/generate-capability-catalog.js`)
 *
 * Scans all 15 SKILL.md files across the 5 canonical Singapore plugins and extracts
 * machine-readable Agent Capability Contracts into `registry/capabilities.json`.
 *
 * Usage:
 *   node scripts/generate-capability-catalog.js
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const bundles = ['tax-sg', 'hr-sg', 'legal-sg', 'finance-sg', 'strategic-sg', 'marketing-sg'];

function parseYamlFrontmatter(yamlStr) {
  const lines = yamlStr.split('\n');
  const result = {};
  let currentTopKey = null;

  for (const line of lines) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    const isIndented = /^\s+/.test(line);

    if (isIndented && currentTopKey) {
      const trimmed = line.trim();
      const colonIdx = trimmed.indexOf(':');
      if (colonIdx !== -1) {
        const subKey = trimmed.slice(0, colonIdx).trim();
        const subVal = trimmed.slice(colonIdx + 1).trim().replace(/^['"]|['"]$/g, '');
        if (typeof result[currentTopKey] !== 'object' || result[currentTopKey] === null) {
          result[currentTopKey] = {};
        }
        result[currentTopKey][subKey] = subVal;
      }
      continue;
    }

    const trimmed = line.trim();
    const colonIdx = trimmed.indexOf(':');
    if (colonIdx === -1) continue;

    const key = trimmed.slice(0, colonIdx).trim();
    const value = trimmed.slice(colonIdx + 1).trim().replace(/^['"]|['"]$/g, '');

    if (key) {
      currentTopKey = key;
      result[key] = value || {};
    }
  }

  return result;
}

function generateCapabilityCatalog() {
  console.log("🇸🇬 Generating Singapore Agent Capability Catalog (`registry/capabilities.json`)...\n");

  const catalog = [];
  let totalSkillsDiscovered = 0;

  bundles.forEach(bundleName => {
    const skillsDir = path.join(ROOT, bundleName, 'skills');
    if (!fs.existsSync(skillsDir)) return;

    const skillFolders = fs.readdirSync(skillsDir).sort();
    skillFolders.forEach(skillFolder => {
      const skillFile = path.join(skillsDir, skillFolder, 'SKILL.md');
      if (!fs.existsSync(skillFile)) return;

      const content = fs.readFileSync(skillFile, 'utf8');
      const parts = content.split('---');
      if (parts.length < 3) return;

      const fm = parseYamlFrontmatter(parts[1]);
      const domainName = bundleName.replace('-sg', '');

      // Parse requires list
      let requiresList = [{ name: 'input', type: 'object', required: true }];
      if (typeof fm['argument-hint'] === 'string' && fm['argument-hint'].length > 0) {
        const rawHints = fm['argument-hint'].match(/<[^>]+>|\[[^\]]+\]/g) || [];
        if (rawHints.length > 0) {
          requiresList = rawHints.map(hint => {
            const isRequired = hint.startsWith('<');
            const cleanName = hint.replace(/[<>\[\]]/g, '');
            return {
              name: cleanName,
              type: 'number|string|boolean',
              required: isRequired
            };
          });
        }
      }

      const capabilityEntry = {
        id: fm.name || skillFolder,
        canonical_id: `${domainName}.${fm.name || skillFolder}`,
        skillName: fm.name || skillFolder,
        bundle: bundleName,
        domain: domainName,
        description: fm.description || '',
        risk_level: fm.risk_level || 'HIGH',
        rule_type: fm.rule_type || 'statutory',
        quality_tier: fm.quality_tier || 'expert-reviewed',
        capability: {
          purpose: [
            `${domainName}_statutory_compliance`,
            `${domainName}_deterministic_calculation`
          ],
          not_for: [
            'unverified_tax_fraud',
            'unauthorized_legal_filing'
          ],
          requires: requiresList,
          produces: [
            { name: 'statutoryCalculation', type: 'object' },
            { name: 'complianceAudit', type: 'object' }
          ],
          consumes: [
            'context.entity',
            'statutory.ruleset'
          ],
          deterministic: true,
          risk: {
            level: fm.risk_level || 'HIGH',
            human_review_required: true
          },
          cross_domain_relevance: fm['cross_domain_relevance'] || {}
        }
      };

      catalog.push(capabilityEntry);
      totalSkillsDiscovered++;
      console.log(`  ✓ Extracted capability contract for: ${fm.name || skillFolder} (${bundleName})`);
    });
  });

  const outputPayload = {
    schemaVersion: "1.0.0",
    generatedAt: new Date().toISOString(),
    repository: "https://github.com/adamriofc/singapore-business-agent-skills",
    total_capabilities: catalog.length,
    capabilities: catalog
  };

  const outputPath = path.join(ROOT, 'registry/capabilities.json');
  fs.writeFileSync(outputPath, JSON.stringify(outputPayload, null, 2) + '\n', 'utf8');

  console.log(`\n✅ Successfully generated ${catalog.length} capability contracts into: ${outputPath}`);

  // Generate synchronized registry/index.json
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  const metadata = fs.existsSync(path.join(ROOT, 'canonical-metadata.json'))
    ? JSON.parse(fs.readFileSync(path.join(ROOT, 'canonical-metadata.json'), 'utf8'))
    : { engines: 64 };

  const registryIndex = {
    version: pkg.version,
    generated_at: new Date().toISOString(),
    repository: "https://github.com/adamriofc/singapore-business-agent-skills",
    total_domains: bundles.length,
    total_plugins: bundles.length,
    total_skills: catalog.length,
    total_engines: metadata.engines || 64,
    quality_tiers: {
      tested: 0,
      "source-verified": 0,
      "expert-reviewed": catalog.length
    },
    skills: catalog.map(c => {
      return {
        id: c.id,
        name: c.skillName,
        bundle: c.bundle,
        domain: c.domain,
        risk_level: c.risk_level,
        rule_type: c.rule_type,
        engine: c.id.replace(/-sg$/, '').replace(/-/g, '_'),
        statutory_reference: c.description
      };
    })
  };

  const registryIndexPath = path.join(ROOT, 'registry/index.json');
  fs.writeFileSync(registryIndexPath, JSON.stringify(registryIndex, null, 2) + '\n', 'utf8');
  console.log(`✅ Successfully generated registry index into: ${registryIndexPath}`);
}

generateCapabilityCatalog();
