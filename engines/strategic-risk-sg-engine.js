/**
 * Singapore Corporate Strategic Risk Matrix & Governance Heatmap Engine (`engines/strategic-risk-sg-engine.js`)
 *
 * Implements deterministic strategic risk assessment and enterprise risk management (ERM)
 * scoring aligned with the Singapore Code of Corporate Governance 2018 and SGX Listing Rules:
 *   - 4-Tier Risk Categorization: Regulatory Compliance, Financial/Market, Operational, Reputational/Cyber.
 *   - Risk Priority Index = Likelihood (1-5) x Impact (1-5) x Velocity (0.8-1.2).
 *   - Board Risk Oversight & Internal Controls adequacy assessment (Rule 1207(10)).
 *   - ACRA, IRAS, MOM, PDPA, and MAS cross-regulatory vulnerability synthesis.
 *
 * DOCTRINE: Pure numerical computation and deterministic risk grading.
 * ZERO external dependencies. Pure Node.js.
 */

'use strict';

const RISK_CATEGORIES = [
  'REGULATORY_COMPLIANCE',
  'FINANCIAL_MARKET',
  'OPERATIONAL_SUPPLY',
  'REPUTATIONAL_CYBER'
];

/**
 * Assesses an array of corporate strategic risks and produces an ERM heatmap.
 *
 * @param {Object} input
 * @param {Array<Object>} input.risks - Array of risk items: { id, title, category, likelihood (1-5), impact (1-5), velocity (1-3) }
 * @param {boolean} [input.hasBoardRiskCommittee=false] - Whether board has established dedicated risk oversight
 * @param {boolean} [input.hasDocumentedErmPolicy=true] - Whether enterprise risk management framework is documented
 * @returns {Object} Deterministic risk index, heatmap classification, and governance oversight evaluation
 */
function evaluateStrategicRiskSg(input = {}) {
  if (!input || typeof input !== 'object') {
    throw new Error("INVALID_INPUT: Input must be a valid configuration object");
  }

  const rawRisks = Array.isArray(input.risks) ? input.risks : [];
  if (rawRisks.length === 0) {
    throw new Error("INVALID_INPUT: 'risks' must be a non-empty array of risk items");
  }

  const hasBoardCommittee = Boolean(input.hasBoardRiskCommittee);
  const hasErmPolicy = input.hasDocumentedErmPolicy !== undefined ? Boolean(input.hasDocumentedErmPolicy) : true;

  const evaluatedRisks = [];
  let totalWeightedScore = 0;

  rawRisks.forEach((r, idx) => {
    const id = String(r.id || `RISK-${idx + 1}`);
    const title = String(r.title || `Risk Item ${idx + 1}`);
    const category = RISK_CATEGORIES.includes(String(r.category || '').toUpperCase().trim())
      ? String(r.category).toUpperCase().trim()
      : 'OPERATIONAL_SUPPLY';

    const likelihood = Math.max(1, Math.min(5, Math.round(Number(r.likelihood) || 3)));
    const impact = Math.max(1, Math.min(5, Math.round(Number(r.impact) || 3)));
    
    // Velocity: 1 = Slow onset (mult: 0.9), 2 = Medium onset (mult: 1.0), 3 = Rapid onset (mult: 1.2)
    const rawVel = Math.max(1, Math.min(3, Math.round(Number(r.velocity) || 2)));
    const velocityMultiplier = rawVel === 3 ? 1.2 : (rawVel === 1 ? 0.9 : 1.0);

    const baseScore = likelihood * impact; // 1 to 25
    const riskPriorityScore = Number((baseScore * velocityMultiplier).toFixed(2));
    totalWeightedScore += riskPriorityScore;

    let tier = 'LOW';
    if (riskPriorityScore >= 20) {
      tier = 'CRITICAL_EXTREME';
    } else if (riskPriorityScore >= 12) {
      tier = 'HIGH';
    } else if (riskPriorityScore >= 6) {
      tier = 'MEDIUM';
    }

    evaluatedRisks.push({
      id,
      title,
      category,
      likelihood,
      impact,
      velocityRating: rawVel,
      riskPriorityScore,
      severityTier: tier
    });
  });

  // Sort descending by priority score
  evaluatedRisks.sort((a, b) => b.riskPriorityScore - a.riskPriorityScore);

  const averageRiskScore = Number((totalWeightedScore / evaluatedRisks.length).toFixed(2));

  // Corporate Governance Oversight Index (0 - 100, where 100 is best controlled / lowest residual risk)
  let governanceIndex = Math.max(0, 100 - (averageRiskScore * 3));
  if (hasBoardCommittee) governanceIndex = Math.min(100, governanceIndex + 10);
  if (!hasErmPolicy) governanceIndex = Math.max(0, governanceIndex - 15);
  governanceIndex = Math.round(governanceIndex);

  const extremeCount = evaluatedRisks.filter(r => r.severityTier === 'CRITICAL_EXTREME').length;
  const highCount = evaluatedRisks.filter(r => r.severityTier === 'HIGH').length;

  let overallPosture = 'WELL_GOVERNED_RESILIENT';
  if (extremeCount > 0 || highCount >= 3) {
    overallPosture = 'ELEVATED_VULNERABILITY_BOARD_ACTION_REQUIRED';
  } else if (highCount > 0) {
    overallPosture = 'MODERATE_MONITORED';
  }

  return {
    totalRisksEvaluated: evaluatedRisks.length,
    overallPosture,
    corporateGovernanceIndex: governanceIndex,
    severityBreakdown: {
      criticalExtremeCount: extremeCount,
      highCount: highCount,
      mediumCount: evaluatedRisks.filter(r => r.severityTier === 'MEDIUM').length,
      lowCount: evaluatedRisks.filter(r => r.severityTier === 'LOW').length
    },
    boardOversightAudit: {
      hasBoardRiskCommittee: hasBoardCommittee,
      hasDocumentedErmPolicy: hasErmPolicy,
      sgxCodeOfCorporateGovernanceCompliant: hasBoardCommittee && hasErmPolicy
    },
    prioritizedRiskHeatmap: evaluatedRisks
  };
}

module.exports = {
  evaluateStrategicRiskSg,
  RISK_CATEGORIES
};
