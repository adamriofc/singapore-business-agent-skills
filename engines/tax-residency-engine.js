/**
 * Singapore Tax Residency & Certificate of Residence (CoR) Engine (`engines/tax-residency-engine.js`)
 *
 * Implements deterministic statutory assessment of corporate tax residency under
 * Section 2 of the Singapore Income Tax Act 1947 and IRAS e-Tax Guide
 * "Claiming Relief from Foreign Taxes: Certificate of Residence":
 *   - Central Management and Control (CM&C) location audit
 *   - Board of Directors (BOD) meeting locations and strategic decision locus
 *   - Local executive director presence and physical operational substance
 *   - Foreign-controlled company substantive test (bona fide business test)
 *   - Eligibility determination for IRAS Certificate of Residence (CoR)
 *
 * DOCTRINE: Pure numerical score and statutory criteria evaluation.
 * ZERO prescriptive text / ZERO subjective advice.
 * Pure Node.js, zero external dependencies.
 */

'use strict';

/**
 * Evaluates corporate tax residency and CoR eligibility under IRAS statutory rules.
 *
 * @param {Object} input
 * @param {string} input.companyName - Name of the Singapore registered company
 * @param {string} [input.uen] - Unique Entity Number (UEN)
 * @param {number} input.bodMeetingsInSingapore - Number of Board meetings held in Singapore
 * @param {number} input.totalBodMeetings - Total Board meetings held during the financial year
 * @param {boolean} [input.strategicDecisionsInSingapore=true] - Whether key strategic decisions are exercised in SG
 * @param {boolean} [input.hasLocalResidentDirector=true] - Whether company has active Singapore-resident director
 * @param {boolean} [input.hasPhysicalOfficeInSingapore=true] - Whether company maintains a physical office in SG
 * @param {number} [input.localEmployeesCount=0] - Number of local employees employed in SG
 * @param {boolean} [input.isForeignControlled=false] - Whether >= 50% shares held by foreign parent/individuals
 * @param {boolean} [input.hasBonaFideCommercialReason=true] - Commercial justification for holding/operating in SG
 * @param {string} [input.targetTreatyPartnerJurisdiction='GENERAL'] - Treaty partner country for CoR claim
 * @returns {Object} Deterministic tax residency assessment & CoR eligibility
 */
function evaluateTaxResidency(input = {}) {
  if (!input || typeof input !== 'object') {
    throw new Error("INVALID_INPUT: Input must be a valid configuration object");
  }

  const companyName = String(input.companyName || 'Singapore Corporate Entity').trim();
  const totalBod = Number(input.totalBodMeetings);
  if (isNaN(totalBod) || totalBod <= 0 || !isFinite(totalBod)) {
    throw new Error(`INVALID_INPUT: 'totalBodMeetings' must be a positive finite integer (got ${input.totalBodMeetings})`);
  }

  const sgBod = Number(input.bodMeetingsInSingapore !== undefined ? input.bodMeetingsInSingapore : 0);
  if (isNaN(sgBod) || sgBod < 0 || sgBod > totalBod) {
    throw new Error(`INVALID_INPUT: 'bodMeetingsInSingapore' must be between 0 and totalBodMeetings (${totalBod})`);
  }

  const strategicInSg = input.strategicDecisionsInSingapore !== undefined ? Boolean(input.strategicDecisionsInSingapore) : true;
  const hasLocalDir = input.hasLocalResidentDirector !== undefined ? Boolean(input.hasLocalResidentDirector) : true;
  const hasOffice = input.hasPhysicalOfficeInSingapore !== undefined ? Boolean(input.hasPhysicalOfficeInSingapore) : true;
  const localEmployees = Math.max(0, Number(input.localEmployeesCount || 0));
  const isForeignControlled = Boolean(input.isForeignControlled);
  const hasBonaFide = input.hasBonaFideCommercialReason !== undefined ? Boolean(input.hasBonaFideCommercialReason) : true;
  const targetJurisdiction = String(input.targetTreatyPartnerJurisdiction || 'GENERAL').toUpperCase().trim();

  // 1. Central Management & Control (CM&C) Analysis
  // Meeting >= 50% of BOD in Singapore is standard indicator under IRAS practice
  const bodSingaporeRatio = Math.round((sgBod / totalBod) * 100) / 100;
  const meetsBodLocationCriteria = bodSingaporeRatio >= 0.50;

  // 2. Substance Scoring (Max 100 points)
  let substanceScore = 0;
  // Factor A: BOD Meetings in Singapore (Max 35 pts)
  substanceScore += Math.min(35, Math.round(bodSingaporeRatio * 35));

  // Factor B: Strategic decisions executed in Singapore (Max 25 pts)
  if (strategicInSg) substanceScore += 25;

  // Factor C: Local resident director involved in management (Max 15 pts)
  if (hasLocalDir) substanceScore += 15;

  // Factor D: Physical presence & staff in Singapore (Max 15 pts)
  if (hasOffice) substanceScore += 10;
  if (localEmployees >= 1) substanceScore += 5;

  // Factor E: Bona fide commercial operations (Max 10 pts)
  if (hasBonaFide) substanceScore += 10;

  // 3. Foreign-Controlled Company Special Scrutiny Rule
  // If foreign-controlled, IRAS requires non-passive substance:
  // Must demonstrate reasons for setting up in SG other than tax reasons.
  let passesForeignControlledTest = true;
  if (isForeignControlled) {
    passesForeignControlledTest = hasBonaFide && (hasOffice || localEmployees >= 1) && strategicInSg;
  }

  // 4. Final Determination
  const isSingaporeTaxResident = meetsBodLocationCriteria && strategicInSg && passesForeignControlledTest;
  const qualifiesForCor = isSingaporeTaxResident && substanceScore >= 60;

  let riskLevel = 'LOW';
  if (!isSingaporeTaxResident) {
    riskLevel = 'HIGH';
  } else if (substanceScore < 75) {
    riskLevel = 'MEDIUM';
  }

  return {
    companyName,
    uen: input.uen || 'N/A',
    targetTreatyPartnerJurisdiction: targetJurisdiction,
    assessment: {
      isSingaporeTaxResident,
      qualifiesForCertificateOfResidence: qualifiesForCor,
      centralManagementAndControlLocus: isSingaporeTaxResident ? 'SINGAPORE' : 'FOREIGN_OR_NON_SG',
      substanceScore,
      riskLevel
    },
    metrics: {
      totalBodMeetings: totalBod,
      bodMeetingsInSingapore: sgBod,
      bodSingaporePercentage: Math.round(bodSingaporeRatio * 10000) / 100,
      meetsBodRatioThreshold: meetsBodLocationCriteria,
      strategicDecisionsInSingapore: strategicInSg,
      hasLocalResidentDirector: hasLocalDir,
      hasPhysicalOfficeInSingapore: hasOffice,
      localEmployeesCount: localEmployees,
      isForeignControlled,
      passesForeignControlledSubstanceTest: passesForeignControlledTest
    },
    statutoryBasis: {
      governingStatute: "Income Tax Act 1947, Section 2(1) (Definition of 'Resident')",
      regulatoryAuthority: "Inland Revenue Authority of Singapore (IRAS)",
      guidelineReference: "IRAS e-Tax Guide: Claiming Relief from Foreign Taxes - Certificate of Residence (CoR)",
      coreRule: "A company is resident in Singapore if the control and management of its business is exercised in Singapore."
    }
  };
}

module.exports = {
  evaluateTaxResidency
};
