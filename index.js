/**
 * Singapore Business Agent Skills (`index.js`)
 *
 * Production-grade sovereign AI domain intelligence for Singapore corporate law (ACRA),
 * tax statutory compliance (IRAS), workforce & immigration (MOM/CPF), data privacy (PDPA),
 * financial structuring (MAS/SORA), and bilateral Singapore-Indonesia cross-border operations.
 *
 * ZERO runtime dependencies, 100% deterministic Node.js standard library implementation.
 */

'use strict';

const fs = require('fs');
const path = require('path');

// --- Statutory Ruleset Integrity ---
const integrity = require('./engines/rules/integrity.js');

// --- Tax Engines (IRAS & Treaties) ---
const citEngine = require('./engines/cit-tax-engine.js');
const gstEngine = require('./engines/gst-engine.js');
const whtEngine = require('./engines/wht-engine.js');
const dtaSgIdEngine = require('./engines/dta-sg-id-engine.js');

// --- Human Resources & Immigration Engines (MOM & CPF) ---
const cpfEngine = require('./engines/cpf-calculator.js');
const momOvertimeEngine = require('./engines/mom-overtime-engine.js');
const compassEngine = require('./engines/compass-scoring-engine.js');
const foreignWorkforceQuotaEngine = require('./engines/foreign-workforce-quota-engine.js');

// --- Legal & Governance Engines (ACRA & PDPC) ---
const acraDeadlineEngine = require('./engines/acra-statutory-deadline-engine.js');
const smallCompanyAuditEngine = require('./engines/small-company-audit-engine.js');
const pdpaBreachEngine = require('./engines/pdpa-breach-engine.js');

// --- Financial & Capital Structuring Engines (MAS & SFRS) ---
const soraWaccEngine = require('./engines/sora-wacc-engine.js');
const workingCapitalSgEngine = require('./engines/working-capital-sg-engine.js');

// --- Strategic & Cross-Border Engines ---
const enterpriseGrantEngine = require('./engines/enterprise-grant-engine.js');
const crossBorderHoldingEngine = require('./engines/cross-border-holding-engine.js');

// --- Security Sanitizer ---
const securitySanitizer = require('./engines/security-sanitizer.js');

const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));

module.exports = {
  version: pkg.version,
  name: pkg.name,

  // Ruleset verification
  verifyRulesetIntegrity: integrity.verifyRulesetIntegrity,
  verifyAllRulesets: integrity.verifyAllRulesets,
  REQUIRED_RULESETS: integrity.REQUIRED_RULESETS,
  EXPECTED_HASHES: integrity.EXPECTED_HASHES,

  // 1. Corporate Income Tax (IRAS)
  calculateSingaporeCit: citEngine.calculateSingaporeCit,

  // 2. Goods & Services Tax (IRAS)
  calculateSingaporeGstRate: gstEngine.calculateSingaporeGstRate,
  evaluateGstRegistrationLiability: gstEngine.evaluateGstRegistrationLiability,
  calculateGstFiling: gstEngine.calculateGstFiling,

  // 3. Withholding Tax (IRAS)
  calculateSingaporeWht: whtEngine.calculateSingaporeWht,
  VALID_PAYMENT_TYPES: whtEngine.VALID_PAYMENT_TYPES,

  // 4. Double Tax Agreement Singapore-Indonesia
  evaluateDtaSgIdRelief: dtaSgIdEngine.evaluateDtaSgIdRelief,
  FLOW_DIRECTIONS: dtaSgIdEngine.FLOW_DIRECTIONS,
  TREATY_INCOME_TYPES: dtaSgIdEngine.TREATY_INCOME_TYPES,

  // 5. CPF & Levies (CPF Board & MOM)
  calculateSingaporeCpf: cpfEngine.calculateSingaporeCpf,
  RESIDENTIAL_STATUSES: cpfEngine.RESIDENTIAL_STATUSES,

  // 6. Overtime & Part IV Compliance (MOM)
  calculateMomOvertimeAndCompliance: momOvertimeEngine.calculateMomOvertimeAndCompliance,
  EMPLOYEE_CATEGORIES: momOvertimeEngine.EMPLOYEE_CATEGORIES,

  // 7. COMPASS EP Scoring (MOM)
  evaluateCompassEpEligibility: compassEngine.evaluateCompassEpEligibility,
  getMinimumQualifyingSalary: compassEngine.getMinimumQualifyingSalary,
  SECTOR_TYPES: compassEngine.SECTOR_TYPES,
  QUALIFICATION_LEVELS: compassEngine.QUALIFICATION_LEVELS,

  // 8. Foreign Workforce Quotas & Levies (MOM)
  calculateForeignWorkforceQuota: foreignWorkforceQuotaEngine.calculateForeignWorkforceQuota,
  calculateLocalHeadcount: foreignWorkforceQuotaEngine.calculateLocalHeadcount,
  SUPPORTED_SECTORS: foreignWorkforceQuotaEngine.SUPPORTED_SECTORS,

  // 9. ACRA Statutory Deadlines & Penalties (ACRA)
  calculateAcraStatutoryDeadlines: acraDeadlineEngine.calculateAcraStatutoryDeadlines,
  addMonthsToDate: acraDeadlineEngine.addMonthsToDate,

  // 10. Small Company Audit Exemption (ACRA)
  evaluateSmallCompanyAuditExemption: smallCompanyAuditEngine.evaluateSmallCompanyAuditExemption,

  // 11. PDPA Data Breach Notification & Fines (PDPC)
  evaluatePdpaBreachNotification: pdpaBreachEngine.evaluatePdpaBreachNotification,
  SIGNIFICANT_HARM_PRESCRIBED: pdpaBreachEngine.SIGNIFICANT_HARM_PRESCRIBED,

  // 12. SORA WACC & Cost of Capital (MAS)
  calculateSingaporeWacc: soraWaccEngine.calculateSingaporeWacc,

  // 13. Working Capital & Cash Conversion Cycle
  calculateSingaporeWorkingCapital: workingCapitalSgEngine.calculateSingaporeWorkingCapital,

  // 14. Enterprise Singapore Grants (EnterpriseSG)
  evaluateEnterpriseGrant: enterpriseGrantEngine.evaluateEnterpriseGrant,
  SUPPORTED_GRANTS: enterpriseGrantEngine.SUPPORTED_GRANTS,

  // 15. Cross-Border Holding Structuring (SG-ID)
  evaluateCrossBorderHoldingStructure: crossBorderHoldingEngine.evaluateCrossBorderHoldingStructure,

  // 16. Security Sanitizer & Boundary Isolation
  sanitizeUntrustedPayload: securitySanitizer.sanitizeUntrustedPayload,
  wrapUntrustedPayload: securitySanitizer.wrapUntrustedPayload,
  extractIsolatedPayload: securitySanitizer.extractIsolatedPayload
};
