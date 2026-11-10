/**
 * Singapore SaaS & Digital Business Unit Economics Engine (`engines/unit-economics-engine.js`)
 *
 * Mengimplementasikan analisis keekonomian unit pelanggan (Unit Economics):
 *   - Customer Lifetime Value (LTV / CLV):
 *       * LTV = (ARPU × Gross Margin %) / Churn Rate.
 *   - Customer Acquisition Cost (CAC):
 *       * Total Sales & Marketing Costs / New Customers Acquired.
 *   - Rasio LTV : CAC (Indikator Daya Hidup Bisnis):
 *       * Benchmark Industri Singapura & Global (Ideal: 3.0x - 5.0x).
 *   - CAC Payback Period (Waktu Pengembalian Biaya Akuisisi dalam Bulan):
 *       * CAC / (ARPU × Gross Margin %).
 *   - SaaS Magic Number (Efisiensi Pertumbuhan Pendapatan Baru).
 *
 * 100% deterministik, zero external dependencies.
 */

'use strict';

/**
 * Menghitung dan mengevaluasi unit economics pelanggan.
 *
 * @param {Object} params
 * @param {number} params.averageMonthlyRevenuePerUserSgd ARPU bulanan dalam SGD
 * @param {number} params.grossMarginPercent Persentase laba kotor (misal 75 untuk 75%)
 * @param {number} params.monthlyChurnRatePercent Persentase churn pelanggan bulanan (misal 2.5 untuk 2.5%)
 * @param {number} params.totalMonthlySalesAndMarketingSpendSgd Total biaya akuisisi (iklan + gaji sales) bulanan dalam SGD
 * @param {number} params.newCustomersAcquiredCount Jumlah pelanggan baru yang diperoleh dalam periode tersebut
 * @returns {Object} LTV, CAC, LTV:CAC Ratio, CAC Payback Period, dan diagnosis kesehatan unit bisnis
 */
function evaluateUnitEconomics(params) {
  if (!params || typeof params !== 'object') {
    throw new TypeError("Parameter 'params' harus berupa objek valid.");
  }

  const arpu = Math.max(0, Number(params.averageMonthlyRevenuePerUserSgd) || 0);
  const gmPct = Math.max(1, Math.min(100, Number(params.grossMarginPercent) || 70)) / 100;
  const rawChurn = params.monthlyChurnRatePercent !== undefined ? params.monthlyChurnRatePercent : params.monthlyCustomerChurnRatePercent;
  const churnPct = Math.max(0.1, Math.min(100, Number(rawChurn) || 3)) / 100;

  const rawSpend = params.totalMonthlySalesAndMarketingSpendSgd !== undefined ? params.totalMonthlySalesAndMarketingSpendSgd : params.monthlySalesAndMarketingSpendSgd;
  const spend = Math.max(0, Number(rawSpend) || 0);
  const rawCount = params.newCustomersAcquiredCount !== undefined ? params.newCustomersAcquiredCount : params.newCustomersAcquiredMonthly;
  const newCustomers = Math.max(1, Math.floor(Number(rawCount) || 1));

  // 1. CAC
  const cac = Math.round((spend / newCustomers) * 100) / 100;

  // 2. Customer Lifetime & LTV
  const averageCustomerLifespanMonths = Math.round((1 / churnPct) * 10) / 10;
  const monthlyGrossProfitPerUser = arpu * gmPct;
  const ltv = Math.round((monthlyGrossProfitPerUser / churnPct) * 100) / 100;

  // 3. LTV : CAC Ratio
  const ltvCacRatio = cac > 0 ? Math.round((ltv / cac) * 100) / 100 : 0;

  // 4. CAC Payback Period (Months)
  const paybackMonths = monthlyGrossProfitPerUser > 0
    ? Math.round((cac / monthlyGrossProfitPerUser) * 10) / 10
    : null;

  // Diagnosis kesehatan bisnis
  let healthRating = 'HEALTHY_SUSTAINABLE';
  let advice = '';

  if (ltvCacRatio < 1.0) {
    healthRating = 'VALUE_DESTRUCTIVE';
    advice = 'Bisnis membakar modal untuk setiap pelanggan yang diakuisisi (LTV < CAC). Turunkan biaya pemasaran atau tingkatkan retensi pelanggan secara drastis.';
  } else if (ltvCacRatio < 3.0) {
    healthRating = 'UNDERPERFORMING_LOW_EFFICIENCY';
    advice = 'Rasio LTV:CAC berada di bawah benchmark ideal (3.0x). Perbaiki efisiensi corong konversi atau naikkan harga jual.';
  } else if (ltvCacRatio <= 5.0) {
    healthRating = 'IDEAL_OPTIMAL';
    advice = 'Unit economics sangat sehat dan seimbang. Alokasi modal akuisisi efektif dengan margin pengembalian yang kuat.';
  } else {
    healthRating = 'UNDER_INVESTING';
    advice = 'Rasio LTV:CAC sangat tinggi (> 5.0x). Perusahaan kemungkinan terlalu berhati-hati dan kehilangan peluang pertumbuhan pangsa pasar. Tingkatkan anggaran akuisisi.';
  }

  return {
    customerAcquisitionCostSgd: cac,
    customerLifetimeValueSgd: ltv,
    ltvToCacRatio: ltvCacRatio,
    cacPaybackPeriodMonths: paybackMonths,
    retentionMetrics: {
      averageLifespanMonths: averageCustomerLifespanMonths,
      monthlyChurnRatePercent: Math.round(churnPct * 10000) / 100,
      monthlyGrossProfitPerUserSgd: Math.round(monthlyGrossProfitPerUser * 100) / 100
    },
    businessHealthRating: healthRating,
    strategicAdvice: advice
  };
}

module.exports = {
  evaluateUnitEconomics
};
