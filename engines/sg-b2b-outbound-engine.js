/**
 * Singapore B2B Outbound Cadence & PDPA DNC Engine (`engines/sg-b2b-outbound-engine.js`)
 *
 * Implements deterministic compliance verification and cadence modeling for outbound sales
 * under the Singapore Personal Data Protection Act 2012 (PDPA) and Spam Control Act 2007:
 *   - Business Contact Information (BCI) exemption under PDPA Section 4(4)(d).
 *   - Do-Not-Call (DNC) Registry compliance for voice, SMS, and WhatsApp communications.
 *   - Spam Control Act 2007 requirements (functional unsubscribe mechanism, sender header identity).
 *   - High-conversion multi-channel B2B cadence scheduling (Email, LinkedIn SG, Telephone).
 *
 * DOCTRINE: Pure numerical computation and deterministic statutory verification.
 * ZERO external dependencies. Pure Node.js.
 */

'use strict';

const SUPPORTED_RECIPIENTS = ['B2B_CORPORATE_CAPACITY', 'B2C_INDIVIDUAL_CONSUMER'];
const SUPPORTED_CHANNELS = ['EMAIL', 'LINKEDIN', 'PHONE_VOICE', 'SMS_WHATSAPP'];

/**
 * Audits outbound outreach compliance and constructs a compliant prospecting cadence.
 *
 * @param {Object} input
 * @param {string} [input.recipientType='B2B_CORPORATE_CAPACITY'] - 'B2B_CORPORATE_CAPACITY' or 'B2C_INDIVIDUAL_CONSUMER'
 * @param {string[]} [input.outboundChannels=['EMAIL', 'LINKEDIN']] - Array of marketing channels
 * @param {boolean} [input.hasCheckedDncRegistry=false] - Whether DNC registry was verified within 21 days
 * @param {boolean} [input.hasFunctionalUnsubscribeMechanism=true] - Required under Spam Control Act
 * @param {boolean} [input.hasClearSenderIdentity=true] - ACRA company name / sender verified
 * @param {number} [input.cadenceStepCount=4] - Number of touches in the prospecting cadence
 * @returns {Object} Deterministic PDPA compliance audit and multi-step cadence sequence
 */
function evaluateSingaporeOutboundCadence(input = {}) {
  if (!input || typeof input !== 'object') {
    throw new Error("INVALID_INPUT: Input must be a valid configuration object");
  }

  const recipientType = String(input.recipientType || 'B2B_CORPORATE_CAPACITY').toUpperCase().trim();
  if (!SUPPORTED_RECIPIENTS.includes(recipientType)) {
    throw new Error(`INVALID_INPUT: 'recipientType' must be one of [${SUPPORTED_RECIPIENTS.join(', ')}] (got '${input.recipientType}')`);
  }

  const channels = Array.isArray(input.outboundChannels)
    ? input.outboundChannels.map(c => String(c).toUpperCase().trim()).filter(c => SUPPORTED_CHANNELS.includes(c))
    : ['EMAIL', 'LINKEDIN'];

  const hasCheckedDnc = Boolean(input.hasCheckedDncRegistry);
  const hasUnsub = input.hasFunctionalUnsubscribeMechanism !== undefined ? Boolean(input.hasFunctionalUnsubscribeMechanism) : true;
  const hasSenderId = input.hasClearSenderIdentity !== undefined ? Boolean(input.hasClearSenderIdentity) : true;
  const stepCount = Math.max(1, Math.min(6, Math.floor(Number(input.cadenceStepCount) || 4)));

  const complianceBreaches = [];

  // 1. PDPA BCI Exemption vs DNC Registry Check
  const isB2bBci = recipientType === 'B2B_CORPORATE_CAPACITY';
  let bciExemptionApplies = false;

  if (isB2bBci) {
    bciExemptionApplies = true;
  } else {
    // For B2C, telemarketing / SMS requires active DNC registry verification
    const usesTelemarketing = channels.includes('PHONE_VOICE') || channels.includes('SMS_WHATSAPP');
    if (usesTelemarketing && !hasCheckedDnc) {
      complianceBreaches.push({
        code: 'PDPA_DNC_REGISTRY_CHECK_MISSING',
        severity: 'CRITICAL',
        statutoryReference: 'Singapore PDPA 2012 Part 9 (Do Not Call Registry)',
        issue: 'Telemarketing or SMS messages sent to consumer personal numbers without prior checking against the Singapore DNC Registry within 21 days violates PDPA (fines up to S$10,000 per violation).'
      });
    }
  }

  // 2. Spam Control Act 2007 (Electronic Mail & Messaging)
  if (channels.includes('EMAIL')) {
    if (!hasUnsub) {
      complianceBreaches.push({
        code: 'SPAM_CONTROL_ACT_UNSUBSCRIBE_MISSING',
        severity: 'HIGH',
        statutoryReference: 'Spam Control Act 2007 Section 11',
        issue: 'Commercial electronic messages sent in Singapore must include a valid and functioning unsubscribe facility that operates within 10 business days.'
      });
    }
    if (!hasSenderId) {
      complianceBreaches.push({
        code: 'SPAM_CONTROL_ACT_SENDER_IDENTITY_MISSING',
        severity: 'HIGH',
        statutoryReference: 'Spam Control Act 2007 Section 13',
        issue: 'Header and sender information must not be misleading and must accurately identify the initiating Singapore enterprise.'
      });
    }
  }

  // 3. Cadence Sequencing Plan
  const cadenceSequence = [
    { step: 1, day: 1, channel: 'LINKEDIN', action: 'Connect request with hyper-personalized corporate observation' },
    { step: 2, day: 3, channel: 'EMAIL', action: 'Direct value-driven executive email with relevant Singapore case study' },
    { step: 3, day: 7, channel: channels.includes('PHONE_VOICE') ? 'PHONE_VOICE' : 'EMAIL', action: 'Follow-up inquiry / soft discovery invitation' },
    { step: 4, day: 14, channel: 'EMAIL', action: 'Permission-based soft breakup email sharing benchmark report' },
    { step: 5, day: 21, channel: 'LINKEDIN', action: 'Engage with target executive recent post / profile view' },
    { step: 6, day: 30, channel: 'EMAIL', action: 'Quarterly review reconnection touchpoint' }
  ].slice(0, stepCount);

  const isCompliant = complianceBreaches.filter(b => b.severity === 'CRITICAL').length === 0;

  return {
    recipientType,
    isFullyCompliant: isCompliant,
    bciExemptionApplies,
    statutoryAudit: {
      isSpamControlActCompliant: hasUnsub && hasSenderId,
      isPdpaCompliant: isCompliant,
      hasB2bBciExemption: bciExemptionApplies,
      channelsConfigured: channels
    },
    totalBreachesDetected: complianceBreaches.length,
    complianceBreaches,
    recommendedOutboundCadence: cadenceSequence,
    statutoryNotice: isCompliant
      ? (bciExemptionApplies
        ? "Proses outbound mematuhi pengecualian Business Contact Information (BCI) di bawah PDPA Section 4(4)(d)."
        : "Proses outbound mematuhi regulasi Spam Control Act dan verifikasi DNC Registry.")
      : "Ditemukan pelanggaran statuter PDPA atau Spam Control Act. Sesuaikan saluran atau lengkapi mekanisme unsubscribe."
  };
}

module.exports = {
  evaluateSingaporeOutboundCadence,
  SUPPORTED_RECIPIENTS,
  SUPPORTED_CHANNELS
};
