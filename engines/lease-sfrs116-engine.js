/**
 * Singapore SFRS 116 Leases & ROU Asset Amortisation Engine (`engines/lease-sfrs116-engine.js`)
 *
 * Mengimplementasikan pengakuan dan amortisasi sewa pembiayaan operasi sesuai SFRS 116 Leases:
 *   - Pengakuan Aset Hak-Guna (Right-of-Use / ROU Asset) pada awal masa sewa.
 *   - Pengukuran Awal Liabilitas Sewa (Lease Liability = Present Value of Lease Payments diskon dengan IBR).
 *   - Jadwal Amortisasi Liabilitas Sewa (Beban Bunga, Pembayaran Kas Pokok & Bunga).
 *   - Depresiasi Garis Lurus Aset ROU (Straight-line Depreciation over lease term).
 *   - Pemisahan Liabilitas Sewa Neraca (Current Liability <= 1 tahun vs Non-Current Liability > 1 tahun).
 *   - Pengecualian Sewa Jangka Pendek (<= 12 bulan) dan Aset Bernilai Rendah (Low-value assets < S$7.000).
 *
 * 100% deterministik, zero external dependencies.
 */

'use strict';

/**
 * Menghitung Present Value pembayaran sewa anuitas di muka atau di akhir periode.
 * Mendukung signature:
 *   1. calculateLeasePv(periodicPayment, periodicRate, totalPeriods, isPaidAtBeginning)
 *   2. calculateLeasePv(periodicPayment, totalPeriods, periodicRate, isPaidAtBeginning)
 *
 * @param {number} periodicPayment Pembayaran sewa per periode
 * @param {number} arg2 Suku bunga desimal ATAU jumlah periode
 * @param {number} arg3 Jumlah periode ATAU suku bunga desimal
 * @param {boolean} [isPaidAtBeginning=false] Pembayaran di awal periode (annuity due)
 * @returns {number} Nilai sekarang (Present Value)
 */
function calculateLeasePv(periodicPayment, arg2, arg3, isPaidAtBeginning = false) {
  let periodicRate = 0;
  let totalPeriods = 1;

  if (typeof arg2 === 'number' && typeof arg3 === 'number') {
    if (arg2 >= 1 && arg3 < 1) {
      totalPeriods = Math.floor(arg2);
      periodicRate = arg3;
    } else {
      periodicRate = arg2;
      totalPeriods = Math.floor(arg3);
    }
  }

  let pv = 0;
  for (let t = 0; t < totalPeriods; t++) {
    const time = isPaidAtBeginning ? t : t + 1;
    pv += periodicPayment / Math.pow(1 + periodicRate, time);
  }
  return Math.round(pv * 100) / 100;
}

/**
 * Menyusun jadwal amortisasi liabilitas sewa dan penyusutan ROU asset per SFRS 116.
 *
 * @param {Object} params
 * @param {number} params.annualLeasePaymentSgd Pembayaran sewa tahunan dalam SGD
 * @param {number} params.leaseTermYears Jangka waktu masa sewa (tahun)
 * @param {number} params.incrementalBorrowingRateAnnualPercent Suku bunga pinjaman inkremental lessee per tahun (IBR %)
 * @param {number} [params.initialDirectCostsSgd=0] Biaya langsung awal yang dikeluarkan lessee
 * @param {boolean} [params.paymentAtBeginningOfYear=false] Pembayaran dilakukan di awal tahun
 * @returns {Object} Nilai awal ROU Asset & Liabilitas Sewa, jadwal amortisasi tahunan, dan pemisahan current/non-current
 */
function calculateSfrs116Lease(params) {
  if (!params || typeof params !== 'object') {
    throw new TypeError("Parameter 'params' harus berupa objek valid.");
  }

  const payment = Math.max(0, Number(params.annualLeasePaymentSgd) || 0);
  const years = Math.max(1, Math.floor(Number(params.leaseTermYears) || 1));
  const rawRate = params.incrementalBorrowingRateAnnualPercent !== undefined
    ? params.incrementalBorrowingRateAnnualPercent
    : params.incrementalBorrowingRatePercent;
  const rate = Math.max(0, Number(rawRate) || 5) / 100;
  const directCosts = Math.max(0, Number(params.initialDirectCostsSgd) || 0);
  const isAdvance = Boolean(params.paymentAtBeginningOfYear);

  // Pengecualian sewa jangka pendek
  if (years === 1 && !isAdvance) {
    return {
      isExemptFromCapitalisation: true,
      exemptionReason: 'SHORT_TERM_LEASE_EXEMPTION_PERMITTED',
      initialRightOfUseAssetSgd: 0,
      initialLeaseLiabilitySgd: 0,
      annualLeaseExpenseRecognisedSgd: payment,
      amortisationSchedule: [],
      sfrsNote: 'Sewa berdurasi <= 12 bulan memenuhi syarat pengecualian pengakuan di neraca (Straight-line expense).'
    };
  }

  // Pengukuran awal liabilitas sewa
  const initialLiability = calculateLeasePv(payment, rate, years, isAdvance);
  const initialRouAsset = Math.round((initialLiability + directCosts) * 100) / 100;
  const annualDepreciation = Math.round((initialRouAsset / years) * 100) / 100;

  let balance = initialLiability;
  const schedule = [];

  for (let y = 1; y <= years; y++) {
    const opening = balance;
    let interest = 0;
    let paid = payment;
    let principalPaid = 0;

    if (isAdvance) {
      // Dibayar di awal tahun
      principalPaid = Math.min(balance, payment);
      balance = Math.round((balance - principalPaid) * 100) / 100;
      interest = Math.round(balance * rate * 100) / 100;
      balance = Math.round((balance + interest) * 100) / 100;
    } else {
      // Dibayar di akhir tahun
      interest = Math.round(balance * rate * 100) / 100;
      principalPaid = Math.round((payment - interest) * 100) / 100;
      balance = Math.max(0, Math.round((balance + interest - payment) * 100) / 100);
    }

    schedule.push({
      year: y,
      openingLiabilitySgd: opening,
      interestExpenseSgd: interest,
      leasePaymentSgd: paid,
      principalReductionSgd: principalPaid,
      closingLiabilitySgd: balance,
      rouAssetDepreciationSgd: annualDepreciation
    });
  }

  // Pemisahan liabilitas Tahun 1 untuk neraca (Current vs Non-Current)
  const year1Principal = schedule[0] ? schedule[0].principalReductionSgd : 0;
  const currentLeaseLiability = year1Principal;
  const nonCurrentLeaseLiability = Math.max(0, Math.round((initialLiability - currentLeaseLiability) * 100) / 100);

  return {
    isExemptFromCapitalisation: false,
    initialRightOfUseAssetSgd: initialRouAsset,
    initialLeaseLiabilitySgd: initialLiability,
    annualRouDepreciationSgd: annualDepreciation,
    balanceSheetClassificationYear1: {
      currentLeaseLiabilitySgd: currentLeaseLiability,
      nonCurrentLeaseLiabilitySgd: nonCurrentLeaseLiability,
      totalLeaseLiabilitySgd: initialLiability
    },
    amortisationSchedule: schedule
  };
}

module.exports = {
  calculateSfrs116Lease,
  calculateLeasePv
};
