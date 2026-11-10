/**
 * Singapore Enterprise B2B Lead Scoring & ICP Engine (`engines/sg-lead-qualification-engine.js`)
 *
 * Implements deterministic lead qualification and ICP scoring based on Singapore statutory
 * corporate indicators (ACRA paid-up capital, IRAS GST registration, SSIC sector) and BANT criteria:
 *   - Paid-Up Capital Tiers (ACRA verified capital solvency signal).
 *   - IRAS GST Registered Status (statutory indicator of > S$1M annual revenue).
 *   - SSIC Industry Priority Weighting (Singapore Standard Industrial Classification).
 *   - Buying Committee Decision-Maker Seniority & Budget Confirmation.
 *
 * DOCTRINE: Pure numerical computation and deterministic scoring algorithms.
 * ZERO external dependencies. Pure Node.js.
 */

'use strict';

const SUPPORTED_SENIORITIES = ['C_SUITE', 'VP_DIRECTOR', 'MANAGER', 'INDIVIDUAL_CONTRIBUTOR'];

const HIGH_PRIORITY_SSIC_CLUSTERS = [
  'FINANCIAL_SERVICES',
  'INFOCOMM_TECH',
  'PROFESSIONAL_SERVICES',
  'BIOMEDICAL_HEALTHCARE',
  'LOGISTICS_SUPPLY_CHAIN'
];

/**
 * Scores and tiers a B2B sales lead operating in Singapore.
 *
 * @param {Object} input
 * @param {number} [input.companyPaidUpCapitalSgd=100000] - ACRA registered paid-up capital in SGD
 * @param {boolean} [input.isGstRegisteredInIras=true] - Statutory GST registration status
 * @param {number} [input.employeeHeadcount=25] - Estimated company employee count in Singapore
 * @param {string} [input.ssicSector='INFOCOMM_TECH'] - Industry classification code
 * @param {string} [input.decisionMakerSeniority='VP_DIRECTOR'] - 'C_SUITE', 'VP_DIRECTOR', 'MANAGER', 'INDIVIDUAL_CONTRIBUTOR'
 * @param {boolean} [input.isBudgetConfirmed=false] - BANT: Budget confirmed
 * @param {number} [input.timelineUrgencyMonths=3] - BANT: Purchasing timeline in months
 * @returns {Object} Deterministic lead score, ICP fit rating, and recommended sales motion
 */
function scoreSingaporeB2bLead(input = {}) {
  if (!input || typeof input !== 'object') {
    throw new Error("INVALID_INPUT: Input must be a valid configuration object");
  }

  const capital = Math.max(0, Number(input.companyPaidUpCapitalSgd) || 0);
  const isGst = input.isGstRegisteredInIras !== undefined ? Boolean(input.isGstRegisteredInIras) : true;
  const employees = Math.max(1, Math.floor(Number(input.employeeHeadcount) || 1));
  const sector = String(input.ssicSector || 'INFOCOMM_TECH').toUpperCase().trim();
  const seniority = String(input.decisionMakerSeniority || 'VP_DIRECTOR').toUpperCase().trim();
  const hasBudget = Boolean(input.isBudgetConfirmed);
  const timeline = Math.max(1, Math.floor(Number(input.timelineUrgencyMonths) || 3));

  let score = 0;
  const scoringBreakdown = {};

  // 1. Paid-Up Capital Score (ACRA data indicates enterprise financial substance)
  let capitalPoints = 5;
  if (capital >= 1000000) capitalPoints = 25; // S$1M+ paid up capital
  else if (capital >= 250000) capitalPoints = 20;
  else if (capital >= 50000) capitalPoints = 15;
  else if (capital >= 10000) capitalPoints = 10;
  score += capitalPoints;
  scoringBreakdown.paidUpCapitalPoints = capitalPoints;

  // 2. IRAS GST Registration (Statutory threshold > S$1M turnover)
  const gstPoints = isGst ? 15 : 0;
  score += gstPoints;
  scoringBreakdown.gstRegisteredPoints = gstPoints;

  // 3. Headcount Scaling
  let headcountPoints = 5;
  if (employees >= 200) headcountPoints = 20;
  else if (employees >= 50) headcountPoints = 15;
  else if (employees >= 15) headcountPoints = 10;
  score += headcountPoints;
  scoringBreakdown.headcountPoints = headcountPoints;

  // 4. SSIC Industry Fit
  const isHighPrioritySector = HIGH_PRIORITY_SSIC_CLUSTERS.includes(sector);
  const sectorPoints = isHighPrioritySector ? 15 : 8;
  score += sectorPoints;
  scoringBreakdown.sectorPoints = sectorPoints;

  // 5. Seniority of Contact
  let seniorityPoints = 5;
  if (seniority === 'C_SUITE') seniorityPoints = 15;
  else if (seniority === 'VP_DIRECTOR') seniorityPoints = 12;
  else if (seniority === 'MANAGER') seniorityPoints = 8;
  score += seniorityPoints;
  scoringBreakdown.seniorityPoints = seniorityPoints;

  // 6. BANT Confirmation
  let bantPoints = 0;
  if (hasBudget) bantPoints += 5;
  if (timeline <= 3) bantPoints += 5;
  score += bantPoints;
  scoringBreakdown.bantPoints = bantPoints;

  const finalScore = Math.min(100, score);

  let leadTier = 'TIER_3_QUALIFIED_SME';
  let recommendedSalesMotion = 'AUTOMATED_EMAIL_NURTURE_AND_WEBINAR';

  if (finalScore >= 80) {
    leadTier = 'TIER_1_ENTERPRISE_PRIORITY';
    recommendedSalesMotion = 'SENIOR_ACCOUNT_EXECUTIVE_OUTBOUND_AND_CUSTOM_POC';
  } else if (finalScore >= 60) {
    leadTier = 'TIER_2_MID_MARKET';
    recommendedSalesMotion = 'INSIDE_SALES_DISCOVERY_CALL_AND_STANDARD_DEMO';
  } else if (finalScore < 40) {
    leadTier = 'UNQUALIFIED_LOW_INTENT';
    recommendedSalesMotion = 'MARKETING_AUTOMATION_CONTENT_TRACKING';
  }

  return {
    leadScore: finalScore,
    leadTier,
    isIcpQualified: finalScore >= 60,
    scoringBreakdown,
    companyProfileEvaluated: {
      acraPaidUpCapitalSgd: capital,
      isGstRegisteredInIras: isGst,
      employeeCount: employees,
      ssicSector: sector,
      isHighPriorityCluster: isHighPrioritySector
    },
    buyingCommitteeEvaluation: {
      seniority,
      budgetConfirmed: hasBudget,
      urgencyTimelineMonths: timeline
    },
    recommendedSalesMotion
  };
}

module.exports = {
  scoreSingaporeB2bLead,
  SUPPORTED_SENIORITIES,
  HIGH_PRIORITY_SSIC_CLUSTERS
};
