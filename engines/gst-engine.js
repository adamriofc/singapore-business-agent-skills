/**
 * Singapore Goods and Services Tax (GST) Engine (`engines/gst-engine.js`)
 *
 * Implements deterministic evaluation of Singapore GST per Goods and Services Tax Act 1993:
 *   - Current statutory rate (9% per 1 Jan 2024)
 *   - Compulsory registration assessment (S$1M turnover threshold: retrospective & prospective tests)
 *   - Net GST payable (Output Tax minus Input Tax)
 *   - Reverse charge evaluation for imported B2B services
 *
 * DOCTRINE: Pure numerical computation and statutory formula evaluation.
 * ZERO prescriptive text / ZERO subjective advice.
 * Pure Node.js, zero external dependencies.
 */

'use strict';

const fs = require('fs');
const path = require('path');

let GST_RULES = null;
function getRules() {
  if (!GST_RULES) {
    const rulesPath = path.join(__dirname, 'rules/gst-rules.json');
    if (fs.existsSync(rulesPath)) {
      GST_RULES = JSON.parse(fs.readFileSync(rulesPath, 'utf8'));
    } else {
      GST_RULES = {
        currentRate: 0.09,
        compulsoryRegistrationThreshold: 1000000,
        lowValueGoodsThresholdSgd: 400
      };
    }
  }
  return GST_RULES;
}

/**
 * Returns statutory GST rate based on transaction date.
 *
 * @param {string} [dateStr] - ISO Date YYYY-MM-DD
 * @returns {number} Effective GST rate
 */
function calculateSingaporeGstRate(dateStr) {
  if (!dateStr) return 0.09;
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return 0.09;

  if (date < new Date('2023-01-01')) {
    return 0.07;
  } else if (date < new Date('2024-01-01')) {
    return 0.08;
  }
  return 0.09;
}

/**
 * Evaluates compulsory GST registration requirement.
 *
 * @param {Object} input
 * @param {number[]} [input.past4QuartersTurnover=[]] - Array of 4 quarters taxable turnover in SGD
 * @param {number} [input.projectedNext12MonthsTurnover=0] - Expected turnover in SGD
 * @returns {Object} GST registration liability audit
 */
function evaluateGstRegistrationLiability(input = {}) {
  if (!input || typeof input !== 'object') {
    throw new Error("INVALID_INPUT: Input must be a valid configuration object");
  }

  const pastQuarters = Array.isArray(input.past4QuartersTurnover) ? input.past4QuartersTurnover : [];
  pastQuarters.forEach((q, idx) => {
    if (typeof q !== 'number' || isNaN(q) || q < 0 || !isFinite(q)) {
      throw new Error(`INVALID_INPUT: 'past4QuartersTurnover' element at index ${idx} must be a non-negative finite number (got ${q})`);
    }
  });

  const projected = Number(input.projectedNext12MonthsTurnover || 0);
  if (isNaN(projected) || projected < 0 || !isFinite(projected)) {
    throw new Error(`INVALID_INPUT: 'projectedNext12MonthsTurnover' must be a non-negative finite number (got ${input.projectedNext12MonthsTurnover})`);
  }

  const rules = getRules();
  const threshold = rules.compulsoryRegistrationThreshold || 1000000;

  const totalPast12Months = pastQuarters.reduce((acc, v) => acc + v, 0);
  const retrospectiveBreach = totalPast12Months > threshold;
  const prospectiveBreach = projected > threshold;

  const isLiable = retrospectiveBreach || prospectiveBreach;
  let primaryReason = 'TURNOVER_BELOW_STATUTORY_THRESHOLD';

  if (retrospectiveBreach && prospectiveBreach) {
    primaryReason = 'BOTH_RETROSPECTIVE_AND_PROSPECTIVE_THRESHOLDS_EXCEEDED';
  } else if (retrospectiveBreach) {
    primaryReason = 'RETROSPECTIVE_PAST_12_MONTHS_EXCEEDED_S1M';
  } else if (prospectiveBreach) {
    primaryReason = 'PROSPECTIVE_FORECAST_12_MONTHS_EXCEEDS_S1M';
  }

  return {
    thresholdSgd: threshold,
    past12MonthsTurnoverSgd: Math.round(totalPast12Months * 100) / 100,
    projectedNext12MonthsTurnoverSgd: Math.round(projected * 100) / 100,
    retrospectiveBreach,
    prospectiveBreach,
    isCompulsoryRegistrationRequired: isLiable,
    verdictCode: primaryReason,
    registrationDeadlineGuidance: isLiable ? "Must register within 30 days of liability date" : "Voluntary registration permitted"
  };
}

/**
 * Calculates Net GST Payable for a reporting period.
 *
 * @param {Object} input
 * @param {number} input.standardRatedSuppliesSgd - Taxable sales in SGD
 * @param {number} [input.taxablePurchasesSgd=0] - Purchases eligible for input tax claim in SGD
 * @param {number} [input.importedB2bServicesSgd=0] - Imported services subject to reverse charge in SGD
 * @param {number} [input.effectiveRate=0.09] - GST rate (defaults to 9%)
 * @returns {Object} GST tax ledger calculation
 */
function calculateGstFiling(input = {}) {
  if (!input || typeof input !== 'object') {
    throw new Error("INVALID_INPUT: Input must be a valid configuration object");
  }

  const supplies = Number(input.standardRatedSuppliesSgd);
  const purchases = Number(input.taxablePurchasesSgd || 0);
  const importedServices = Number(input.importedB2bServicesSgd || 0);
  const rate = input.effectiveRate !== undefined ? Number(input.effectiveRate) : 0.09;

  if (isNaN(supplies) || supplies < 0 || !isFinite(supplies)) {
    throw new Error(`INVALID_INPUT: 'standardRatedSuppliesSgd' must be a non-negative finite number (got ${input.standardRatedSuppliesSgd})`);
  }
  if (isNaN(purchases) || purchases < 0 || !isFinite(purchases)) {
    throw new Error(`INVALID_INPUT: 'taxablePurchasesSgd' must be a non-negative finite number (got ${input.taxablePurchasesSgd})`);
  }
  if (isNaN(importedServices) || importedServices < 0 || !isFinite(importedServices)) {
    throw new Error(`INVALID_INPUT: 'importedB2bServicesSgd' must be a non-negative finite number (got ${input.importedB2bServicesSgd})`);
  }
  if (isNaN(rate) || rate < 0 || rate > 0.5) {
    throw new Error(`INVALID_INPUT: 'effectiveRate' must be a valid percentage between 0 and 0.5 (got ${input.effectiveRate})`);
  }

  const outputTaxStandard = Math.round(supplies * rate * 100) / 100;
  const reverseChargeTax = Math.round(importedServices * rate * 100) / 100;
  const totalOutputTax = Math.round((outputTaxStandard + reverseChargeTax) * 100) / 100;

  // Input tax claimed (including reverse charge as input tax if fully taxable business)
  const standardInputTax = Math.round(purchases * rate * 100) / 100;
  const reverseChargeInputTax = reverseChargeTax; // claiming back under full taxable supplies
  const totalInputTaxClaimed = Math.round((standardInputTax + reverseChargeInputTax) * 100) / 100;

  const netGstPayable = Math.round((totalOutputTax - totalInputTaxClaimed) * 100) / 100;

  return {
    effectiveRate: rate,
    standardRatedSuppliesSgd: supplies,
    outputTaxStandardSgd: outputTaxStandard,
    importedB2bServicesSgd: importedServices,
    reverseChargeOutputTaxSgd: reverseChargeTax,
    totalOutputTaxSgd: totalOutputTax,
    taxablePurchasesSgd: purchases,
    totalInputTaxClaimedSgd: totalInputTaxClaimed,
    netGstPayableSgd: netGstPayable,
    position: netGstPayable >= 0 ? 'NET_PAYABLE_TO_IRAS' : 'NET_REFUND_FROM_IRAS'
  };
}

module.exports = {
  calculateSingaporeGstRate,
  evaluateGstRegistrationLiability,
  calculateGstFiling
};
