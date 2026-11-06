/**
 * Singapore Small Company Audit Exemption Engine (`engines/small-company-audit-engine.js`)
 *
 * Implements deterministic qualification testing for Small Company Audit Exemption
 * under the Thirteenth Schedule of the Singapore Companies Act 1967:
 *   - Evaluates the 3 statutory criteria (Revenue <= S$10M, Assets <= S$10M, Employees <= 50)
 *   - Requires meeting at least 2 of 3 criteria for the immediate past 2 consecutive financial years
 *   - Evaluates Small Group consolidation exemption if entity is part of a corporate group
 *   - Special rules for newly incorporated companies (first financial year)
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
        smallCompanyAuditExemption: {
          requiredCriteriaCount: 2,
          criteria: { maxAnnualRevenueSgd: 10000000, maxTotalAssetsSgd: 10000000, maxFullTimeEmployees: 50 },
          consecutiveYearsRequired: 2
        }
      };
    }
  }
  return ACRA_RULES;
}

/**
 * Checks if a single financial year meets at least 2 of the 3 criteria.
 *
 * @param {Object} yrData
 * @param {number} yrData.annualRevenueSgd
 * @param {number} yrData.totalAssetsSgd
 * @param {number} yrData.fullTimeEmployees
 * @param {Object} criteria
 * @returns {Object} Test result for that year
 */
function evaluateSingleYearCriteria(yrData, criteria) {
  const rev = Number(yrData.annualRevenueSgd || 0);
  const ast = Number(yrData.totalAssetsSgd || 0);
  const emp = Number(yrData.fullTimeEmployees || 0);

  const meetsRev = rev <= criteria.maxAnnualRevenueSgd;
  const meetsAst = ast <= criteria.maxTotalAssetsSgd;
  const meetsEmp = emp <= criteria.maxFullTimeEmployees;

  let metCount = 0;
  if (meetsRev) metCount++;
  if (meetsAst) metCount++;
  if (meetsEmp) metCount++;

  return {
    annualRevenueSgd: rev,
    totalAssetsSgd: ast,
    fullTimeEmployees: emp,
    revenueConditionMet: meetsRev,
    assetsConditionMet: meetsAst,
    employeesConditionMet: meetsEmp,
    conditionsMetCount: metCount,
    yearQualifiesAsSmall: metCount >= 2
  };
}

/**
 * Evaluates whether a company qualifies for statutory audit exemption.
 *
 * @param {Object} input
 * @param {boolean} [input.isPrivateCompany=true] - Must be private company
 * @param {boolean} [input.isNewlyIncorporated=false] - In its first financial year
 * @param {Object} input.currentYearFinancials - { annualRevenueSgd, totalAssetsSgd, fullTimeEmployees }
 * @param {Object} [input.priorYearFinancials] - Financials for prior FY (required if not newly incorporated)
 * @param {boolean} [input.isPartOfCorporateGroup=false] - Group member status
 * @param {Object} [input.groupCurrentYearFinancials] - Consolidated group figures if part of group
 * @param {Object} [input.groupPriorYearFinancials] - Consolidated prior group figures if part of group
 * @returns {Object} Comprehensive audit exemption determination
 */
function evaluateSmallCompanyAuditExemption(input = {}) {
  if (!input || typeof input !== 'object') {
    throw new Error("INVALID_INPUT: Input must be a valid configuration object");
  }

  const isPrivate = input.isPrivateCompany !== undefined ? Boolean(input.isPrivateCompany) : true;
  if (!isPrivate) {
    return {
      isPrivateCompany: false,
      isExemptFromAudit: false,
      disqualificationReason: 'DISQUALIFIED_PUBLIC_COMPANY_CANNOT_QUALIFY_FOR_SMALL_COMPANY_EXEMPTION'
    };
  }

  const isNew = Boolean(input.isNewlyIncorporated);
  const curFin = input.currentYearFinancials;
  if (!curFin || typeof curFin !== 'object') {
    throw new Error("INVALID_INPUT: 'currentYearFinancials' object is required");
  }

  const rules = getRules().smallCompanyAuditExemption || {
    criteria: { maxAnnualRevenueSgd: 10000000, maxTotalAssetsSgd: 10000000, maxFullTimeEmployees: 50 }
  };
  const crit = rules.criteria;

  const currentYearResult = evaluateSingleYearCriteria(curFin, crit);

  let standaloneQualified = false;
  let priorYearResult = null;

  if (isNew) {
    standaloneQualified = currentYearResult.yearQualifiesAsSmall;
  } else {
    const priorFin = input.priorYearFinancials;
    if (!priorFin || typeof priorFin !== 'object') {
      throw new Error("INVALID_INPUT: 'priorYearFinancials' object is required for non-newly incorporated companies");
    }
    priorYearResult = evaluateSingleYearCriteria(priorFin, crit);
    standaloneQualified = currentYearResult.yearQualifiesAsSmall && priorYearResult.yearQualifiesAsSmall;
  }

  // Group check
  const isGroup = Boolean(input.isPartOfCorporateGroup);
  let groupQualified = true;
  let groupCurrentResult = null;
  let groupPriorResult = null;

  if (isGroup) {
    const grpCur = input.groupCurrentYearFinancials;
    if (!grpCur || typeof grpCur !== 'object') {
      throw new Error("INVALID_INPUT: 'groupCurrentYearFinancials' is required when isPartOfCorporateGroup is true");
    }
    groupCurrentResult = evaluateSingleYearCriteria(grpCur, crit);

    if (isNew) {
      groupQualified = groupCurrentResult.yearQualifiesAsSmall;
    } else {
      const grpPrior = input.groupPriorYearFinancials;
      if (!grpPrior || typeof grpPrior !== 'object') {
        throw new Error("INVALID_INPUT: 'groupPriorYearFinancials' is required when isPartOfCorporateGroup is true");
      }
      groupPriorResult = evaluateSingleYearCriteria(grpPrior, crit);
      groupQualified = groupCurrentResult.yearQualifiesAsSmall && groupPriorResult.yearQualifiesAsSmall;
    }
  }

  const finalExemption = standaloneQualified && groupQualified;

  let reason = 'QUALIFIES_AS_SMALL_COMPANY_AUDIT_EXEMPT';
  if (!standaloneQualified) {
    reason = 'FAILS_STANDALONE_TWO_OUT_OF_THREE_TEST_FOR_TWO_CONSECUTIVE_YEARS';
  } else if (!groupQualified) {
    reason = 'FAILS_GROUP_LEVEL_SMALL_GROUP_CONSOLIDATED_TEST';
  }

  return {
    isPrivateCompany: true,
    isNewlyIncorporated: isNew,
    isPartOfCorporateGroup: isGroup,
    statutoryThresholds: {
      maxAnnualRevenueSgd: crit.maxAnnualRevenueSgd,
      maxTotalAssetsSgd: crit.maxTotalAssetsSgd,
      maxFullTimeEmployees: crit.maxFullTimeEmployees,
      conditionsRequiredCount: 2
    },
    standaloneEvaluation: {
      currentYear: currentYearResult,
      priorYear: priorYearResult,
      isStandaloneQualified: standaloneQualified
    },
    groupEvaluation: isGroup ? {
      groupCurrentYear: groupCurrentResult,
      groupPriorYear: groupPriorResult,
      isGroupQualified: groupQualified
    } : null,
    isExemptFromAudit: finalExemption,
    auditRequirementStatus: finalExemption ? 'AUDIT_EXEMPT_UNAUDITED_STATEMENTS_PERMITTED' : 'STATUTORY_AUDIT_MANDATORY',
    verdictCode: reason
  };
}

module.exports = {
  evaluateSmallCompanyAuditExemption,
  evaluateSingleYearCriteria
};
