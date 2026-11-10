/**
 * Singapore Industry Cluster & Competitive Moat Engine (`engines/competitive-intel-sg-engine.js`)
 *
 * Implements deterministic strategic competitive positioning, VRIO framework,
 * and Porter's Five Forces modeling tailored for Singapore's key economic clusters:
 *   - FinTech & Payments (MAS Payment Services Act, Capital Markets Services).
 *   - Biomedical Sciences & Healthcare (HSA Singapore statutory licensing).
 *   - Logistics & Maritime Hub (MPA, PSA port connectivity, Changi air freight).
 *   - Tech, AI & Advanced Digital Services (IMDA AI Verify, DPTM, PDPA compliance).
 *   - General Commercial & Professional Services.
 *
 * DOCTRINE: Pure numerical computation and deterministic strategic scoring.
 * ZERO external dependencies. Pure Node.js.
 */

'use strict';

const SUPPORTED_CLUSTERS = [
  'FINTECH',
  'BIOMEDICAL',
  'LOGISTICS_MARITIME',
  'TECH_AI',
  'GENERAL_COMMERCIAL'
];

/**
 * Evaluates corporate competitive moat and industry dynamics in Singapore.
 *
 * @param {Object} input
 * @param {string} input.industryCluster - 'FINTECH', 'BIOMEDICAL', 'LOGISTICS_MARITIME', 'TECH_AI', 'GENERAL_COMMERCIAL'
 * @param {boolean} [input.hasValuableAsset=true] - VRIO: Value dimension
 * @param {boolean} [input.hasRareCapability=false] - VRIO: Rarity dimension
 * @param {boolean} [input.isCostlyToImitate=false] - VRIO: Inimitability dimension
 * @param {boolean} [input.isOrganizedToCaptureValue=true] - VRIO: Organization dimension
 * @param {boolean} [input.holdsStatutoryLicense=false] - Holds MAS, HSA, IMDA or MPA statutory license
 * @param {boolean} [input.holdsRegisteredIpInIpos=false] - Holds registered patent/trademark with IPOS
 * @param {number} [input.fiveForcesScores] - Object with scores 1-5 for each force
 * @returns {Object} Deterministic competitive intelligence and moat assessment
 */
function evaluateCompetitiveMoatSg(input = {}) {
  if (!input || typeof input !== 'object') {
    throw new Error("INVALID_INPUT: Input must be a valid configuration object");
  }

  const cluster = String(input.industryCluster || 'GENERAL_COMMERCIAL').toUpperCase().trim();
  if (!SUPPORTED_CLUSTERS.includes(cluster)) {
    throw new Error(`INVALID_INPUT: 'industryCluster' must be one of [${SUPPORTED_CLUSTERS.join(', ')}] (got '${input.industryCluster}')`);
  }

  const hasValue = input.hasValuableAsset !== undefined ? Boolean(input.hasValuableAsset) : true;
  const hasRarity = Boolean(input.hasRareCapability);
  const isCostlyToImitate = Boolean(input.isCostlyToImitate);
  const isOrganized = input.isOrganizedToCaptureValue !== undefined ? Boolean(input.isOrganizedToCaptureValue) : true;
  const holdsLicense = Boolean(input.holdsStatutoryLicense);
  const holdsIp = Boolean(input.holdsRegisteredIpInIpos);

  // 1. VRIO Framework Deterministic Evaluation
  let vrioImplication = 'COMPETITIVE_DISADVANTAGE';
  let vrioScore = 20;

  if (!hasValue) {
    vrioImplication = 'COMPETITIVE_DISADVANTAGE';
    vrioScore = 20;
  } else if (!hasRarity) {
    vrioImplication = 'COMPETITIVE_PARITY';
    vrioScore = 40;
  } else if (!isCostlyToImitate) {
    vrioImplication = 'TEMPORARY_COMPETITIVE_ADVANTAGE';
    vrioScore = 65;
  } else if (!isOrganized) {
    vrioImplication = 'UNUSED_COMPETITIVE_ADVANTAGE';
    vrioScore = 75;
  } else {
    vrioImplication = 'SUSTAINED_COMPETITIVE_ADVANTAGE';
    vrioScore = 95;
  }

  // 2. Singapore Regulatory & Moat Multiplier
  let regulatoryBarrierStrength = 'MODERATE';
  let relevantRegulators = [];

  switch (cluster) {
    case 'FINTECH':
      regulatoryBarrierStrength = 'VERY_HIGH';
      relevantRegulators = ['Monetary Authority of Singapore (MAS)', 'Payment Services Act 2019'];
      if (holdsLicense) vrioScore = Math.min(100, vrioScore + 10);
      break;
    case 'BIOMEDICAL':
      regulatoryBarrierStrength = 'VERY_HIGH';
      relevantRegulators = ['Health Sciences Authority (HSA)', 'Tuas Biomedical Hub Guidelines'];
      if (holdsLicense || holdsIp) vrioScore = Math.min(100, vrioScore + 10);
      break;
    case 'LOGISTICS_MARITIME':
      regulatoryBarrierStrength = 'HIGH';
      relevantRegulators = ['Maritime and Port Authority (MPA)', 'PSA Singapore Port Operations'];
      break;
    case 'TECH_AI':
      regulatoryBarrierStrength = 'MODERATE';
      relevantRegulators = ['Infocomm Media Development Authority (IMDA)', 'PDPC', 'AI Verify'];
      if (holdsIp) vrioScore = Math.min(100, vrioScore + 5);
      break;
    default:
      regulatoryBarrierStrength = 'LOW_TO_MODERATE';
      relevantRegulators = ['ACRA', 'Enterprise Singapore'];
      break;
  }

  // 3. Five Forces Deterministic Weighting (Default 1-5 where 5 = highest threat to profitability)
  const defaultForces = {
    threatOfNewEntrants: cluster === 'FINTECH' || cluster === 'BIOMEDICAL' ? 2 : 4,
    threatOfSubstitutes: 3,
    buyerPower: 3,
    supplierPower: 2,
    competitiveRivalry: 4
  };

  const forcesInput = input.fiveForcesScores && typeof input.fiveForcesScores === 'object'
    ? input.fiveForcesScores
    : {};

  const cleanForces = {
    threatOfNewEntrants: Math.max(1, Math.min(5, Number(forcesInput.threatOfNewEntrants) || defaultForces.threatOfNewEntrants)),
    threatOfSubstitutes: Math.max(1, Math.min(5, Number(forcesInput.threatOfSubstitutes) || defaultForces.threatOfSubstitutes)),
    buyerPower: Math.max(1, Math.min(5, Number(forcesInput.buyerPower) || defaultForces.buyerPower)),
    supplierPower: Math.max(1, Math.min(5, Number(forcesInput.supplierPower) || defaultForces.supplierPower)),
    competitiveRivalry: Math.max(1, Math.min(5, Number(forcesInput.competitiveRivalry) || defaultForces.competitiveRivalry))
  };

  const totalForcePoints = Object.values(cleanForces).reduce((acc, v) => acc + v, 0);
  const averageForceIntensity = Number((totalForcePoints / 5).toFixed(2));

  let industryAttractiveness = 'ATTRACTIVE';
  if (averageForceIntensity >= 3.8) {
    industryAttractiveness = 'HIGHLY_COMPETITIVE_MARGIN_PRESSURE';
  } else if (averageForceIntensity >= 3.0) {
    industryAttractiveness = 'MODERATELY_ATTRACTIVE';
  }

  return {
    industryCluster: cluster,
    vrioAudit: {
      isValuable: hasValue,
      isRare: hasRarity,
      isCostlyToImitate,
      isOrganized,
      competitiveImplication: vrioImplication,
      vrioMoatScore: vrioScore
    },
    clusterRegulatoryContext: {
      regulatoryBarrierStrength,
      relevantRegulators,
      holdsStatutoryLicense: holdsLicense,
      holdsRegisteredIpInIpos: holdsIp
    },
    fiveForcesAudit: {
      forcesIntensity: cleanForces,
      averageForceIntensity,
      industryAttractiveness
    },
    strategicMoatVerdict: vrioScore >= 75 ? 'ROBUST_SINGAPORE_MOAT' : 'VULNERABLE_TO_REGIONAL_COMPETITION'
  };
}

module.exports = {
  evaluateCompetitiveMoatSg,
  SUPPORTED_CLUSTERS
};
