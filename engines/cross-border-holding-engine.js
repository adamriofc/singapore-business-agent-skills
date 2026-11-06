/**
 * Singapore-Indonesia Cross-Border Holding Structure Engine (`engines/cross-border-holding-engine.js`)
 *
 * Implements deterministic cross-border corporate structuring and tax leakage analysis
 * comparing Direct Investment vs Singapore Holding Company intermediary:
 *   - Dividend repatriation tax waterfall (Indonesian PT -> SG HoldCo -> Ultimate Beneficiary)
 *   - Indonesian WHT reduction under DTA Article 10 (20% domestic PPh 26 reduced to 10% DTA rate)
 *   - Singapore Section 13(8) Foreign-Sourced Income Exemption (FSIE) qualification check
 *   - Singapore Single-Tier dividend distribution (0% withholding tax on outbound dividends)
 *   - Section 13W safe harbour capital gains exemption test (>= 20% holding for >= 24 months)
 *   - Net cash extraction efficiency and overall tax leakage delta
 *
 * DOCTRINE: Pure numerical computation and statutory treaty analysis.
 * ZERO prescriptive text / ZERO subjective advice.
 * Pure Node.js, zero external dependencies.
 */

'use strict';

/**
 * Evaluates dividend repatriation waterfall and capital gains tax efficiency
 * between Direct Holding and Singapore Holding Company structure.
 *
 * @param {Object} input
 * @param {number} input.dividendAmountIdrOrSgd - Gross dividend declared by Indonesian operating entity
 * @param {number} [input.equityShareholdingPercent=100] - Shareholding percentage (for DTA 25% test & Sec 13W 20% test)
 * @param {number} [input.shareHoldingDurationMonths=24] - Months held (for Section 13W 24-month safe harbour)
 * @param {boolean} [input.hasValidCorCertificate=true] - Certificate of Residence from IRAS
 * @param {number} [input.operatingTaxRateInOrigin=0.22] - Indonesian CIT rate (default 22% >= 15% FSIE test)
 * @param {number} [input.estimatedAnnualSgMaintenanceCostSgd=8000] - Annual secretarial/director/compliance cost
 * @returns {Object} Comprehensive structural tax waterfall comparison
 */
function evaluateCrossBorderHoldingStructure(input = {}) {
  if (!input || typeof input !== 'object') {
    throw new Error("INVALID_INPUT: Input must be a valid configuration object");
  }

  const grossDividend = Number(input.dividendAmountIdrOrSgd);
  if (isNaN(grossDividend) || grossDividend <= 0 || !isFinite(grossDividend)) {
    throw new Error(`INVALID_INPUT: 'dividendAmountIdrOrSgd' must be a positive finite number (got ${input.dividendAmountIdrOrSgd})`);
  }

  const equityPct = input.equityShareholdingPercent !== undefined ? Number(input.equityShareholdingPercent) : 100;
  if (isNaN(equityPct) || equityPct <= 0 || equityPct > 100) {
    throw new Error(`INVALID_INPUT: 'equityShareholdingPercent' must be between 0 and 100 (got ${input.equityShareholdingPercent})`);
  }

  const holdingMonths = Number(input.shareHoldingDurationMonths !== undefined ? input.shareHoldingDurationMonths : 24);
  const hasCor = input.hasValidCorCertificate !== undefined ? Boolean(input.hasValidCorCertificate) : true;
  const originCit = Number(input.operatingTaxRateInOrigin !== undefined ? input.operatingTaxRateInOrigin : 0.22);
  const sgMaintCost = Number(input.estimatedAnnualSgMaintenanceCostSgd || 8000);

  // --- 1. DIRECT NON-RESIDENT STRUCTURE (WITHOUT SG HOLDCO) ---
  // Indonesian statutory PPh 26 domestic rate is 20%
  const directWhtRate = 0.20;
  const directWhtTax = Math.round(grossDividend * directWhtRate * 100) / 100;
  const directNetProceeds = Math.round((grossDividend - directWhtTax) * 100) / 100;
  const directEffectiveTaxRate = directWhtRate;

  // --- 2. SINGAPORE HOLDCO INTERMEDIARY STRUCTURE ---
  // Indonesian WHT under SG-ID DTA Article 10:
  // If holding >= 25% and has COR, rate is 10%. Otherwise 15%. If no COR, 20%.
  let treatyWhtRate = directWhtRate;
  if (hasCor) {
    treatyWhtRate = equityPct >= 25.0 ? 0.10 : 0.15;
  }
  const treatyWhtTax = Math.round(grossDividend * treatyWhtRate * 100) / 100;
  const dividendReceivedInSg = Math.round((grossDividend - treatyWhtTax) * 100) / 100;

  // Singapore Corporate Tax on incoming dividend:
  // FSIE under Section 13(8) ITA applies if:
  // 1) Headline tax rate of country from which dividend received >= 15% (Indonesia = 22% >= 15%: PASS)
  // 2) Dividend was subject to tax in origin country (PASS)
  const isFsieExempt = originCit >= 0.15;
  const sgCitOnDividend = isFsieExempt ? 0 : Math.round(dividendReceivedInSg * 0.17 * 100) / 100;

  // Singapore outbound dividend to ultimate beneficiary:
  // Single-Tier System -> 0% WHT
  const sgOutboundWhtRate = 0.0;
  const sgOutboundWhtTax = 0.0;
  const sgStructureNetProceeds = Math.round((dividendReceivedInSg - sgCitOnDividend - sgOutboundWhtTax) * 100) / 100;
  const sgTotalTaxPaid = treatyWhtTax + sgCitOnDividend;
  const sgEffectiveTaxRate = Math.round((sgTotalTaxPaid / grossDividend) * 10000) / 10000;

  // Net Tax Savings Delta
  const grossTaxSavings = Math.round((directWhtTax - sgTotalTaxPaid) * 100) / 100;

  // Section 13W Capital Gains Safe Harbour Test
  // Requires holding >= 20% of ordinary shares for continuous period >= 24 months
  const meetsSection13W = equityPct >= 20.0 && holdingMonths >= 24;

  return {
    dividendGrossAmount: grossDividend,
    equityShareholdingPercentage: equityPct,
    hasValidCorCertificate: hasCor,
    directHoldingScenario: {
      framework: 'INDONESIA_DOMESTIC_PPH26',
      withholdingTaxRate: directWhtRate,
      withholdingTaxPayable: directWhtTax,
      netCashDelivered: directNetProceeds,
      effectiveTaxLeakagePercent: Math.round(directEffectiveTaxRate * 1000) / 10
    },
    singaporeHoldingScenario: {
      framework: 'SINGAPORE_HOLDCO_UNDER_SG_ID_DTA',
      indonesiaOutboundWhtRate: treatyWhtRate,
      indonesiaWhtTaxPayable: treatyWhtTax,
      dividendReceivedBySgHoldCo: dividendReceivedInSg,
      section13_8_FsieExemptionApplies: isFsieExempt,
      singaporeCitOnForeignDividend: sgCitOnDividend,
      singaporeOutboundDividendWhtRate: sgOutboundWhtRate,
      netCashDelivered: sgStructureNetProceeds,
      effectiveTaxLeakagePercent: Math.round(sgEffectiveTaxRate * 1000) / 10
    },
    comparativeAnalysis: {
      grossTaxSavingsBenefit: grossTaxSavings,
      annualSgHoldingMaintenanceCostEstimate: sgMaintCost,
      isHoldingStructureEconomicallySuperior: grossTaxSavings > sgMaintCost,
      netFinancialEfficiencyDelta: Math.round((grossTaxSavings - sgMaintCost) * 100) / 100
    },
    statutorySafeHarbours: {
      section13W_CapitalGainsSafeHarbourQualified: meetsSection13W,
      section13W_CriteriaMet: {
        holdingPercentageMeets20Percent: equityPct >= 20.0,
        holdingPeriodMeets24Months: holdingMonths >= 24
      }
    }
  };
}

module.exports = {
  evaluateCrossBorderHoldingStructure
};
