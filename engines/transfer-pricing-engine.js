/**
 * Singapore Transfer Pricing (TP) Compliance & Arm's Length Engine (`engines/transfer-pricing-engine.js`)
 *
 * Mengimplementasikan evaluasi kepatuhan penetapan harga transfer (Transfer Pricing) berdasarkan
 * Income Tax Act 1947 (Sections 34D, 34E, dan 34F) serta Pedoman Transfer Pricing IRAS (TPG):
 *   - Ambang Batas Wajib Dokumentasi TP (Transfer Pricing Documentation / TPD):
 *       * Omzet kotor tahunan > S$10.000.000, atau
 *       * Diwajibkan oleh IRAS pada tahun berjalan / tahun sebelumnya.
 *   - Batas Pengecualian Transaksi Pihak Berelasi (RPT Thresholds):
 *       * Pembelian / Penjualan Barang Berwujud: S$15.000.000.
 *       * Pinjaman Pihak Berelasi (Related Party Loans): S$15.000.000.
 *       * Pembayaran / Penerimaan Jasa Layanan: S$1.000.000.
 *       * Royalti, Lisensi, dan Properti: S$1.000.000.
 *   - Evaluasi Rentang Kewajaran (Arm's Length Interquartile Range: 25th - 75th Percentile).
 *   - Surcharge Statuter 5% (Section 34E) atas koreksi TP oleh IRAS.
 *
 * 100% deterministik, zero external dependencies.
 */

'use strict';

const TPD_REVENUE_THRESHOLD = 10000000; // S$10M gross revenue threshold
const STATUTORY_TP_SURCHARGE_RATE = 0.05; // 5% surcharge per Section 34E

const RPT_CATEGORY_THRESHOLDS = {
  GOODS: { name: 'Purchase/Sale of Goods', thresholdSgd: 15000000 },
  LOANS: { name: 'Related Party Loans', thresholdSgd: 15000000 },
  SERVICES: { name: 'Service Fees (Management, Technical, etc.)', thresholdSgd: 1000000 },
  ROYALTY_IP: { name: 'Royalties and Intellectual Property Licensing', thresholdSgd: 1000000 },
  PROPERTY_LEASE: { name: 'Property Leases and Rentals', thresholdSgd: 1000000 }
};

/**
 * Mengevaluasi kewajiban TPD dan menganalisis kesesuaian prinsip kewajaran (Arm's Length).
 *
 * @param {Object} params
 * @param {number} params.annualGrossRevenueSgd Total omzet bruto tahunan perusahaan
 * @param {Object} [params.relatedPartyTransactions={}] Nilai transaksi pihak berelasi per kategori
 * @param {number} [params.testedPartyMarginPercent] Margin margin operasional (OM) atau markup biaya tested party
 * @param {Object} [params.comparableBenchmark] Rentang margin komparabel { q1: number, median: number, q3: number }
 * @param {number} [params.transactionBaseAmountSgd=0] Nilai basis transaksi untuk penyesuaian koreksi
 * @returns {Object} Hasil evaluasi kepatuhan TPD dan estimasi eksposur surcharge
 */
function evaluateTransferPricingCompliance(params) {
  if (!params || typeof params !== 'object') {
    throw new TypeError("Parameter 'params' harus berupa objek valid.");
  }

  const revenue = Math.max(0, Number(params.annualGrossRevenueSgd) || 0);
  const rpt = params.relatedPartyTransactions || {};
  const isMandatoryTpd = revenue > TPD_REVENUE_THRESHOLD;

  const rptBreakdown = {};
  let anyRptExceeds = false;

  for (const [catKey, meta] of Object.entries(RPT_CATEGORY_THRESHOLDS)) {
    const amount = Math.max(0, Number(rpt[catKey]) || 0);
    const exceeds = amount > meta.thresholdSgd;
    if (exceeds) anyRptExceeds = true;

    rptBreakdown[catKey] = {
      name: meta.name,
      transactionAmountSgd: amount,
      thresholdSgd: meta.thresholdSgd,
      exceedsThreshold: exceeds,
      tpdRequiredForCategory: isMandatoryTpd && exceeds
    };
  }

  // Evaluasi Arm's Length Range jika benchmark komparabel disediakan
  let armsLengthStatus = 'NOT_ASSESSED';
  let adjustmentAmountSgd = 0;
  let surcharge5PercentSgd = 0;
  const margin = Number(params.testedPartyMarginPercent);
  const benchmark = params.comparableBenchmark;

  if (typeof margin === 'number' && !isNaN(margin) && benchmark && typeof benchmark.q1 === 'number') {
    const q1 = benchmark.q1;
    const median = benchmark.median;
    const q3 = benchmark.q3;

    if (margin >= q1 && margin <= q3) {
      armsLengthStatus = 'WITHIN_ARMS_LENGTH_RANGE';
    } else {
      armsLengthStatus = 'OUTSIDE_ARMS_LENGTH_RANGE';
      // Bila di luar rentang, IRAS umumnya melakukan koreksi ke nilai Median
      const baseAmount = Math.max(0, Number(params.transactionBaseAmountSgd) || 0);
      if (baseAmount > 0 && margin < median) {
        const marginDeltaDecimal = (median - margin) / 100;
        adjustmentAmountSgd = Number((baseAmount * marginDeltaDecimal).toFixed(2));
        surcharge5PercentSgd = Number((adjustmentAmountSgd * STATUTORY_TP_SURCHARGE_RATE).toFixed(2));
      }
    }
  }

  return {
    isMandatoryTpdByRevenue: isMandatoryTpd,
    annualGrossRevenueSgd: revenue,
    revenueThresholdSgd: TPD_REVENUE_THRESHOLD,
    hasRptExceedingThreshold: anyRptExceeds,
    rptBreakdown,
    armsLengthEvaluation: {
      status: armsLengthStatus,
      testedPartyMarginPercent: isNaN(margin) ? null : margin,
      comparableRange: benchmark ? { q1: benchmark.q1, median: benchmark.median, q3: benchmark.q3 } : null,
      potentialAdjustmentSgd: adjustmentAmountSgd,
      statutorySurcharge5PercentSgd: surcharge5PercentSgd
    },
    statutoryFilingAdvice: isMandatoryTpd
      ? "Perusahaan wajib menyiapkan Laporan Transfer Pricing (TPD) komprehensif sebelum batas akhir pelaporan SPT PPh Badan."
      : "Perusahaan berada di bawah ambang batas pendapatan statuter S$10M untuk kewajiban TPD formal."
  };
}

module.exports = {
  evaluateTransferPricingCompliance,
  TPD_REVENUE_THRESHOLD,
  RPT_CATEGORY_THRESHOLDS,
  STATUTORY_TP_SURCHARGE_RATE
};
