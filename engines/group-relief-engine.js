/**
 * Singapore Group Relief Transfer Engine (`engines/group-relief-engine.js`)
 *
 * Mengimplementasikan evaluasi transfer Group Relief berdasarkan Section 37C Income Tax Act 1947:
 *   - Transfer deductions unabsorbed tahun berjalan (losses, capital allowances, qualifying donations)
 *     antara perusahaan dalam grup korporat yang memenuhi syarat.
 *   - Ambang batas kepemilikan saham biasa substantif minimal 75% (75% ordinary shareholding threshold).
 *   - Persyaratan pendirian di Singapura (Singapore incorporated) & kesamaan akhir tahun buku akuntansi.
 *   - Larangan transfer rugi tahun lalu (prior-year unabsorbed items tidak berhak).
 *
 * 100% deterministik, zero external dependencies.
 */

'use strict';

const STATUTORY_CIT_RATE = 0.17;
const GROUP_RELIEF_THRESHOLD_PERCENT = 75;

/**
 * Mengevaluasi dan menghitung transfer Group Relief antara dua perusahaan di Singapura.
 *
 * @param {Object} params
 * @param {Object} params.transferor Detail perusahaan pemberi rugi (Loss-making transferor)
 * @param {string} params.transferor.companyName Nama perusahaan transferor
 * @param {boolean} params.transferor.isIncorporatedInSingapore Status pendirian di Singapura
 * @param {string} params.transferor.financialYearEnd Tanggal akhir tahun buku (YYYY-MM-DD atau MM-DD)
 * @param {number} params.transferor.currentYearLosses Kerugian usaha tahun berjalan (unabsorbed trade losses)
 * @param {number} [params.transferor.currentYearCapitalAllowance=0] Capital allowances tahun berjalan
 * @param {number} [params.transferor.currentYearDonations=0] Donasi yang memenuhi syarat tahun berjalan
 * @param {Object} params.transferee Detail perusahaan penerima rugi (Profit-making transferee)
 * @param {string} params.transferee.companyName Nama perusahaan transferee
 * @param {boolean} params.transferee.isIncorporatedInSingapore Status pendirian di Singapura
 * @param {string} params.transferee.financialYearEnd Tanggal akhir tahun buku
 * @param {number} params.transferee.assessableIncome Penghasilan kena pajak sebelum relief
 * @param {number} params.shareholdingPercentage Persentase kepemilikan saham biasa antar-perusahaan (langsung/induk bersama)
 * @returns {Object} Hasil kelayakan dan kalkulasi transfer Group Relief
 */
function evaluateGroupReliefTransfer(params) {
  if (!params || typeof params !== 'object') {
    throw new TypeError("Parameter 'params' harus berupa objek valid.");
  }

  const { transferor, transferee } = params;
  if (!transferor || !transferee) {
    throw new TypeError("Parameter 'transferor' dan 'transferee' wajib disertakan.");
  }

  const shareholding = Number(params.shareholdingPercentage) || 0;

  // Verifikasi 3 Kriteria Statuter Kualifikasi
  const transferorInc = Boolean(transferor.isIncorporatedInSingapore);
  const transfereeInc = Boolean(transferee.isIncorporatedInSingapore);
  const shareholdingQualifies = shareholding >= GROUP_RELIEF_THRESHOLD_PERCENT;

  // Normalisasi tanggal akhir tahun buku akuntansi (membandingkan bulan dan tanggal)
  const fyeMatch = (transferor.financialYearEnd && transferee.financialYearEnd)
    ? String(transferor.financialYearEnd).slice(-5) === String(transferee.financialYearEnd).slice(-5)
    : false;

  const isEligible = transferorInc && transfereeInc && shareholdingQualifies && fyeMatch;

  const failureReasons = [];
  if (!transferorInc) failureReasons.push("Transferor bukan perusahaan yang didirikan di Singapura.");
  if (!transfereeInc) failureReasons.push("Transferee bukan perusahaan yang didirikan di Singapura.");
  if (!shareholdingQualifies) failureReasons.push(`Kepemilikan saham (${shareholding}%) berada di bawah ambang batas minimal 75%.`);
  if (!fyeMatch) failureReasons.push(`Tahun buku akuntansi tidak sama (${transferor.financialYearEnd} vs ${transferee.financialYearEnd}).`);

  // Komputasi jumlah deduction yang tersedia
  const currentLosses = Math.max(0, Number(transferor.currentYearLosses) || 0);
  const currentCA = Math.max(0, Number(transferor.currentYearCapitalAllowance) || 0);
  const currentDonations = Math.max(0, Number(transferor.currentYearDonations) || 0);
  const totalAvailableDeductions = currentLosses + currentCA + currentDonations;

  const transfereeIncome = Math.max(0, Number(transferee.assessableIncome) || 0);

  let transferredCA = 0;
  let transferredLosses = 0;
  let transferredDonations = 0;
  let totalTransferred = 0;

  if (isEligible && totalAvailableDeductions > 0 && transfereeIncome > 0) {
    let incomeRemaining = transfereeIncome;

    // Urutan transfer per aturan IRAS: Capital Allowance, Trade Losses, lalu Donations
    if (incomeRemaining > 0 && currentCA > 0) {
      transferredCA = Math.min(incomeRemaining, currentCA);
      incomeRemaining -= transferredCA;
    }

    if (incomeRemaining > 0 && currentLosses > 0) {
      transferredLosses = Math.min(incomeRemaining, currentLosses);
      incomeRemaining -= transferredLosses;
    }

    if (incomeRemaining > 0 && currentDonations > 0) {
      transferredDonations = Math.min(incomeRemaining, currentDonations);
      incomeRemaining -= transferredDonations;
    }

    totalTransferred = transferredCA + transferredLosses + transferredDonations;
  }

  const transfereeNetAssessableIncome = transfereeIncome - totalTransferred;
  const estimatedTaxSavingsSgd = Number((totalTransferred * STATUTORY_CIT_RATE).toFixed(2));

  return {
    isEligible,
    failureReasons,
    shareholdingPercentage: shareholding,
    statutoryThresholdPercent: GROUP_RELIEF_THRESHOLD_PERCENT,
    transferSummary: {
      totalAvailableInTransferorSgd: totalAvailableDeductions,
      transfereeOriginalIncomeSgd: transfereeIncome,
      totalTransferredSgd: totalTransferred,
      transfereeNetIncomeAfterReliefSgd: transfereeNetAssessableIncome,
      estimatedGroupTaxSavingsSgd: estimatedTaxSavingsSgd
    },
    transferredBreakdown: {
      capitalAllowanceTransferredSgd: transferredCA,
      tradeLossesTransferredSgd: transferredLosses,
      donationsTransferredSgd: transferredDonations,
      untransferredRemainingInTransferorSgd: totalAvailableDeductions - totalTransferred
    }
  };
}

module.exports = {
  evaluateGroupReliefTransfer,
  GROUP_RELIEF_THRESHOLD_PERCENT
};
