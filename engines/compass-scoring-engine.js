/**
 * Singapore Ministry of Manpower (MOM) COMPASS Scoring Engine (`engines/compass-scoring-engine.js`)
 *
 * Implements deterministic scoring under the Complementarity Assessment Framework (COMPASS)
 * for Employment Pass (EP) candidates per Employment of Foreign Manpower Act:
 *   - Minimum qualifying salary baseline check (age-scaled, non-financial vs financial sector)
 *   - Exemption criteria evaluation (e.g. fixed salary >= S$22,500/mo, ICT)
 *   - C1: Salary relative to local PMET norms (0, 10, 20 pts)
 *   - C2: Qualifications (Top-tier institution = 20, Degree-equivalent = 10, No degree = 0)
 *   - C3: Diversity (% of firm PMETs of same nationality, small firm default = 10 pts)
 *   - C4: Support for Local Employment (local PMET share vs sector, small firm default = 10 pts)
 *   - C5 (Bonus): Skills Shortage (Shortage Occupation List - SOL, 0, 10, 20 pts)
 *   - C6 (Bonus): Strategic Economic Priorities (SEP, 0 or 10 pts)
 *   - Pass Mark: >= 40 points
 *
 * DOCTRINE: Pure numerical computation and statutory formula evaluation.
 * ZERO prescriptive text / ZERO subjective advice.
 * Pure Node.js, zero external dependencies.
 */

'use strict';

const fs = require('fs');
const path = require('path');

let COMPASS_RULES = null;
function getRules() {
  if (!COMPASS_RULES) {
    const rulesPath = path.join(__dirname, 'rules/compass-rules.json');
    if (fs.existsSync(rulesPath)) {
      COMPASS_RULES = JSON.parse(fs.readFileSync(rulesPath, 'utf8'));
    } else {
      COMPASS_RULES = {
        passMark: 40,
        minimumQualifyingSalary: {
          nonFinancialServices: { baseAge23AndBelow: 5000, progressiveIncreasePerYear: 250, maxAtAge45AndAbove: 10500 },
          financialServices: { baseAge23AndBelow: 5500, progressiveIncreasePerYear: 275, maxAtAge45AndAbove: 11500 }
        }
      };
    }
  }
  return COMPASS_RULES;
}

const SECTOR_TYPES = ['NON_FINANCIAL_SERVICES', 'FINANCIAL_SERVICES'];
const QUALIFICATION_LEVELS = ['TOP_TIER', 'DEGREE_EQUIVALENT', 'NO_DEGREE'];

/**
 * Calculates the statutory minimum qualifying salary for an EP applicant based on age and sector.
 *
 * @param {number} age - Applicant age
 * @param {string} sector - 'NON_FINANCIAL_SERVICES' or 'FINANCIAL_SERVICES'
 * @returns {number} Minimum qualifying salary in SGD
 */
function getMinimumQualifyingSalary(age, sector = 'NON_FINANCIAL_SERVICES') {
  const rules = getRules().minimumQualifyingSalary;
  const isFinance = sector === 'FINANCIAL_SERVICES';
  const cfg = isFinance ? rules.financialServices : rules.nonFinancialServices;

  if (age <= 23) {
    return cfg.baseAge23AndBelow;
  }
  if (age >= 45) {
    return cfg.maxAtAge45AndAbove;
  }
  const yearsAbove23 = age - 23;
  const calculated = cfg.baseAge23AndBelow + (yearsAbove23 * cfg.progressiveIncreasePerYear);
  return Math.min(cfg.maxAtAge45AndAbove, calculated);
}

/**
 * Evaluates COMPASS points and overall Employment Pass eligibility.
 *
 * @param {Object} input
 * @param {number} input.monthlySalarySgd - Proposed fixed monthly salary in SGD
 * @param {number} input.candidateAge - Age in years
 * @param {string} [input.sector='NON_FINANCIAL_SERVICES'] - Sector category
 * @param {boolean} [input.isIntraCorporateTransferee=false] - ICT status
 * @param {string} [input.salaryPercentileRank='P65_TO_P89'] - 'P90_AND_ABOVE', 'P65_TO_P89', 'BELOW_P65'
 * @param {string} [input.qualificationLevel='DEGREE_EQUIVALENT'] - 'TOP_TIER', 'DEGREE_EQUIVALENT', 'NO_DEGREE'
 * @param {number} [input.firmPmetCount=50] - Total PMET headcount in firm
 * @param {number} [input.candidateNationalityPmetPercentage=15] - % of firm PMETs from candidate's nationality
 * @param {string} [input.firmLocalSharePercentile='BETWEEN_P20_AND_P50'] - 'ABOVE_P50', 'BETWEEN_P20_AND_P50', 'BELOW_P20'
 * @param {boolean} [input.isOnShortageOccupationList=false] - Whether role is on MOM SOL list
 * @param {boolean} [input.hasStrategicEconomicPriority=false] - Recognized by agency for SEP bonus
 * @returns {Object} Comprehensive COMPASS score and eligibility determination
 */
function evaluateCompassEpEligibility(input = {}) {
  if (!input || typeof input !== 'object') {
    throw new Error("INVALID_INPUT: Input must be a valid configuration object");
  }

  const salary = Number(input.monthlySalarySgd);
  if (isNaN(salary) || salary < 0 || !isFinite(salary)) {
    throw new Error(`INVALID_INPUT: 'monthlySalarySgd' must be a non-negative finite number (got ${input.monthlySalarySgd})`);
  }

  const age = Number(input.candidateAge);
  if (isNaN(age) || age < 18 || age > 100 || !isFinite(age)) {
    throw new Error(`INVALID_INPUT: 'candidateAge' must be between 18 and 100 (got ${input.candidateAge})`);
  }

  const sector = String(input.sector || 'NON_FINANCIAL_SERVICES').toUpperCase().trim();
  if (!SECTOR_TYPES.includes(sector)) {
    throw new Error(`INVALID_INPUT: 'sector' must be one of [${SECTOR_TYPES.join(', ')}] (got '${input.sector}')`);
  }

  const isIct = Boolean(input.isIntraCorporateTransferee);

  // 1. Check COMPASS Exemption
  if (salary >= 22500) {
    return {
      isExemptFromCompass: true,
      exemptionReason: 'HIGH_SALARY_EXEMPTION_ABOVE_22500_SGD',
      meetsMinimumQualifyingSalary: true,
      totalCompassScore: 0,
      compassPassThreshold: 40,
      isPassMarkMet: true,
      eligibilityVerdict: 'ELIGIBLE_FOR_EP_VIA_EXEMPTION'
    };
  }
  if (isIct) {
    return {
      isExemptFromCompass: true,
      exemptionReason: 'INTRA_CORPORATE_TRANSFEREE_EXEMPTION',
      meetsMinimumQualifyingSalary: true,
      totalCompassScore: 0,
      compassPassThreshold: 40,
      isPassMarkMet: true,
      eligibilityVerdict: 'ELIGIBLE_FOR_EP_VIA_EXEMPTION'
    };
  }

  // 2. Minimum Qualifying Salary Baseline Check
  const minQualifying = getMinimumQualifyingSalary(age, sector);
  const meetsMinSalary = salary >= minQualifying;

  // 3. C1: Salary relative to local PMET norms
  const salaryRank = String(input.salaryPercentileRank || 'P65_TO_P89').toUpperCase().trim();
  let c1Points = 10;
  if (salaryRank === 'P90_AND_ABOVE') c1Points = 20;
  else if (salaryRank === 'BELOW_P65') c1Points = 0;

  // 4. C2: Qualifications
  const qual = String(input.qualificationLevel || 'DEGREE_EQUIVALENT').toUpperCase().trim();
  let c2Points = 10;
  if (qual === 'TOP_TIER') c2Points = 20;
  else if (qual === 'NO_DEGREE') c2Points = 0;

  // 5. C3: Diversity
  const firmPmetCount = Number(input.firmPmetCount !== undefined ? input.firmPmetCount : 50);
  const isSmallFirm = firmPmetCount < 25;
  let c3Points = 10;
  if (isSmallFirm) {
    c3Points = 10; // Default exemption score
  } else {
    const natShare = Number(input.candidateNationalityPmetPercentage || 15);
    if (natShare < 5) c3Points = 20;
    else if (natShare <= 25) c3Points = 10;
    else c3Points = 0;
  }

  // 6. C4: Support for Local Employment
  let c4Points = 10;
  if (isSmallFirm) {
    c4Points = 10; // Default exemption score
  } else {
    const localRank = String(input.firmLocalSharePercentile || 'BETWEEN_P20_AND_P50').toUpperCase().trim();
    if (localRank === 'ABOVE_P50') c4Points = 20;
    else if (localRank === 'BELOW_P20') c4Points = 0;
  }

  // 7. C5 (Bonus): Shortage Occupation List
  const onSol = Boolean(input.isOnShortageOccupationList);
  let c5Points = 0;
  if (onSol) {
    const natShare = Number(input.candidateNationalityPmetPercentage || 15);
    c5Points = natShare < 33 ? 20 : 10;
  }

  // 8. C6 (Bonus): Strategic Economic Priorities
  const sep = Boolean(input.hasStrategicEconomicPriority);
  const c6Points = sep ? 10 : 0;

  const totalScore = c1Points + c2Points + c3Points + c4Points + c5Points + c6Points;
  const passMark = 40;
  const isPassMarkMet = totalScore >= passMark;

  let verdict = 'NOT_ELIGIBLE';
  if (!meetsMinSalary) {
    verdict = 'DISQUALIFIED_BELOW_MINIMUM_QUALIFYING_SALARY';
  } else if (isPassMarkMet) {
    verdict = 'ELIGIBLE_FOR_EP_COMPASS_PASSED';
  } else {
    verdict = 'FAILED_COMPASS_SCORE_BELOW_40';
  }

  return {
    isExemptFromCompass: false,
    sector,
    candidateAge: age,
    proposedSalarySgd: salary,
    statutoryMinimumQualifyingSalarySgd: minQualifying,
    meetsMinimumQualifyingSalary: meetsMinSalary,
    criteriaBreakdown: {
      c1SalaryPoints: c1Points,
      c2QualificationPoints: c2Points,
      c3DiversityPoints: c3Points,
      c4LocalSupportPoints: c4Points,
      c5SkillsShortageBonusPoints: c5Points,
      c6StrategicBonusPoints: c6Points
    },
    totalCompassScore: totalScore,
    compassPassThreshold: passMark,
    isPassMarkMet: isPassMarkMet,
    isSmallFirmExemptionApplied: isSmallFirm,
    eligibilityVerdict: verdict
  };
}

module.exports = {
  evaluateCompassEpEligibility,
  getMinimumQualifyingSalary,
  SECTOR_TYPES,
  QUALIFICATION_LEVELS
};
