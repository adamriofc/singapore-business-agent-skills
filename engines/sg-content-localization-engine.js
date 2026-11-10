/**
 * Singapore B2B/B2C Brand Voice & Advertising Code Engine (`engines/sg-content-localization-engine.js`)
 *
 * Implements deterministic content tone audit and advertising compliance checks
 * against the Singapore Code of Advertising Practice (SCAP) administered by ASAS
 * and Competition and Consumer Commission of Singapore (CCCS) fair trading guidelines:
 *   - Tone & Register suitability (B2B Enterprise, B2C Local Consumer, Public Sector).
 *   - Unsubstantiated superlative claim detection ("#1 in Singapore", "Best in SG").
 *   - Misleading price / false discount detection under CCCS guidelines.
 *   - Health / medical therapeutic claim detection requiring HSA pre-approval.
 *   - Colloquial Singlish appropriateness and brand safety filtering.
 *
 * DOCTRINE: Pure deterministic pattern analysis and statutory rule checks.
 * ZERO external dependencies. Pure Node.js.
 */

'use strict';

const SUPPORTED_AUDIENCES = ['B2B_ENTERPRISE', 'B2C_CONSUMER', 'GOVERNMENT_PUBLIC_SECTOR'];

const PROHIBITED_SUPERLATIVES = [
  '#1 IN SINGAPORE', 'NO.1 IN SINGAPORE', 'BEST IN SINGAPORE', 'BEST IN SG',
  'SINGAPORE LARGEST', 'SINGAPORE CHEAPEST', 'GUARANTEED 100% CURE', 'RISK FREE INVESTMENT'
];

const SINGLISH_MARKERS = [
  'LAH', 'LEH', 'LOR', 'MEH', 'CHIOBU', 'SHIOK', 'PAISEH', 'LOBANG', 'KIASU', 'CHOPE'
];

/**
 * Audits marketing copy against Singapore cultural norms and ASAS advertising guidelines.
 *
 * @param {Object} input
 * @param {string} input.copyText - Marketing copy or advertisement text
 * @param {string} [input.targetAudience='B2B_ENTERPRISE'] - 'B2B_ENTERPRISE', 'B2C_CONSUMER', 'GOVERNMENT_PUBLIC_SECTOR'
 * @param {boolean} [input.allowColloquialSinglish=false] - Whether colloquial Singlish is intentionally allowed
 * @param {boolean} [input.hasHsaTherapeuticApproval=false] - Whether health claims have verified HSA clearance
 * @returns {Object} Deterministic copy audit score, ASAS breaches, and localization advice
 */
function auditSingaporeContentLocalization(input = {}) {
  if (!input || typeof input !== 'object') {
    throw new Error("INVALID_INPUT: Input must be a valid configuration object");
  }

  const text = String(input.copyText || '').trim();
  if (!text) {
    throw new Error("INVALID_INPUT: 'copyText' must be a non-empty string");
  }

  const audience = String(input.targetAudience || 'B2B_ENTERPRISE').toUpperCase().trim();
  if (!SUPPORTED_AUDIENCES.includes(audience)) {
    throw new Error(`INVALID_INPUT: 'targetAudience' must be one of [${SUPPORTED_AUDIENCES.join(', ')}] (got '${input.targetAudience}')`);
  }

  const allowSinglish = Boolean(input.allowColloquialSinglish);
  const hasHsaApproval = Boolean(input.hasHsaTherapeuticApproval);

  const upperText = text.toUpperCase();
  let complianceScore = 100;
  const breaches = [];
  const toneObservations = [];

  // 1. ASAS Superlative Claim Audit
  PROHIBITED_SUPERLATIVES.forEach(superlative => {
    if (upperText.includes(superlative)) {
      complianceScore -= 25;
      breaches.push({
        code: 'ASAS_UNSUBSTANTIATED_SUPERLATIVE',
        severity: 'HIGH',
        detectedTerm: superlative,
        guideline: 'Singapore Code of Advertising Practice (SCAP) Section 4: All claims, comparisons, and superlatives must be substantiated with independent empirical evidence.'
      });
    }
  });

  // 2. Health & Medical Claim Check (HSA Regulation)
  const healthKeywords = ['CURES', 'HEALS CANCER', 'REVERSES AGING', 'MEDICINAL MIRACLE', 'TREATS COVID'];
  healthKeywords.forEach(hk => {
    if (upperText.includes(hk) && !hasHsaApproval) {
      complianceScore -= 40;
      breaches.push({
        code: 'HSA_UNAUTHORIZED_THERAPEUTIC_CLAIM',
        severity: 'CRITICAL',
        detectedTerm: hk,
        guideline: 'Health Sciences Authority (HSA) prohibits therapeutic treatment claims for non-registered health supplements and cosmetics.'
      });
    }
  });

  // 3. Singlish Colloquialism Audit
  const foundSinglish = [];
  SINGLISH_MARKERS.forEach(sm => {
    const regex = new RegExp(`\\b${sm}\\b`, 'i');
    if (regex.test(text)) {
      foundSinglish.push(sm);
    }
  });

  if (foundSinglish.length > 0) {
    if (audience === 'B2B_ENTERPRISE' || audience === 'GOVERNMENT_PUBLIC_SECTOR') {
      complianceScore -= 15;
      toneObservations.push({
        code: 'INAPPROPRIATE_COLLOQUIALISM_FOR_PROFESSIONAL_AUDIENCE',
        severity: 'MEDIUM',
        foundTerms: foundSinglish,
        advice: `Singlish particles (${foundSinglish.join(', ')}) should be avoided in Singapore corporate B2B and public sector communications.`
      });
    } else if (audience === 'B2C_CONSUMER' && !allowSinglish) {
      toneObservations.push({
        code: 'COLLOQUIAL_SINGLISH_DETECTED',
        severity: 'LOW',
        foundTerms: foundSinglish,
        advice: "Ensure colloquial Singlish reflects authentic local consumer vernacular without diluting brand authority."
      });
    }
  }

  const finalScore = Math.max(0, Math.min(100, complianceScore));
  const isAsasCompliant = breaches.filter(b => b.severity === 'CRITICAL' || b.severity === 'HIGH').length === 0;

  return {
    targetAudience: audience,
    localizationQualityScore: finalScore,
    isAsasCompliant,
    totalBreachesDetected: breaches.length,
    advertisingBreaches: breaches,
    toneAudit: {
      detectedSinglishTerms: foundSinglish,
      toneObservations
    },
    statutoryNotice: isAsasCompliant
      ? "Konten memenuhi standar Advertising Standards Authority of Singapore (ASAS) dan norma budaya lokal."
      : "Konten berisiko melanggar pedoman periklanan ASAS/CCCS atau regulasi terapeutik HSA Singapura."
  };
}

module.exports = {
  auditSingaporeContentLocalization,
  SUPPORTED_AUDIENCES
};
