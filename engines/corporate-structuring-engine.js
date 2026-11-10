/**
 * Singapore Corporate Structuring & Holding Governance Engine (`engines/corporate-structuring-engine.js`)
 *
 * Implements deterministic statutory assessment for Singapore holding company structures,
 * subsidiary governance, and corporate entity optimization under:
 *   - Singapore Companies Act 1967 (Cap 50)
 *   - Income Tax Act 1947 Section 13(8) (Foreign-Sourced Income Exemption - FSIE)
 *   - Income Tax Act 1947 Section 13W (Safe Harbour for Capital Gains on Disposal of Ordinary Shares)
 *   - Singapore Single-Tier Corporate Tax System (0% dividend tax on outbound distributions)
 *
 * DOCTRINE: Pure numerical computation and statutory formula evaluation.
 * ZERO prescriptive text / ZERO subjective advice.
 * Pure Node.js, zero external dependencies.
 */

'use strict';

/**
 * Evaluates holding structure tax efficiency, Section 13(8) FSIE eligibility,
 * Section 13W capital gains safe harbour, and net repatriation economics.
 *
 * @param {Object} input
 * @param {number} input.dividendAmountSgd - Gross foreign or domestic dividend received by Singapore entity
 * @param {number} [input.equityShareholdingPercent=100] - Shareholding percentage in operating subsidiary
 * @param {number} [input.shareHoldingDurationMonths=24] - Holding period in months (for Section 13W test)
 * @param {number} [input.sourceJurisdictionHeadlineCitRate=0.20] - Headline tax rate in investee jurisdiction
 * @param {boolean} [input.subjectToTaxInSource=true] - Whether dividend/income was subject to tax in origin
 * @param {boolean} [input.isBonaFideResident=true] - Whether Singapore holding entity is resident for tax purposes
 * @param {number} [input.annualMaintenanceCostSgd=8000] - Annual secretarial, corporate filing & compliance cost
 * @returns {Object} Comprehensive corporate structuring and repatriation analysis
 */
function evaluateCorporateStructuring(input = {}) {
  if (!input || typeof input !== 'object') {
    throw new Error("INVALID_INPUT: Input must be a valid configuration object");
  }

  const grossDividend = Number(input.dividendAmountSgd);
  if (isNaN(grossDividend) || grossDividend <= 0 || !isFinite(grossDividend)) {
    throw new Error(`INVALID_INPUT: 'dividendAmountSgd' must be a positive finite number (got ${input.dividendAmountSgd})`);
  }

  const equityPct = input.equityShareholdingPercent !== undefined ? Number(input.equityShareholdingPercent) : 100;
  if (isNaN(equityPct) || equityPct <= 0 || equityPct > 100) {
    throw new Error(`INVALID_INPUT: 'equityShareholdingPercent' must be between 0 and 100 (got ${input.equityShareholdingPercent})`);
  }

  const holdingMonths = Number(input.shareHoldingDurationMonths !== undefined ? input.shareHoldingDurationMonths : 24);
  const sourceCit = Number(input.sourceJurisdictionHeadlineCitRate !== undefined ? input.sourceJurisdictionHeadlineCitRate : 0.20);
  const subjectToTax = input.subjectToTaxInSource !== undefined ? Boolean(input.subjectToTaxInSource) : true;
  const isResident = input.isBonaFideResident !== undefined ? Boolean(input.isBonaFideResident) : true;
  const maintCost = Math.max(0, Number(input.annualMaintenanceCostSgd || 8000));

  // 1. Section 13(8) Foreign-Sourced Income Exemption (FSIE) Test
  // Conditions:
  // a) Headline tax rate in foreign country >= 15%
  // b) Income subject to tax in foreign country
  // c) Beneficial recipient is tax resident of Singapore
  const meetsHeadlineRateTest = sourceCit >= 0.15;
  const meetsSubjectToTaxTest = subjectToTax;
  const meetsBeneficialResidentTest = isResident;

  const qualifiesForSection138Fsie = meetsHeadlineRateTest && meetsSubjectToTaxTest && meetsBeneficialResidentTest;

  // Singapore Corporate Tax on incoming dividend
  // If exempt under 13(8), CIT = 0. Else standard CIT 17% applies
  const sgCitRate = qualifiesForSection138Fsie ? 0.0 : 0.17;
  const sgCitPayable = Math.round(grossDividend * sgCitRate * 100) / 100;

  // 2. Singapore Outbound Dividend Distribution (Single-Tier System)
  // Singapore does NOT impose withholding tax on dividend distributions to shareholders (resident or non-resident)
  const outboundDividendWhtRate = 0.0;
  const outboundDividendWhtPayable = 0.0;

  // Net Cash Delivered to Holding Shareholders
  const netDividendDelivered = Math.round((grossDividend - sgCitPayable) * 100) / 100;
  const netCashAfterMaintenance = Math.max(0, Math.round((netDividendDelivered - maintCost) * 100) / 100);

  // 3. Section 13W Safe Harbour Capital Gains Test
  // Disposal of ordinary shares by a Singapore company:
  // Legally exempt if:
  // - Singapore company holds >= 20% of ordinary shares
  // - Holding continuous period >= 24 months immediately prior to disposal
  const meetsShareholdingThreshold = equityPct >= 20.0;
  const meetsHoldingPeriodThreshold = holdingMonths >= 24;
  const qualifiesForSection13WSafeHarbour = meetsShareholdingThreshold && meetsHoldingPeriodThreshold;

  // Effective Tax Rate in Singapore
  const effectiveSingaporeTaxRate = Math.round((sgCitPayable / grossDividend) * 10000) / 10000;

  return {
    dividendGrossAmount: grossDividend,
    equityShareholdingPercentage: equityPct,
    holdingPeriodMonths: holdingMonths,
    singaporeHoldingAssessment: {
      qualifiesForSection138Fsie,
      singaporeCorporateTaxRate: sgCitRate,
      singaporeCorporateTaxPayable: sgCitPayable,
      singaporeOutboundDividendWhtRate: outboundDividendWhtRate,
      singaporeOutboundDividendWhtPayable: outboundDividendWhtPayable,
      netDividendRepatriated: netDividendDelivered,
      annualHoldingMaintenanceCost: maintCost,
      netCashDeliverable: netCashAfterMaintenance,
      effectiveSingaporeTaxRate
    },
    capitalGainsSection13W: {
      qualifiesForSection13WSafeHarbour,
      meetsShareholdingThreshold,
      meetsHoldingPeriodThreshold,
      capitalGainsTaxRateInSingapore: 0.0,
      statutoryExemptionStatus: qualifiesForSection13WSafeHarbour ? 'CONFIRMED_SAFE_HARBOUR_EXEMPT' : 'SUBJECT_TO_BADGES_OF_TRADE_REVIEW'
    },
    statutoryBasis: {
      fsieStatute: "Income Tax Act 1947, Section 13(8) (Foreign-Sourced Income Exemption)",
      capitalGainsStatute: "Income Tax Act 1947, Section 13W (Exemption of Gains from Disposal of Shares)",
      singleTierStatute: "Income Tax Act 1947, Section 13(1)(za) (One-Tier Corporate Tax System)",
      governingAuthority: "Inland Revenue Authority of Singapore (IRAS) & ACRA"
    }
  };
}

module.exports = {
  evaluateCorporateStructuring
};
