/**
 * Singapore PDPA Data Breach Notification & Penalty Engine (`engines/pdpa-breach-engine.js`)
 *
 * Implements deterministic compliance evaluation under Part VIA of the Singapore
 * Personal Data Protection Act 2012 (PDPA) as amended by the PDPA (Amendment) Act 2020:
 *   - Mandatory breach notification threshold check:
 *       (a) Significant harm categories (NRIC/FIN, financial data, health, biometric, credentials) OR
 *       (b) Significant scale: >= 500 affected individuals
 *   - 72-hour statutory notification deadline calculation to PDPC
 *   - Exception check for individual notification (remedial action or strong encryption)
 *   - Maximum financial penalty calculation:
 *       - Up to 10% of annual Singapore turnover for turnover > S$10,000,000
 *       - Up to S$1,000,000 for standard entities
 *
 * DOCTRINE: Pure numerical computation and statutory formula evaluation.
 * ZERO prescriptive text / ZERO subjective advice.
 * Pure Node.js, zero external dependencies.
 */

'use strict';

const fs = require('fs');
const path = require('path');

let PDPA_RULES = null;
function getRules() {
  if (!PDPA_RULES) {
    const rulesPath = path.join(__dirname, 'rules/pdpa-rules.json');
    if (fs.existsSync(rulesPath)) {
      PDPA_RULES = JSON.parse(fs.readFileSync(rulesPath, 'utf8'));
    } else {
      PDPA_RULES = {
        mandatoryBreachNotification: {
          thresholdAffectedIndividuals: 500,
          significantHarmCategories: ['FINANCIAL_DATA', 'NRIC_OR_NATIONAL_ID', 'MEDICAL_AND_HEALTH_RECORDS', 'BIOMETRIC_DATA', 'CREDENTIALS_AND_PASSWORDS'],
          notificationDeadlineHours: 72
        },
        financialPenalties: {
          largeEnterpriseTurnoverThresholdSgd: 10000000,
          largeEnterpriseMaxPenaltyPercentage: 0.10,
          standardMaxPenaltySgd: 1000000
        }
      };
    }
  }
  return PDPA_RULES;
}

const SIGNIFICANT_HARM_PRESCRIBED = [
  'NRIC_OR_FIN',
  'FINANCIAL_ACCOUNTS_OR_CREDIT_CARDS',
  'HEALTH_AND_MEDICAL_RECORDS',
  'BIOMETRIC_DATA',
  'PASSWORDS_AND_AUTHENTICATION_CREDENTIALS',
  'SEXUAL_OR_VULNERABLE_DATA'
];

/**
 * Evaluates whether a data incident constitutes a notifiable data breach under the PDPA.
 *
 * @param {Object} input
 * @param {number} input.affectedIndividualsCount - Number of individuals whose personal data was compromised
 * @param {string[]} [input.compromisedDataCategories=[]] - Data types involved
 * @param {boolean} [input.isDataEncryptedRobustly=false] - Advanced encryption renders data unreadable
 * @param {boolean} [input.remedialActionEliminatedHarm=false] - Remedial action successfully taken immediately
 * @param {number} [input.annualSingaporeTurnoverSgd=0] - Annual turnover in Singapore (for penalty ceiling)
 * @param {string} [input.assessmentCompletedTimestamp] - ISO timestamp when assessment finished
 * @returns {Object} Notifiable breach determination, deadlines, and statutory penalty exposure
 */
function evaluatePdpaBreachNotification(input = {}) {
  if (!input || typeof input !== 'object') {
    throw new Error("INVALID_INPUT: Input must be a valid configuration object");
  }

  const count = Number(input.affectedIndividualsCount);
  if (isNaN(count) || count < 0 || !isFinite(count)) {
    throw new Error(`INVALID_INPUT: 'affectedIndividualsCount' must be a non-negative finite integer (got ${input.affectedIndividualsCount})`);
  }

  const dataCats = Array.isArray(input.compromisedDataCategories)
    ? input.compromisedDataCategories.map(c => String(c).toUpperCase().trim())
    : [];

  const isEncrypted = Boolean(input.isDataEncryptedRobustly);
  const remedialEliminated = Boolean(input.remedialActionEliminatedHarm);
  const turnover = Number(input.annualSingaporeTurnoverSgd || 0);

  const rules = getRules();
  const breachRules = rules.mandatoryBreachNotification;
  const penaltyRules = rules.financialPenalties;

  // 1. Check Significant Scale (>= 500 individuals)
  const isSignificantScale = count >= breachRules.thresholdAffectedIndividuals;

  // 2. Check Significant Harm Categories
  const detectedHarmCategories = [];
  dataCats.forEach(cat => {
    if (SIGNIFICANT_HARM_PRESCRIBED.some(p => p.includes(cat) || cat.includes(p))) {
      detectedHarmCategories.push(cat);
    }
  });
  const hasSignificantHarmData = detectedHarmCategories.length > 0;

  // 3. Notifiable to PDPC
  // Notifiable if significant harm OR significant scale
  const isNotifiableToPdpc = (isSignificantScale || hasSignificantHarmData) && !isEncrypted;

  // 4. Notifiable to Affected Individuals
  // If notifiable to PDPC due to significant harm, must notify individuals UNLESS encryption or remedial action eliminated harm
  let isNotifiableToIndividuals = false;
  let individualExemptionReason = 'NONE';

  if (isNotifiableToPdpc) {
    if (isEncrypted) {
      isNotifiableToIndividuals = false;
      individualExemptionReason = 'EXEMPT_STRONG_TECHNOLOGICAL_PROTECTION_APPLIED';
    } else if (remedialEliminated) {
      isNotifiableToIndividuals = false;
      individualExemptionReason = 'EXEMPT_REMEDIAL_ACTION_ELIMINATED_RISK_OF_SIGNIFICANT_HARM';
    } else {
      isNotifiableToIndividuals = true;
    }
  }

  // 5. Notification Deadline Calculation (72 hours to PDPC)
  const assessmentTime = input.assessmentCompletedTimestamp
    ? new Date(input.assessmentCompletedTimestamp)
    : new Date('2026-11-06T00:00:00.000Z');
  const deadlinePdpcTime = new Date(assessmentTime.getTime() + (breachRules.notificationDeadlineHours * 60 * 60 * 1000));

  // 6. Maximum Statutory Financial Penalty
  let maxStatutoryPenaltySgd = penaltyRules.standardMaxPenaltySgd || 1000000;
  let penaltyTier = 'STANDARD_MAX_S1M';

  if (turnover > penaltyRules.largeEnterpriseTurnoverThresholdSgd) {
    const calculatedTurnoverPenalty = Math.round(turnover * penaltyRules.largeEnterpriseMaxPenaltyPercentage * 100) / 100;
    maxStatutoryPenaltySgd = Math.max(penaltyRules.standardMaxPenaltySgd, calculatedTurnoverPenalty);
    penaltyTier = 'LARGE_ENTERPRISE_10_PERCENT_TURNOVER';
  }

  return {
    affectedIndividualsCount: count,
    compromisedDataCategories: dataCats,
    detectedSignificantHarmCategories: detectedHarmCategories,
    assessmentResults: {
      isSignificantScaleBreach: isSignificantScale,
      hasSignificantHarmData: hasSignificantHarmData,
      isDataEncryptedRobustly: isEncrypted,
      remedialActionEliminatedHarm: remedialEliminated
    },
    statutoryNotificationRequirements: {
      isMandatoryToNotifyPdpc: isNotifiableToPdpc,
      pdpcNotificationDeadlineHours: breachRules.notificationDeadlineHours,
      pdpcDeadlineTimestamp: deadlinePdpcTime.toISOString(),
      isMandatoryToNotifyIndividuals: isNotifiableToIndividuals,
      individualNotificationExemptionReason: individualExemptionReason
    },
    statutoryPenaltyExposure: {
      annualSingaporeTurnoverSgd: turnover,
      penaltyFrameworkTier: penaltyTier,
      maximumStatutoryFinancialPenaltySgd: maxStatutoryPenaltySgd
    },
    complianceVerdict: isNotifiableToPdpc
      ? 'NOTIFIABLE_DATA_BREACH_ACTION_REQUIRED_WITHIN_72_HOURS'
      : 'NON_NOTIFIABLE_DATA_INCIDENT_RECORD_IN_INTERNAL_REGISTER'
  };
}

module.exports = {
  evaluatePdpaBreachNotification,
  SIGNIFICANT_HARM_PRESCRIBED
};
