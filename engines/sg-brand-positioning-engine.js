/**
 * Singapore Strategic Brand Positioning & Value Proposition Engine (`engines/sg-brand-positioning-engine.js`)
 *
 * Implements deterministic brand positioning, brand equity scoring, and defensibility analysis
 * tailored for Singapore's premium reputation, regulatory trust, and regional springboard positioning:
 *   - Positioning Map coordinate placement (Perceived Premium / Price Tier vs Innovation / Customization).
 *   - Singapore Trust & Compliance Multiplier (IPOS trademark registration, Singapore Green Plan 2030 alignment, EnterpriseSG Brand Office initiative).
 *   - Value Proposition statement formulation based on target audience segments.
 *   - Competitive quadrant classification and strategic positioning defensibility.
 *
 * DOCTRINE: Pure numerical computation and deterministic scoring algorithms.
 * ZERO external dependencies. Pure Node.js.
 */

'use strict';

const SUPPORTED_SEGMENTS = [
  'REGIONAL_ENTERPRISE',
  'MASS_AFFLUENT_LOCAL',
  'SME_CORPORATE',
  'CROSS_BORDER_EXPORTER'
];

const PRICE_TIERS = [
  'PREMIUM_LUXURY',
  'MID_TIER_VALUE',
  'ECONOMY_ACCESSIBLE'
];

/**
 * Evaluates brand positioning coordinates, Singapore trust equity, and value proposition clarity.
 *
 * @param {Object} input
 * @param {string} input.brandName - Brand or company name
 * @param {string} [input.targetSegment='REGIONAL_ENTERPRISE'] - 'REGIONAL_ENTERPRISE', 'MASS_AFFLUENT_LOCAL', 'SME_CORPORATE', 'CROSS_BORDER_EXPORTER'
 * @param {string} [input.priceTier='PREMIUM_LUXURY'] - 'PREMIUM_LUXURY', 'MID_TIER_VALUE', 'ECONOMY_ACCESSIBLE'
 * @param {string[]} [input.coreDifferentiators=[]] - Array of key brand differentiator phrases
 * @param {boolean} [input.hasRegisteredIposTrademark=true] - Registered with IPOS
 * @param {boolean} [input.alignsWithGreenPlan2030=false] - Sustainability / ESG alignment
 * @param {boolean} [input.hasMadeWithPassionEndorsement=false] - Endorsed by Singapore Brand Office / EnterpriseSG
 * @returns {Object} Deterministic brand positioning metrics, trust index, and quadrant
 */
function evaluateSingaporeBrandPositioning(input = {}) {
  if (!input || typeof input !== 'object') {
    throw new Error("INVALID_INPUT: Input must be a valid configuration object");
  }

  const brand = String(input.brandName || '').trim();
  if (!brand) {
    throw new Error("INVALID_INPUT: 'brandName' must be a non-empty string");
  }

  const segment = String(input.targetSegment || 'REGIONAL_ENTERPRISE').toUpperCase().trim();
  if (!SUPPORTED_SEGMENTS.includes(segment)) {
    throw new Error(`INVALID_INPUT: 'targetSegment' must be one of [${SUPPORTED_SEGMENTS.join(', ')}] (got '${input.targetSegment}')`);
  }

  const priceTier = String(input.priceTier || 'PREMIUM_LUXURY').toUpperCase().trim();
  if (!PRICE_TIERS.includes(priceTier)) {
    throw new Error(`INVALID_INPUT: 'priceTier' must be one of [${PRICE_TIERS.join(', ')}] (got '${input.priceTier}')`);
  }

  const differentiators = Array.isArray(input.coreDifferentiators)
    ? input.coreDifferentiators.map(d => String(d).trim()).filter(d => d.length > 0)
    : [];

  const hasIp = input.hasRegisteredIposTrademark !== undefined ? Boolean(input.hasRegisteredIposTrademark) : true;
  const isGreen = Boolean(input.alignsWithGreenPlan2030);
  const isMadeWithPassion = Boolean(input.hasMadeWithPassionEndorsement);

  // 1. Positioning Map Coordinates Calculation (-10.0 to +10.0 scale)
  // X-Axis: Price / Perceived Premium (Economy = -7.0, Mid = 0.0, Premium = +8.0)
  let coordinateX = 0.0;
  if (priceTier === 'PREMIUM_LUXURY') coordinateX = 8.0;
  else if (priceTier === 'MID_TIER_VALUE') coordinateX = 1.0;
  else if (priceTier === 'ECONOMY_ACCESSIBLE') coordinateX = -7.0;

  // Y-Axis: Innovation / Differentiation Intensity (-10.0 to +10.0)
  let coordinateY = Math.min(9.0, differentiators.length * 2.5);
  if (isGreen) coordinateY += 1.5;
  if (isMadeWithPassion) coordinateY += 1.0;
  coordinateY = Number(Math.min(10.0, Math.max(-10.0, coordinateY)).toFixed(2));

  // 2. Competitive Quadrant Mapping
  let positioningQuadrant = 'COMMODITIZED_MASS_MARKET';
  if (coordinateX >= 0 && coordinateY > 0) {
    positioningQuadrant = 'PREMIUM_INNOVATOR_CATEGORY_LEADER';
  } else if (coordinateX < 0 && coordinateY > 0) {
    positioningQuadrant = 'DISRUPTIVE_HIGH_VALUE_CHALLENGER';
  } else if (coordinateX >= 0 && coordinateY <= 0) {
    positioningQuadrant = 'PREMIUM_LEGACY_STATUS_PLAYER';
  }

  // 3. Singapore Trust & Brand Equity Index (0 - 100)
  let trustIndex = 40; // Base score
  if (hasIp) trustIndex += 25; // IPOS statutory protection
  if (isMadeWithPassion) trustIndex += 20; // National brand endorsement
  if (isGreen) trustIndex += 15; // Singapore Green Plan 2030 sustainability credibility
  trustIndex = Math.min(100, trustIndex);

  // 4. Strategic Defensibility Rating
  let defensibilityTier = 'MODERATE';
  if (trustIndex >= 80 && differentiators.length >= 2) {
    defensibilityTier = 'HIGH_STRATEGIC_DEFENSIBILITY';
  } else if (trustIndex < 50 || differentiators.length === 0) {
    defensibilityTier = 'LOW_VULNERABLE_TO_REGIONAL_SUBSTITUTES';
  }

  // 5. Formulation of Singapore Strategic Value Proposition Statement
  const primaryDifferentiator = differentiators[0] || 'rekayasa kepatuhan dan keunggulan operasional berstandar Singapura';
  const targetLabel = segment.replace(/_/g, ' ').toLowerCase();
  const valuePropositionStatement = `Untuk ${targetLabel}, ${brand} menghadirkan ${primaryDifferentiator} yang didukung keandalan yurisdiksi dan reputasi tata kelola Singapura.`;

  return {
    brandName: brand,
    targetSegment: segment,
    priceTier,
    positioningCoordinates: {
      perceivedPremiumX: coordinateX,
      innovationIntensityY: coordinateY
    },
    positioningQuadrant,
    singaporeTrustEquity: {
      singaporeTrustIndex: trustIndex,
      hasRegisteredIposTrademark: hasIp,
      alignsWithGreenPlan2030: isGreen,
      hasMadeWithPassionEndorsement: isMadeWithPassion,
      defensibilityTier
    },
    valuePropositionAudit: {
      differentiatorsCount: differentiators.length,
      coreDifferentiators: differentiators,
      valuePropositionStatement
    }
  };
}

module.exports = {
  evaluateSingaporeBrandPositioning,
  SUPPORTED_SEGMENTS,
  PRICE_TIERS
};
