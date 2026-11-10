/**
 * Singapore Loss Carry-Forward & Carry-Back Relief Engine (`engines/loss-carry-engine.js`)
 *
 * Mengimplementasikan evaluasi pemanfaatan kerugian fiskal berdasarkan Income Tax Act 1947:
 *   - Section 37: Carry-Forward Relief untuk Unabsorbed Trade Losses & Capital Allowances.
 *   - Section 37E: Carry-Back Relief (maksimum S$100.000 unabsorbed allowances/losses
 *     dibawa kembali ke 1 Tahun Pajak (YA) sebelumnya).
 *   - Shareholding Continuity Test (SCT): Kepemilikan saham biasa substantif minimal 50%
 *     harus tetap dipegang oleh pemegang saham yang sama pada tanggal relevan.
 *   - Same Business Test: Khusus pemanfaatan Unabsorbed Capital Allowance carry-forward.
 *
 * 100% deterministik, zero external dependencies.
 */

'use strict';

const CARRY_BACK_MAX_CAP = 100000; // Pagu statuter carry-back: S$100,000 per YA
const STATUTORY_CIT_RATE = 0.17;

/**
 * Mengevaluasi dan menghitung pemanfaatan kerugian fiskal (carry-forward dan carry-back).
 *
 * @param {Object} params
 * @param {number} params.currentYearLosses Kerugian usaha tahun berjalan yang belum terserap (unabsorbed trade losses)
 * @param {number} [params.currentYearCapitalAllowance=0] Unabsorbed capital allowances tahun berjalan
 * @param {number} [params.previousYearAssessableIncome=0] Penghasilan kena pajak tahun sebelumnya (untuk carry-back)
 * @param {boolean} [params.optForCarryBack=false] Apakah perusahaan memilih klaim carry-back relief
 * @param {number} [params.currentYearTaxableProfit=0] Keuntungan fiskal tahun berjalan sebelum penyerapan rugi masa lalu
 * @param {number} [params.priorYearUnabsorbedLosses=0] Akumulasi rugi tahun lalu yang dibawa ke depan
 * @param {number} [params.priorYearUnabsorbedCA=0] Akumulasi CA tahun lalu yang dibawa ke depan
 * @param {number} [params.shareholdingContinuityPercent=100] Persentase kesinambungan pemegang saham (SCT >= 50%)
 * @param {boolean} [params.sameBusinessCarriedOn=true] Apakah lini bisnis yang sama tetap dijalankan
 * @returns {Object} Rincian perhitungan relief kerugian
 */
function evaluateLossUtilization(params) {
  if (!params || typeof params !== 'object') {
    throw new TypeError("Parameter 'params' harus berupa objek valid.");
  }

  const currentYearLosses = Math.max(0, Number(params.currentYearLosses) || 0);
  const currentYearCA = Math.max(0, Number(params.currentYearCapitalAllowance) || 0);
  const prevYearIncome = Math.max(0, Number(params.previousYearAssessableIncome) || 0);
  const optCarryBack = Boolean(params.optForCarryBack);
  const currentProfit = Math.max(0, Number(params.currentYearTaxableProfit) || 0);
  const priorLosses = Math.max(0, Number(params.priorYearUnabsorbedLosses) || 0);
  const priorCA = Math.max(0, Number(params.priorYearUnabsorbedCA) || 0);
  const sctPercent = Number(params.shareholdingContinuityPercent) !== undefined
    ? Number(params.shareholdingContinuityPercent)
    : 100;
  const sameBusiness = params.sameBusinessCarriedOn !== undefined
    ? Boolean(params.sameBusinessCarriedOn)
    : true;

  const passesSCT = sctPercent >= 50;
  const passesSameBusinessTest = sameBusiness;

  // 1. Evaluasi Carry-Back Relief (Section 37E)
  let carryBackUtilized = 0;
  let estimatedCarryBackTaxRefund = 0;
  let remainingCurrentYearLoss = currentYearLosses;
  let remainingCurrentYearCA = currentYearCA;

  if (optCarryBack && (currentYearLosses > 0 || currentYearCA > 0) && prevYearIncome > 0) {
    const totalCurrentDeductions = currentYearCA + currentYearLosses;
    const maxAvailableForCarryBack = Math.min(totalCurrentDeductions, CARRY_BACK_MAX_CAP);
    carryBackUtilized = Math.min(maxAvailableForCarryBack, prevYearIncome);

    estimatedCarryBackTaxRefund = Number((carryBackUtilized * STATUTORY_CIT_RATE).toFixed(2));

    // Urutan pemanfaatan carry-back: Capital Allowance terlebih dahulu, kemudian Trade Losses
    const caUsedInCarryBack = Math.min(currentYearCA, carryBackUtilized);
    const lossUsedInCarryBack = Math.min(currentYearLosses, carryBackUtilized - caUsedInCarryBack);

    remainingCurrentYearCA -= caUsedInCarryBack;
    remainingCurrentYearLoss -= lossUsedInCarryBack;
  }

  // 2. Evaluasi Carry-Forward Relief (Section 37)
  let availablePriorCA = passesSCT && passesSameBusinessTest ? priorCA : 0;
  let availablePriorLosses = passesSCT ? priorLosses : 0;
  let disallowedPriorCA = (!passesSCT || !passesSameBusinessTest) ? priorCA : 0;
  let disallowedPriorLosses = !passesSCT ? priorLosses : 0;

  let profitRemaining = currentProfit;
  let caAbsorbed = 0;
  let lossAbsorbed = 0;

  // Pemanfaatan Unabsorbed Capital Allowance terdahulu
  if (profitRemaining > 0 && availablePriorCA > 0) {
    caAbsorbed = Math.min(profitRemaining, availablePriorCA);
    profitRemaining -= caAbsorbed;
    availablePriorCA -= caAbsorbed;
  }

  // Pemanfaatan Unabsorbed Trade Losses terdahulu
  if (profitRemaining > 0 && availablePriorLosses > 0) {
    lossAbsorbed = Math.min(profitRemaining, availablePriorLosses);
    profitRemaining -= lossAbsorbed;
    availablePriorLosses -= lossAbsorbed;
  }

  // Akumulasi sisa unabsorbed yang dibawa ke tahun depan (carry-forward to future YA)
  const carryForwardCAToNextYA = availablePriorCA + remainingCurrentYearCA;
  const carryForwardLossesToNextYA = availablePriorLosses + remainingCurrentYearLoss;

  return {
    compliance: {
      shareholdingContinuityPercent: sctPercent,
      passesShareholdingContinuityTest: passesSCT,
      sameBusinessCarriedOn: sameBusiness,
      passesSameBusinessTest: passesSameBusinessTest
    },
    carryBackRelief: {
      opted: optCarryBack,
      maxStatutoryCapSgd: CARRY_BACK_MAX_CAP,
      previousYearIncomeSgd: prevYearIncome,
      amountUtilizedSgd: carryBackUtilized,
      estimatedTaxRefundSgd: estimatedCarryBackTaxRefund
    },
    carryForwardRelief: {
      startingProfitBeforeOffsetSgd: currentProfit,
      caAbsorbedAgainstProfitSgd: caAbsorbed,
      lossesAbsorbedAgainstProfitSgd: lossAbsorbed,
      netChargeableIncomeAfterOffsetSgd: profitRemaining,
      disallowedLossesSgd: disallowedPriorLosses,
      disallowedCapitalAllowanceSgd: disallowedPriorCA,
      closingUnabsorbedCapitalAllowanceSgd: carryForwardCAToNextYA,
      closingUnabsorbedTradeLossesSgd: carryForwardLossesToNextYA
    }
  };
}

module.exports = {
  evaluateLossUtilization,
  CARRY_BACK_MAX_CAP
};
