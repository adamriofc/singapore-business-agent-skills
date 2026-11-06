/**
 * Singapore-Indonesia Double Taxation Agreement (DTA) Engine (`engines/dta-sg-id-engine.js`)
 *
 * Implements deterministic treaty analysis and tax relief calculation under the
 * Agreement between the Republic of Singapore and the Republic of Indonesia for the
 * Avoidance of Double Taxation and the Prevention of Fiscal Evasion with respect to
 * Taxes on Income (effective 1992, updated by 2021 Protocol):
 *   - Dividends (Article 10): 10% for substantial shareholding (>=25%), 15% general
 *   - Interest (Article 11): 10% standard (exemption for Gov/Central Bank)
 *   - Royalties (Article 12): 8% for equipment/industrial usage, 10% for IP/patents
 *   - Permanent Establishment (Article 5): 6-month threshold
 *   - Tax savings delta vs standard domestic rates (Indonesia standard 20% PPh 26 vs DTA rate)
 *
 * DOCTRINE: Pure numerical computation and statutory treaty article evaluation.
 * ZERO prescriptive text / ZERO subjective advice.
 * Pure Node.js, zero external dependencies.
 */

'use strict';

const fs = require('fs');
const path = require('path');

let DTA_RULES = null;
function getRules() {
  if (!DTA_RULES) {
    const rulesPath = path.join(__dirname, 'rules/wht-dta-rules.json');
    if (fs.existsSync(rulesPath)) {
      DTA_RULES = JSON.parse(fs.readFileSync(rulesPath, 'utf8'));
    } else {
      DTA_RULES = {
        dtaSingaporeIndonesia: {
          dividends: { substantialParticipationRate: 0.10, substantialParticipationMinimumHolding: 0.25, generalPortfolioRate: 0.15 },
          interest: { standardTreatyRate: 0.10 },
          royalties: { industrialCommercialScientificEquipment: 0.08, patentCopyrightTrademarks: 0.10 },
          permanentEstablishmentThresholdMonths: 6
        }
      };
    }
  }
  return DTA_RULES;
}

const FLOW_DIRECTIONS = ['SG_TO_ID', 'ID_TO_SG'];
const TREATY_INCOME_TYPES = ['DIVIDENDS', 'INTEREST', 'ROYALTIES', 'MANAGEMENT_OR_TECH_SERVICES'];

/**
 * Evaluates DTA treaty tax relief between Singapore and Indonesia.
 *
 * @param {Object} input
 * @param {string} input.incomeType - One of TREATY_INCOME_TYPES
 * @param {string} [input.flowDirection='ID_TO_SG'] - 'ID_TO_SG' (Indonesian source paying SG holding) or 'SG_TO_ID'
 * @param {number} input.grossAmountSgdOrIdr - Gross amount
 * @param {number} [input.equityHoldingPercentage=100] - Percentage of shares held (for dividends)
 * @param {string} [input.royaltyCategory='PATENT_COPYRIGHT'] - 'EQUIPMENT' (8%) or 'PATENT_COPYRIGHT' (10%)
 * @param {boolean} [input.hasValidCorOrDgtForm=true] - Certificate of Residence / e-SKD DGT form valid
 * @returns {Object} Deterministic treaty comparison & tax delta
 */
function evaluateDtaSgIdRelief(input = {}) {
  if (!input || typeof input !== 'object') {
    throw new Error("INVALID_INPUT: Input must be a valid configuration object");
  }

  const iType = String(input.incomeType || '').toUpperCase().trim();
  if (!TREATY_INCOME_TYPES.includes(iType)) {
    throw new Error(`INVALID_INPUT: 'incomeType' must be one of [${TREATY_INCOME_TYPES.join(', ')}] (got '${input.incomeType}')`);
  }

  const flow = String(input.flowDirection || 'ID_TO_SG').toUpperCase().trim();
  if (!FLOW_DIRECTIONS.includes(flow)) {
    throw new Error(`INVALID_INPUT: 'flowDirection' must be one of [${FLOW_DIRECTIONS.join(', ')}] (got '${input.flowDirection}')`);
  }

  const gross = Number(input.grossAmountSgdOrIdr);
  if (isNaN(gross) || gross <= 0 || !isFinite(gross)) {
    throw new Error(`INVALID_INPUT: 'grossAmountSgdOrIdr' must be a positive finite number (got ${input.grossAmountSgdOrIdr})`);
  }

  const equityHolding = input.equityHoldingPercentage !== undefined ? Number(input.equityHoldingPercentage) : 100;
  if (isNaN(equityHolding) || equityHolding < 0 || equityHolding > 100) {
    throw new Error(`INVALID_INPUT: 'equityHoldingPercentage' must be between 0 and 100 (got ${input.equityHoldingPercentage})`);
  }

  const hasCert = input.hasValidCorOrDgtForm !== undefined ? Boolean(input.hasValidCorOrDgtForm) : true;
  const royCat = String(input.royaltyCategory || 'PATENT_COPYRIGHT').toUpperCase().trim();

  const rules = getRules().dtaSingaporeIndonesia;

  // Domestic rate without treaty
  let domesticRate = 0.20; // Default Indonesian PPh 26 is 20%
  if (flow === 'SG_TO_ID') {
    // Singapore source domestic rate
    if (iType === 'DIVIDENDS') domesticRate = 0.0; // Singapore single tier system (exempt)
    else if (iType === 'INTEREST') domesticRate = 0.15;
    else if (iType === 'ROYALTIES') domesticRate = 0.10;
    else if (iType === 'MANAGEMENT_OR_TECH_SERVICES') domesticRate = 0.17;
  }

  let treatyRate = domesticRate;
  let treatyArticle = 'N/A';

  if (hasCert) {
    switch (iType) {
      case 'DIVIDENDS':
        treatyArticle = 'Article 10 (Dividends)';
        if (flow === 'SG_TO_ID') {
          treatyRate = 0.0; // Singapore does not tax outbound dividends
        } else {
          // ID paying SG holding
          if (equityHolding >= (rules.dividends.substantialParticipationMinimumHolding * 100)) {
            treatyRate = rules.dividends.substantialParticipationRate; // 10%
          } else {
            treatyRate = rules.dividends.generalPortfolioRate; // 15%
          }
        }
        break;

      case 'INTEREST':
        treatyArticle = 'Article 11 (Interest)';
        treatyRate = rules.interest.standardTreatyRate; // 10%
        break;

      case 'ROYALTIES':
        treatyArticle = 'Article 12 (Royalties)';
        if (royCat === 'EQUIPMENT') {
          treatyRate = rules.royalties.industrialCommercialScientificEquipment; // 8%
        } else {
          treatyRate = rules.royalties.patentCopyrightTrademarks; // 10%
        }
        break;

      case 'MANAGEMENT_OR_TECH_SERVICES':
        treatyArticle = 'Article 7 (Business Profits) / Article 5 (PE)';
        treatyRate = 0.0; // No tax unless Permanent Establishment (>6 months) exists
        break;
    }
  }

  const domesticTax = Math.round(gross * domesticRate * 100) / 100;
  const treatyTax = Math.round(gross * treatyRate * 100) / 100;
  const taxSavings = Math.max(0, Math.round((domesticTax - treatyTax) * 100) / 100);

  return {
    treatyName: "Singapore-Indonesia DTA",
    incomeType: iType,
    flowDirection: flow,
    hasValidResidenceDocumentation: hasCert,
    treatyArticle,
    domesticStatutoryRate: domesticRate,
    treatyRate: treatyRate,
    grossAmount: gross,
    domesticTaxPayable: domesticTax,
    treatyTaxPayable: treatyTax,
    taxSavingsBenefit: taxSavings,
    reliefStatus: hasCert && treatyRate < domesticRate ? 'TREATY_RELIEF_APPLIED' : (hasCert ? 'NO_ADDITIONAL_RELIEF' : 'DISQUALIFIED_MISSING_COR_DGT')
  };
}

module.exports = {
  evaluateDtaSgIdRelief,
  FLOW_DIRECTIONS,
  TREATY_INCOME_TYPES
};
