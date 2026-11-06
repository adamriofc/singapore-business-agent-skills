/**
 * Dynamic Singapore Plugin & Skill Schema Validator (`tests/schema/validator.test.js`)
 *
 * Verifies that all 5 plugins and 15 SKILL.md frontmatters adhere strictly to the
 * Agent Skills Specification schema and Agent Capability Contracts.
 */

'use strict';

const fs = require('fs');
const path = require('path');

function discoverPlugins(rootDir) {
  const entries = fs.readdirSync(rootDir, { withFileTypes: true });
  const plugins = [];

  for (const entry of entries) {
    if (entry.isDirectory() && !['engines', 'scripts', 'tests', 'fixtures', 'docs', '.git', '.github', 'node_modules', 'bin', 'registry', 'bundles'].includes(entry.name)) {
      const manifestPath = path.join(rootDir, entry.name, '.claude-plugin', 'plugin.json');
      if (fs.existsSync(manifestPath)) {
        plugins.push(entry.name);
      }
    }
  }

  return plugins;
}

function parseYamlFrontmatter(yamlStr) {
  const lines = yamlStr.split('\n');
  const result = {};
  let currentTopKey = null;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    if (!rawLine.trim() || rawLine.trim().startsWith('#')) continue;
    const isIndented = /^\s+/.test(rawLine);

    if (isIndented && currentTopKey) {
      const trimmed = rawLine.trim();
      const colonIdx = trimmed.indexOf(':');
      if (colonIdx !== -1) {
        const subKey = trimmed.slice(0, colonIdx).trim();
        const rawSubVal = trimmed.slice(colonIdx + 1).trim();

        if (rawSubVal.startsWith('[') && rawSubVal.endsWith(']')) {
          const inner = rawSubVal.slice(1, -1).trim();
          if (/\[[^\]]*\]/.test(inner) && !/^\s*"/.test(inner) && !/^\s*'/.test(inner) && !inner.includes('","') && !inner.includes("','")) {
            throw new Error(`Invalid YAML flow sequence at line ${i + 1}: unquoted nested bracket detected in "${trimmed}"`);
          }
        }

        const subVal = rawSubVal.replace(/^['"]|['"]$/g, '');
        if (typeof result[currentTopKey] !== 'object' || result[currentTopKey] === null) {
          result[currentTopKey] = {};
        }
        result[currentTopKey][subKey] = subVal;
      }
      continue;
    }

    const trimmed = rawLine.trim();
    const colonIdx = trimmed.indexOf(':');
    if (colonIdx === -1) continue;

    const key = trimmed.slice(0, colonIdx).trim();
    const rawVal = trimmed.slice(colonIdx + 1).trim();

    if (rawVal && !rawVal.startsWith('"') && !rawVal.startsWith("'") && !rawVal.startsWith('[') && rawVal.includes(': ')) {
      throw new Error(`Invalid YAML scalar at line ${i + 1}: unquoted colon in value "${trimmed}"`);
    }

    const value = rawVal.replace(/^['"]|['"]$/g, '');

    if (key) {
      currentTopKey = key;
      result[key] = value || {};
    }
  }

  return result;
}

function validate() {
  console.log("🔍 Running Dynamic Singapore Plugin & Skill Schema Validation...\n");
  let errors = 0;
  let totalSkills = 0;
  const skillCountByPlugin = {};

  const rootDir = path.join(__dirname, '../..');
  const plugins = discoverPlugins(rootDir).sort();

  if (plugins.length === 0) {
    console.error("❌ No plugin directories discovered!");
    process.exit(1);
  }

  console.log(`  Discovered ${plugins.length} plugin(s): ${plugins.join(', ')}`);

  plugins.forEach(plugin => {
    const pluginDir = path.join(rootDir, plugin);

    // Validate plugin.json Manifest Schema
    const manifestPath = path.join(pluginDir, '.claude-plugin', 'plugin.json');
    try {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      
      if (!manifest.name || typeof manifest.name !== 'string' || manifest.name.trim() === '') {
        console.error(`❌ Manifest Schema Violation in ${manifestPath}: 'name' is required and must be a non-empty string.`);
        errors++;
      }
      
      if (!manifest.version || !/^\d+\.\d+\.\d+$/.test(manifest.version)) {
        console.error(`❌ Manifest Schema Violation in ${manifestPath}: 'version' must follow strict SemVer formatting (e.g. 1.0.0). Got: "${manifest.version}"`);
        errors++;
      }
      
      if (!manifest.description || typeof manifest.description !== 'string' || manifest.description.length < 10) {
        console.error(`❌ Manifest Schema Violation in ${manifestPath}: 'description' is too short or missing.`);
        errors++;
      }

      if (!manifest.author || typeof manifest.author !== 'object' || !manifest.author.name) {
        console.error(`❌ Manifest Schema Violation in ${manifestPath}: 'author.name' is required.`);
        errors++;
      }
    } catch (e) {
      console.error(`❌ JSON syntax error in ${manifestPath}: ${e.message}`);
      errors++;
    }

    // Validate Skills Frontmatter Schemas
    const skillsDir = path.join(pluginDir, 'skills');
    if (fs.existsSync(skillsDir)) {
      const skills = fs.readdirSync(skillsDir).sort();
      skillCountByPlugin[plugin] = skills.length;

      skills.forEach(skillDirName => {
        const skillFilePath = path.join(skillsDir, skillDirName, 'SKILL.md');
        if (!fs.existsSync(skillFilePath)) {
          console.error(`❌ Missing SKILL.md for skill: ${skillDirName} in ${plugin}`);
          errors++;
          return;
        }

        const content = fs.readFileSync(skillFilePath, 'utf8');
        if (!content.startsWith('---')) {
          console.error(`❌ Missing YAML frontmatter block in ${skillFilePath}`);
          errors++;
          return;
        }

        const parts = content.split('---');
        if (parts.length < 3) {
          console.error(`❌ Invalid YAML frontmatter delimiters in ${skillFilePath}`);
          errors++;
          return;
        }

        try {
          const frontmatter = parseYamlFrontmatter(parts[1]);
          
          if (!frontmatter.name || frontmatter.name.trim() === '') {
            console.error(`❌ Skill Schema Violation in ${skillFilePath}: 'name' must be a non-empty string in frontmatter.`);
            errors++;
          } else {
            if (frontmatter.name.length > 64) {
              console.error(`❌ Skill Schema Violation in ${skillFilePath}: 'name' exceeds 64 characters (${frontmatter.name.length}).`);
              errors++;
            }
            if (!/^[a-z0-9-]+$/.test(frontmatter.name)) {
              console.error(`❌ Skill Schema Violation in ${skillFilePath}: 'name' must be lowercase kebab-case. Got: "${frontmatter.name}"`);
              errors++;
            }
            if (frontmatter.name !== skillDirName) {
              console.error(`❌ Skill Schema Violation in ${skillFilePath}: 'name' ("${frontmatter.name}") does not match directory name ("${skillDirName}").`);
              errors++;
            }
          }
          
          if (!frontmatter.description || frontmatter.description.trim() === '') {
            console.error(`❌ Skill Schema Violation in ${skillFilePath}: 'description' must be a non-empty string in frontmatter.`);
            errors++;
          } else {
            if (frontmatter.description.length < 10 || frontmatter.description.length > 1024) {
              console.error(`❌ Skill Schema Violation in ${skillFilePath}: 'description' length must be between 10 and 1024 characters. Got ${frontmatter.description.length}.`);
              errors++;
            }
          }

          if (!frontmatter.capability || typeof frontmatter.capability !== 'object') {
            console.error(`❌ Agent Capability Contract Violation in ${skillFilePath}: 'capability' metadata block missing or invalid.`);
            errors++;
          } else {
            if (!frontmatter.capability.requires) {
              console.error(`❌ Agent Capability Contract Violation in ${skillFilePath}: 'capability.requires' is required.`);
              errors++;
            }
            if (!frontmatter.capability.produces) {
              console.error(`❌ Agent Capability Contract Violation in ${skillFilePath}: 'capability.produces' is required.`);
              errors++;
            }
          }

          totalSkills++;
        } catch (err) {
          console.error(`❌ Parsing Error in ${skillFilePath}: ${err.message}`);
          errors++;
        }
      });
    }
  });

  console.log(`\n  Validated ${totalSkills} skill(s) across ${plugins.length} plugin(s):`);
  Object.entries(skillCountByPlugin).forEach(([pl, count]) => {
    console.log(`    - ${pl}: ${count} skill(s)`);
  });

  if (errors > 0) {
    console.error(`\n❌ Schema Validation Failed with ${errors} error(s)!`);
    process.exit(1);
  } else {
    console.log(`\n✅ Dynamic Plugin & Skill Schema Validation PASSED 100%!`);
  }
}

validate();
