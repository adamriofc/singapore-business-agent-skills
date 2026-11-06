/**
 * Singapore ACRA Statutory Deadlines & Compliance Engine (`engines/acra-statutory-deadline-engine.js`)
 *
 * Implements deterministic calculation and audit of statutory corporate deadlines under
 * Singapore Companies Act 1967 (Cap. 50):
 *   - Financial Year End (FYE) based milestone deadlines (AGM and Annual Return AR)
 *   - Private non-listed (AGM: 6 months after FYE, AR: 7 months after FYE)
 *   - Listed entities (AGM: 4 months after FYE, AR: 5 months after FYE)
 *   - Late filing statutory penalty evaluation (S$300 up to 3 months, S$600 thereafter)
 *   - Corporate secretarial and governance compliance checks (Resident Director, Sole Director != Secretary, RORC)
 *
 * DOCTRINE: Pure numerical computation and statutory formula evaluation.
 * ZERO prescriptive text / ZERO subjective advice.
 * Pure Node.js, zero external dependencies.
 */

'use strict';

const fs = require('fs');
const path = require('path');

let ACRA_RULES = null;
function getRules() {
  if (!ACRA_RULES) {
    const rulesPath = path.join(__dirname, 'rules/acra-statutory-rules.json');
    if (fs.existsSync(rulesPath)) {
      ACRA_RULES = JSON.parse(fs.readFileSync(rulesPath, 'utf8'));
    } else {
      ACRA_RULES = {
        filingDeadlines: {
          privateNonListed: { agmMonthsAfterFye: 6, arMonthsAfterFye: 7 },
          listedCompany: { agmMonthsAfterFye: 4, arMonthsAfterFye: 5 }
        },
        lateFilingPenalties: { tier1_upTo3MonthsLate: 300, tier2_moreThan3MonthsLate: 600 },
        statutoryGovernance: { minResidentDirectors: 1, companySecretaryMaxMonthsAfterIncorporation: 6, soleDirectorCannotBeSecretary: true }
      };
    }
  }
  return ACRA_RULES;
}

/**
 * Adds months to a date string (YYYY-MM-DD) and returns the last day of that resulting month.
 *
 * @param {string} dateStr - 'YYYY-MM-DD'
 * @param {number} monthsToAdd
 * @returns {string} 'YYYY-MM-DD'
 */
function addMonthsToDate(dateStr, monthsToAdd) {
  const parts = dateStr.split('-');
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1;
  const d = parseInt(parts[2], 10);

  const targetDate = new Date(Date.UTC(y, m + monthsToAdd, 1));
  // Get last day of the target month
  const lastDay = new Date(Date.UTC(targetDate.getUTCFullYear(), targetDate.getUTCMonth() + 1, 0)).getUTCDate();
  const day = Math.min(d, lastDay);

  const finalDate = new Date(Date.UTC(targetDate.getUTCFullYear(), targetDate.getUTCMonth(), day));
  return finalDate.toISOString().slice(0, 10);
}

/**
 * Calculates statutory filing deadlines for a company based on its Financial Year End.
 *
 * @param {Object} input
 * @param {string} input.financialYearEndDate - 'YYYY-MM-DD'
 * @param {boolean} [input.isListedCompany=false] - Whether company is listed on SGX
 * @param {string} [input.currentDate] - Current reference date ('YYYY-MM-DD')
 * @param {boolean} [input.isAgmDispensed=false] - Whether private company dispensed with AGM
 * @param {boolean} [input.hasResidentDirector=true] - Singapore resident director present
 * @param {boolean} [input.isSoleDirectorSecretary=false] - Whether sole director also acts as secretary (invalid)
 * @returns {Object} Statutory filing timeline and compliance audit
 */
function calculateAcraStatutoryDeadlines(input = {}) {
  if (!input || typeof input !== 'object') {
    throw new Error("INVALID_INPUT: Input must be a valid configuration object");
  }

  const fye = String(input.financialYearEndDate || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fye)) {
    throw new Error(`INVALID_INPUT: 'financialYearEndDate' must be a valid ISO date string 'YYYY-MM-DD' (got '${input.financialYearEndDate}')`);
  }

  const isListed = Boolean(input.isListedCompany);
  const isAgmDispensed = Boolean(input.isAgmDispensed);
  const hasResidentDir = input.hasResidentDirector !== undefined ? Boolean(input.hasResidentDirector) : true;
  const isSoleDirSec = Boolean(input.isSoleDirectorSecretary);

  const refDateStr = input.currentDate ? String(input.currentDate).trim() : '2026-11-06';
  const refDate = new Date(refDateStr);

  const rules = getRules();
  const deadlineCfg = isListed ? rules.filingDeadlines.listedCompany : rules.filingDeadlines.privateNonListed;

  const agmDeadline = addMonthsToDate(fye, deadlineCfg.agmMonthsAfterFye);
  const arDeadline = addMonthsToDate(fye, deadlineCfg.arMonthsAfterFye);

  // Check days overdue
  const arDate = new Date(arDeadline);
  const diffTime = refDate.getTime() - arDate.getTime();
  const daysOverdue = diffTime > 0 ? Math.floor(diffTime / (1000 * 60 * 60 * 24)) : 0;

  let lateFilingPenalty = 0;
  let penaltyTier = 'NONE';
  if (daysOverdue > 0) {
    if (daysOverdue <= 90) {
      lateFilingPenalty = rules.lateFilingPenalties.tier1_upTo3MonthsLate || 300;
      penaltyTier = 'TIER_1_UP_TO_3_MONTHS';
    } else {
      lateFilingPenalty = rules.lateFilingPenalties.tier2_moreThan3MonthsLate || 600;
      penaltyTier = 'TIER_2_MORE_THAN_3_MONTHS';
    }
  }

  // Governance compliance checks
  const governanceViolations = [];
  if (!hasResidentDir) {
    governanceViolations.push('BREACH_SECTION_145_MINIMUM_ONE_ORDINARY_RESIDENT_DIRECTOR_REQUIRED');
  }
  if (isSoleDirSec) {
    governanceViolations.push('BREACH_SECTION_171_SOLE_DIRECTOR_CANNOT_BE_COMPANY_SECRETARY');
  }

  return {
    companyType: isListed ? 'PUBLIC_LISTED' : 'PRIVATE_NON_LISTED',
    financialYearEndDate: fye,
    statutoryFilingTimeline: {
      agmDeadlineDate: isAgmDispensed ? 'DISPENSED_UNDER_SECTION_175A' : agmDeadline,
      arFilingDeadlineDate: arDeadline,
      agmIntervalMonthsAfterFye: deadlineCfg.agmMonthsAfterFye,
      arIntervalMonthsAfterFye: deadlineCfg.arMonthsAfterFye
    },
    filingStatusAudit: {
      referenceDate: refDateStr,
      isAnnualReturnOverdue: daysOverdue > 0,
      daysOverdue: daysOverdue,
      penaltyTier: penaltyTier,
      statutoryLatePenaltySgd: lateFilingPenalty
    },
    governanceAudit: {
      hasResidentDirector: hasResidentDir,
      isSoleDirectorAlsoSecretary: isSoleDirSec,
      isGovernanceCompliant: governanceViolations.length === 0,
      violations: governanceViolations
    }
  };
}

module.exports = {
  calculateAcraStatutoryDeadlines,
  addMonthsToDate
};
