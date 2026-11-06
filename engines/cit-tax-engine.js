/**
 * Singapore Corporate Income Tax (CIT) Engine (`engines/cit-tax-engine.js`)
 *
 * Implements deterministic calculation of Singapore Corporate Income Tax per
 * Income Tax Act 1947, including:
 *   - Standard CIT rate (17%)
 *   - Start-Up Tax Exemption (SUTE) for qualifying first 3 YAs (75% on first S$100k, 50% on next S$100k)
 *   - Partial Tax Exemption (PTE) for general companies (75% on first S$10k, 50% on next S$190k)
 *   - Corporate Income Tax (CIT) Rebate (e.g. YA 2024: 50% capped at S$40,000)
 *   - CIT Rebate Cash Grant (S$2,000 for qualifying employers with >=1 local employee)
 *
 * DOCTRINE: Pure numerical computation and statutory formula evaluation.
 * ZERO prescriptive text / ZERO subjective advice.
 * Pure Node.js, zero external dependencies.
 */

'use strict';

const fs = require('fs');
const path = require('path');

let CIT_RULES = null;
function getRules() {
  if (!CIT_RULES) {
    const rulesPath = path.join(__dirname, 'rules/cit-rules.json');
    if (fs.existsSync(rulesPath)) {
      CIT_RULES = JSON.parse(fs.readFileSync(rulesPath, 'utf8'));
    } else {
      CIT_RULES = {
        standardCitRate: 0.17,
        startUpTaxExemption: {
          tier1: { cap: 100000, exemptionRate: 0.75 },
          tier2: { cap: 100000, exemptionRate: 0.50 }
        },
        partialTaxExemption: {
          tier1: { cap: 10000, exemptionRate: 0.75 },
          tier2: { cap: 190000, exemptionRate: 0.50 }
        },
        corporateIncomeTaxRebate: {
          ya2024: { rebatePercent: 0.50, capIdrOrSgd: 40000, cashGrantMinimum: 2000 }
        }
      };
    }
  }
  return CIT_RULES;
}

/**
 * Calculates Corporate Income Tax for a Singapore incorporated entity.
 *
 * @param {Object} input
 * @param {number} input.chargeableIncome - Net taxable profit in SGD
 * @param {boolean} [input.isQualifyingStartup=false] - Meets all SUTE conditions
 * @param {number} [input.yearOfAssessment=2024] - Year of Assessment (YA)
 * @param {boolean} [input.hasLocalEmployeeWithCpf=false] - For CIT Rebate Cash Grant
 * @returns {Object} Deterministic CIT breakdown
 */
function calculateSingaporeCit(input = {}) {
  if (!input || typeof input !== 'object') {
    throw new Error("INVALID_INPUT: Input must be a valid configuration object");
  }

  const rawIncome = Number(input.chargeableIncome);
  if (isNaN(rawIncome) || rawIncome < 0 || !isFinite(rawIncome)) {
    throw new Error(`INVALID_INPUT: 'chargeableIncome' must be a non-negative finite number (got ${input.chargeableIncome})`);
  }

  const isQualifyingStartup = Boolean(input.isQualifyingStartup);
  const ya = Number(input.yearOfAssessment || 2024);
  const hasLocalEmployee = Boolean(input.hasLocalEmployeeWithCpf);

  const rules = getRules();
  const rate = rules.standardCitRate || 0.17;

  let exemptIncome = 0;
  let exemptionScheme = 'NONE';
  let tier1Exempt = 0;
  let tier2Exempt = 0;

  if (rawIncome > 0) {
    if (isQualifyingStartup) {
      exemptionScheme = 'START_UP_TAX_EXEMPTION_SUTE';
      const s1 = rules.startUpTaxExemption.tier1;
      const s2 = rules.startUpTaxExemption.tier2;

      const incTier1 = Math.min(rawIncome, s1.cap);
      tier1Exempt = Math.round(incTier1 * s1.exemptionRate * 100) / 100;

      const remaining = Math.max(0, rawIncome - s1.cap);
      const incTier2 = Math.min(remaining, s2.cap);
      tier2Exempt = Math.round(incTier2 * s2.exemptionRate * 100) / 100;

      exemptIncome = Math.round((tier1Exempt + tier2Exempt) * 100) / 100;
    } else {
      exemptionScheme = 'PARTIAL_TAX_EXEMPTION_PTE';
      const p1 = rules.partialTaxExemption.tier1;
      const p2 = rules.partialTaxExemption.tier2;

      const incTier1 = Math.min(rawIncome, p1.cap);
      tier1Exempt = Math.round(incTier1 * p1.exemptionRate * 100) / 100;

      const remaining = Math.max(0, rawIncome - p1.cap);
      const incTier2 = Math.min(remaining, p2.cap);
      tier2Exempt = Math.round(incTier2 * p2.exemptionRate * 100) / 100;

      exemptIncome = Math.round((tier1Exempt + tier2Exempt) * 100) / 100;
    }
  }

  const taxableAfterExemption = Math.max(0, Math.round((rawIncome - exemptIncome) * 100) / 100);
  const taxBeforeRebate = Math.round(taxableAfterExemption * rate * 100) / 100;

  // CIT Rebate
  let rebateAmount = 0;
  let cashGrant = 0;
  if (ya === 2024 && rules.corporateIncomeTaxRebate && rules.corporateIncomeTaxRebate.ya2024) {
    const reb = rules.corporateIncomeTaxRebate.ya2024;
    rebateAmount = Math.min(Math.round(taxBeforeRebate * reb.rebatePercent * 100) / 100, reb.capIdrOrSgd);
    if (hasLocalEmployee) {
      cashGrant = reb.cashGrantMinimum || 2000;
    }
  }

  const netTaxPayable = Math.max(0, Math.round((taxBeforeRebate - rebateAmount) * 100) / 100);
  const effectiveTaxRate = rawIncome > 0 ? Math.round((netTaxPayable / rawIncome) * 10000) / 100 : 0.0;

  return {
    yearOfAssessment: ya,
    chargeableIncomeSgd: rawIncome,
    standardCitRate: rate,
    exemptionScheme,
    exemptionBreakdown: {
      tier1ExemptSgd: tier1Exempt,
      tier2ExemptSgd: tier2Exempt,
      totalExemptIncomeSgd: exemptIncome
    },
    taxableIncomeAfterExemptionSgd: taxableAfterExemption,
    taxBeforeRebateSgd: taxBeforeRebate,
    citRebateSgd: rebateAmount,
    citCashGrantSgd: cashGrant,
    netTaxPayableSgd: netTaxPayable,
    effectiveTaxRatePercent: effectiveTaxRate
  };
}

module.exports = {
  calculateSingaporeCit
};
