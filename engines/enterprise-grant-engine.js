/**
 * Singapore Enterprise Government Grant Engine (`engines/enterprise-grant-engine.js`)
 *
 * Implements deterministic eligibility verification and grant funding calculations
 * under Enterprise Singapore (EnterpriseSG) and IMDA statutory support frameworks:
 *   - Enterprise Development Grant (EDG): up to 50% (or 70% for sustainability/deep innovation)
 *   - Productivity Solutions Grant (PSG): up to 50% for pre-scoped IT solutions/equipment
 *   - Market Readiness Assistance (MRA): up to 50% capped at S$100,000 per target overseas market
 *   - Mandatory local equity check (minimum 30% local Singaporean/PR shareholding)
 *   - SME threshold verification (Group revenue <= S$100M OR Group employees <= 200)
 *
 * DOCTRINE: Pure numerical computation and statutory formula evaluation.
 * ZERO prescriptive text / ZERO subjective advice.
 * Pure Node.js, zero external dependencies.
 */

'use strict';

const SUPPORTED_GRANTS = ['EDG', 'PSG', 'MRA'];

/**
 * Evaluates grant eligibility and calculates co-funding grant amount.
 *
 * @param {Object} input
 * @param {string} input.grantScheme - 'EDG', 'PSG', 'MRA'
 * @param {number} input.qualifyingProjectCostSgd - Total qualifying project expenditure in SGD
 * @param {number} input.localShareholdingPercentage - Shareholding held by SG Citizens / PRs (0-100)
 * @param {boolean} [input.isRegisteredInSingapore=true] - Entity registered with ACRA
 * @param {number} [input.groupAnnualTurnoverSgd=1000000] - Group annual revenue in SGD
 * @param {number} [input.groupEmployeeCount=20] - Group employee headcount
 * @param {boolean} [input.isSustainabilityOrDeepTech=false] - Enhanced 70% support rate for EDG
 * @param {number} [input.mraCumulativeClaimedSgd=0] - Already claimed MRA funds for this market
 * @returns {Object} Deterministic grant co-funding analysis
 */
function evaluateEnterpriseGrant(input = {}) {
  if (!input || typeof input !== 'object') {
    throw new Error("INVALID_INPUT: Input must be a valid configuration object");
  }

  const scheme = String(input.grantScheme || '').toUpperCase().trim();
  if (!SUPPORTED_GRANTS.includes(scheme)) {
    throw new Error(`INVALID_INPUT: 'grantScheme' must be one of [${SUPPORTED_GRANTS.join(', ')}] (got '${input.grantScheme}')`);
  }

  const cost = Number(input.qualifyingProjectCostSgd);
  if (isNaN(cost) || cost <= 0 || !isFinite(cost)) {
    throw new Error(`INVALID_INPUT: 'qualifyingProjectCostSgd' must be a positive finite number (got ${input.qualifyingProjectCostSgd})`);
  }

  const localShare = Number(input.localShareholdingPercentage);
  if (isNaN(localShare) || localShare < 0 || localShare > 100) {
    throw new Error(`INVALID_INPUT: 'localShareholdingPercentage' must be between 0 and 100 (got ${input.localShareholdingPercentage})`);
  }

  const isRegisteredSg = input.isRegisteredInSingapore !== undefined ? Boolean(input.isRegisteredInSingapore) : true;
  const turnover = Number(input.groupAnnualTurnoverSgd || 0);
  const employees = Number(input.groupEmployeeCount || 0);
  const isEnhancedEdg = Boolean(input.isSustainabilityOrDeepTech);
  const mraClaimed = Number(input.mraCumulativeClaimedSgd || 0);

  // 1. Core Eligibility Checks
  const meetsLocalShare = localShare >= 30.0;
  const isSme = turnover <= 100000000 || employees <= 200;
  const isEligible = isRegisteredSg && meetsLocalShare && isSme;

  const disqualificationReasons = [];
  if (!isRegisteredSg) disqualificationReasons.push('NOT_REGISTERED_IN_SINGAPORE');
  if (!meetsLocalShare) disqualificationReasons.push('LOCAL_SHAREHOLDING_BELOW_STATUTORY_30_PERCENT_THRESHOLD');
  if (!isSme) disqualificationReasons.push('EXCEEDS_SME_TURNOVER_AND_EMPLOYEE_CAPS');

  if (!isEligible) {
    return {
      grantScheme: scheme,
      qualifyingProjectCostSgd: cost,
      isEligibleForGrant: false,
      disqualificationReasons: disqualificationReasons,
      fundingCalculation: null
    };
  }

  // 2. Grant Rate & Cap Evaluation
  let supportRate = 0.50;
  let maxGrantCapSgd = Infinity;
  let remainingCapSgd = Infinity;

  if (scheme === 'EDG') {
    supportRate = isEnhancedEdg ? 0.70 : 0.50;
    maxGrantCapSgd = Infinity; // Project-by-project approval
    remainingCapSgd = Infinity;
  } else if (scheme === 'PSG') {
    supportRate = 0.50;
    maxGrantCapSgd = 30000; // Standard annual PSG package cap
    remainingCapSgd = 30000;
  } else if (scheme === 'MRA') {
    supportRate = 0.50;
    maxGrantCapSgd = 100000;
    remainingCapSgd = Math.max(0, 100000 - mraClaimed);
  }

  const unconstrainedGrant = cost * supportRate;
  const approvedGrant = Math.min(unconstrainedGrant, remainingCapSgd);
  const companyCoPayment = cost - approvedGrant;

  return {
    grantScheme: scheme,
    qualifyingProjectCostSgd: cost,
    isEligibleForGrant: true,
    eligibilityAudit: {
      isRegisteredInSingapore: isRegisteredSg,
      localShareholdingPercent: localShare,
      isLocalShareholdingSatisfied: meetsLocalShare,
      isSmeQualified: isSme
    },
    fundingCalculation: {
      statutorySupportRatePercent: Math.round(supportRate * 100),
      schemeMaximumCapSgd: maxGrantCapSgd === Infinity ? 'NO_FIXED_STATUTORY_CAP' : maxGrantCapSgd,
      cumulativePriorClaimedSgd: scheme === 'MRA' ? mraClaimed : 0,
      availableCapHeadroomSgd: remainingCapSgd === Infinity ? 'UNLIMITED' : remainingCapSgd,
      approvedGrantFundingSgd: Math.round(approvedGrant * 100) / 100,
      companyCoPaymentShareSgd: Math.round(companyCoPayment * 100) / 100,
      effectiveSubsidyPercent: Math.round((approvedGrant / cost) * 1000) / 10
    }
  };
}

module.exports = {
  evaluateEnterpriseGrant,
  SUPPORTED_GRANTS
};
