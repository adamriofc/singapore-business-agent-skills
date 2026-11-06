/**
 * Singapore Withholding Tax (WHT) Engine (`engines/wht-engine.js`)
 *
 * Implements deterministic calculation of Singapore Withholding Tax under
 * Income Tax Act 1947 Sections 45, 45A, and 45D on payments to non-residents:
 *   - Interest, loan commissions, guarantees (15% final)
 *   - Royalties, intellectual property, copyright (10% final)
 *   - Technical and management assistance fees (17% non-final / prevailing CIT rate)
 *   - Non-resident director fees and board remuneration (24% per YA 2024+)
 *   - Movable property charter and rental fees (15%)
 *
 * DOCTRINE: Pure numerical computation and statutory formula evaluation.
 * ZERO prescriptive text / ZERO subjective advice.
 * Pure Node.js, zero external dependencies.
 */

'use strict';

const fs = require('fs');
const path = require('path');

let WHT_RULES = null;
function getRules() {
  if (!WHT_RULES) {
    const rulesPath = path.join(__dirname, 'rules/wht-dta-rules.json');
    if (fs.existsSync(rulesPath)) {
      WHT_RULES = JSON.parse(fs.readFileSync(rulesPath, 'utf8'));
    } else {
      WHT_RULES = {
        domesticWhtRates: {
          interest: 0.15,
          royalties: 0.10,
          technicalAndManagementFees: 0.17,
          directorsFeesNonResident: 0.24,
          rentMovableProperty: 0.15
        }
      };
    }
  }
  return WHT_RULES;
}

const VALID_PAYMENT_TYPES = [
  'INTEREST',
  'ROYALTY',
  'TECHNICAL_OR_MANAGEMENT_FEE',
  'DIRECTORS_FEE',
  'RENT_MOVABLE_PROPERTY'
];

/**
 * Calculates statutory Withholding Tax for payment to a non-resident entity/individual.
 *
 * @param {Object} input
 * @param {string} input.paymentType - One of VALID_PAYMENT_TYPES
 * @param {number} input.grossAmountSgd - Gross payment in SGD
 * @param {boolean} [input.isGrossUp=false] - Whether Singapore payor absorbs tax
 * @param {number} [input.customTreatyRate] - Overriding DTA tax treaty rate if applicable
 * @returns {Object} Deterministic WHT calculation
 */
function calculateSingaporeWht(input = {}) {
  if (!input || typeof input !== 'object') {
    throw new Error("INVALID_INPUT: Input must be a valid configuration object");
  }

  const pType = String(input.paymentType || '').toUpperCase().trim();
  if (!VALID_PAYMENT_TYPES.includes(pType)) {
    throw new Error(`INVALID_INPUT: 'paymentType' must be one of [${VALID_PAYMENT_TYPES.join(', ')}] (got '${input.paymentType}')`);
  }

  const gross = Number(input.grossAmountSgd);
  if (isNaN(gross) || gross <= 0 || !isFinite(gross)) {
    throw new Error(`INVALID_INPUT: 'grossAmountSgd' must be a positive finite number (got ${input.grossAmountSgd})`);
  }

  const isGrossUp = Boolean(input.isGrossUp);
  const rules = getRules();
  const domestic = rules.domesticWhtRates;

  let baseRate = 0.15;
  switch (pType) {
    case 'INTEREST':
      baseRate = domestic.interest || 0.15;
      break;
    case 'ROYALTY':
      baseRate = domestic.royalties || 0.10;
      break;
    case 'TECHNICAL_OR_MANAGEMENT_FEE':
      baseRate = domestic.technicalAndManagementFees || 0.17;
      break;
    case 'DIRECTORS_FEE':
      baseRate = domestic.directorsFeesNonResident || 0.24;
      break;
    case 'RENT_MOVABLE_PROPERTY':
      baseRate = domestic.rentMovableProperty || 0.15;
      break;
  }

  let finalRate = baseRate;
  let treatyApplied = false;

  if (input.customTreatyRate !== undefined) {
    const treatyRate = Number(input.customTreatyRate);
    if (isNaN(treatyRate) || treatyRate < 0 || treatyRate > 1.0) {
      throw new Error(`INVALID_INPUT: 'customTreatyRate' must be between 0.0 and 1.0 (got ${input.customTreatyRate})`);
    }
    if (treatyRate < baseRate) {
      finalRate = treatyRate;
      treatyApplied = true;
    }
  }

  let effectiveGross = gross;
  let taxAmount = 0;
  let netRemittance = gross;

  if (isGrossUp) {
    // Gross-up formula: Effective Gross = Net Remittance / (1 - Rate)
    effectiveGross = Math.round((gross / (1 - finalRate)) * 100) / 100;
    taxAmount = Math.round((effectiveGross - gross) * 100) / 100;
    netRemittance = gross;
  } else {
    taxAmount = Math.round(gross * finalRate * 100) / 100;
    netRemittance = Math.round((gross - taxAmount) * 100) / 100;
  }

  return {
    paymentType: pType,
    statutoryDomesticRate: baseRate,
    appliedRate: finalRate,
    isTreatyRateApplied: treatyApplied,
    isGrossUpAbsorption: isGrossUp,
    nominalAmountSgd: gross,
    recalculatedGrossAmountSgd: effectiveGross,
    withholdingTaxPayableToIrasSgd: taxAmount,
    netRemittanceToNonResidentSgd: netRemittance,
    irasFormType: 'FORM_IR37',
    duePaymentDeadline: "By the 15th of the second month following the date of payment"
  };
}

module.exports = {
  calculateSingaporeWht,
  VALID_PAYMENT_TYPES
};
