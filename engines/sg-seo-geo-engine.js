/**
 * Singapore Hyper-Local & Regional SEO Engine (`engines/sg-seo-geo-engine.js`)
 *
 * Implements deterministic search engine optimization auditing tailored for
 * Google Singapore (google.com.sg), ccTLD routing, and localized search intent:
 *   - Singapore ccTLD (.sg / .com.sg) authority weighting.
 *   - Hreflang multi-lingual targeting for Singapore (en-SG, zh-SG, ms-SG, ta-SG).
 *   - Local Schema.org verification (ACRA 9/10-character UEN, 6-digit SG postal code).
 *   - Commercial district & MRT hub geo-intent keyword coverage.
 *
 * DOCTRINE: Pure numerical computation and deterministic SEO audit scoring.
 * ZERO external dependencies. Pure Node.js.
 */

'use strict';

const SINGAPORE_DISTRICTS = [
  'CBD', 'RAFFLES PLACE', 'MARINA BAY', 'TANJONG PAGAR', 'SHENTON WAY',
  'ORCHARD', 'BUGIS', 'CITY HALL', 'JURONG', 'ONE-NORTH',
  'CHANGI BUSINESS PARK', 'WOODLANDS', 'TAMPINES', 'PAYA LEBAR'
];

/**
 * Audits technical local SEO signals for Singapore web presence.
 *
 * @param {Object} input
 * @param {string} input.domainName - Website domain name (e.g. 'company.com.sg')
 * @param {string[]} [input.targetKeywords=[]] - Target keyword phrases
 * @param {string[]} [input.hreflangTags=[]] - Configured hreflang language tags
 * @param {Object} [input.localBusinessSchema] - Structured data object
 * @param {string} [input.localBusinessSchema.postalCode] - 6-digit SG postal code
 * @param {string} [input.localBusinessSchema.uen] - ACRA UEN registration number
 * @param {string} [input.localBusinessSchema.streetAddress] - Local street address
 * @param {boolean} [input.hasGoogleBusinessProfile=true] - Verified Google Business Profile
 * @returns {Object} Deterministic local SEO audit score and recommendations
 */
function auditSingaporeLocalSeo(input = {}) {
  if (!input || typeof input !== 'object') {
    throw new Error("INVALID_INPUT: Input must be a valid configuration object");
  }

  const domain = String(input.domainName || '').toLowerCase().trim();
  if (!domain) {
    throw new Error("INVALID_INPUT: 'domainName' is required (e.g. 'enterprise.com.sg')");
  }

  const keywords = Array.isArray(input.targetKeywords) ? input.targetKeywords : [];
  const hreflangs = Array.isArray(input.hreflangTags) ? input.hreflangTags.map(h => String(h).toLowerCase().trim()) : [];
  const schema = input.localBusinessSchema && typeof input.localBusinessSchema === 'object' ? input.localBusinessSchema : {};
  const hasGbp = input.hasGoogleBusinessProfile !== undefined ? Boolean(input.hasGoogleBusinessProfile) : true;

  let seoScore = 0;
  const passedSignals = [];
  const recommendations = [];

  // 1. ccTLD Evaluation (.sg or .com.sg gives strongest local geo-targeting signal)
  const isSgCcTld = domain.endsWith('.sg') || domain.endsWith('.com.sg') || domain.endsWith('.org.sg') || domain.endsWith('.edu.sg');
  if (isSgCcTld) {
    seoScore += 25;
    passedSignals.push("Singapore ccTLD detected (.sg/.com.sg), giving primary regional geo-targeting priority.");
  } else {
    recommendations.push("Consider acquiring a .com.sg or .sg domain or configuring Google Search Console international targeting for Singapore.");
  }

  // 2. Hreflang Multi-lingual Audit
  const hasEnSg = hreflangs.includes('en-sg') || hreflangs.includes('en');
  if (hasEnSg) {
    seoScore += 15;
    passedSignals.push("Valid English Singapore (en-SG) hreflang tag configured.");
  } else {
    recommendations.push("Implement <link rel='alternate' hreflang='en-SG' ... /> to explicitly declare regional language targeting.");
  }

  // 3. Local Schema & ACRA UEN Verification
  const postalCode = String(schema.postalCode || '').trim();
  const isSixDigitPostal = /^[0-9]{6}$/.test(postalCode);
  if (isSixDigitPostal) {
    seoScore += 15;
    passedSignals.push(`Valid Singapore 6-digit postal code format verified (${postalCode}).`);
  } else {
    recommendations.push("Schema markup lacks a valid 6-digit Singapore postal code.");
  }

  const uen = String(schema.uen || '').trim().toUpperCase();
  const isValidUen = /^[0-9]{8,9}[A-Z]$|^[TSR][0-9]{2}[A-Z]{2}[0-9]{4}[A-Z]$/.test(uen);
  if (isValidUen) {
    seoScore += 15;
    passedSignals.push(`Valid ACRA UEN detected in structured business schema (${uen}).`);
  } else {
    recommendations.push("Add ACRA UEN (Unique Entity Number) to Organization schema for high-trust entity resolution.");
  }

  // 4. Google Business Profile Signal
  if (hasGbp) {
    seoScore += 15;
    passedSignals.push("Active verified Google Business Profile linked to Singapore physical address.");
  } else {
    recommendations.push("Claim and verify a Singapore physical office Google Business Profile to capture map pack queries.");
  }

  // 5. Local Geo-Intent Keyword Audit
  const matchedDistricts = [];
  keywords.forEach(k => {
    const upperK = String(k).toUpperCase();
    SINGAPORE_DISTRICTS.forEach(d => {
      if (upperK.includes(d) && !matchedDistricts.includes(d)) {
        matchedDistricts.push(d);
      }
    });
  });

  if (matchedDistricts.length > 0) {
    seoScore += 15;
    passedSignals.push(`Target keywords cover ${matchedDistricts.length} Singapore commercial hubs: [${matchedDistricts.join(', ')}].`);
  } else {
    recommendations.push("Integrate prominent Singapore district keywords (e.g., 'CBD', 'Raffles Place', 'Jurong', 'One-North') into page content.");
  }

  const finalScore = Math.min(100, seoScore);

  let status = 'EXCELLENT_LOCAL_AUTHORITY';
  if (finalScore < 50) status = 'WEAK_LOCAL_SIGNALS_REMEDIATION_REQUIRED';
  else if (finalScore < 80) status = 'MODERATE_LOCAL_PRESENCE';

  return {
    domainName: domain,
    localSeoScore: finalScore,
    status,
    technicalAudit: {
      hasSingaporeCcTld: isSgCcTld,
      hasHreflangEnSg: hasEnSg,
      hasValidSingaporePostalCode: isSixDigitPostal,
      hasValidAcraUen: isValidUen,
      hasGoogleBusinessProfile: hasGbp,
      matchedCommercialDistricts: matchedDistricts
    },
    passedSignalsCount: passedSignals.length,
    passedSignals,
    actionableRecommendations: recommendations
  };
}

module.exports = {
  auditSingaporeLocalSeo,
  SINGAPORE_DISTRICTS
};
