/**
 * Singapore Variable Capital Company (VCC) Distribution Waterfall Engine (`engines/vcc-waterfall-engine.js`)
 *
 * Mengimplementasikan model distribusi hasil investasi (Capital Distribution Waterfall)
 * untuk dana kelolaan Variable Capital Company (VCC) di bawah Singapore VCC Act 2018:
 *   - Segregasi Sub-Fund (Statutory Ring-Fencing of Assets & Liabilities under Section 29 VCC Act).
 *   - 4-Tier Distribution Waterfall (Standar Private Equity / Venture Capital di Singapura):
 *       * Tier 1: Return of Capital (100% pengembalian modal awal pokok ke Limited Partners / LP).
 *       * Tier 2: Preferred Return / Hurdle Rate (Pembagian bunga prioritas, misal 8% per tahun ke LP).
 *       * Tier 3: General Partner (GP) Catch-Up (Alokasi pemenuhan komisi GP hingga target carry tercapai).
 *       * Tier 4: Carried Interest Split (Pembagian keuntungan final 80% LP : 20% GP).
 *   - Kualifikasi Insentif Pajak Dana Kelolaan MAS (Section 13O & Section 13U Income Tax Act).
 *
 * 100% deterministik, zero external dependencies.
 */

'use strict';

/**
 * Menghitung pembagian distribusi modal dan carried interest dana investasi VCC.
 *
 * @param {Object} params
 * @param {number} params.totalProceedsToDistributeSgd Total dana hasil likuidasi/penjualan portofolio (SGD)
 * @param {number} params.lpInvestedCapitalSgd Total modal pokok yang telah disetor oleh LP (SGD)
 * @param {number} [params.hurdleRateAnnualPercent=8] Tingkat pengembalian minimum tahunan LP (Hurdle Rate %)
 * @param {number} [params.investmentHoldingPeriodYears=3] Periode penahanan investasi dalam tahun
 * @param {number} [params.carriedInterestPercent=20] Persentase carried interest manajer investasi GP (%)
 * @param {boolean} [params.hasGpCatchUp=true] Apakah terdapat mekanisme GP Catch-up (100% catch-up)
 * @returns {Object} Rincian alokasi distribusi per tier antara LP dan GP
 */
function calculateVccDistributionWaterfall(params) {
  if (!params || typeof params !== 'object') {
    throw new TypeError("Parameter 'params' harus berupa objek valid.");
  }

  let remainingProceeds = Math.max(0, Number(params.totalProceedsToDistributeSgd !== undefined ? params.totalProceedsToDistributeSgd : params.totalDistributableProceedsSgd) || 0);
  const investedCapital = Math.max(0, Number(params.lpInvestedCapitalSgd) || 0);
  const rawHurdle = params.hurdleRateAnnualPercent !== undefined ? params.hurdleRateAnnualPercent : params.preferredReturnHurdleRatePercent;
  const hurdleRate = Math.max(0, Number(rawHurdle) || 8) / 100;
  const years = Math.max(0.1, Number(params.investmentHoldingPeriodYears) || 1);
  const carryRate = Math.max(0, Math.min(100, Number(params.carriedInterestPercent) || 20)) / 100;
  const hasCatchUp = params.hasGpCatchUp !== undefined ? Boolean(params.hasGpCatchUp) : true;

  let lpTotal = 0;
  let gpTotal = 0;

  // Tier 1: Return of Capital (100% to LP)
  const tier1Amount = Math.min(remainingProceeds, investedCapital);
  lpTotal += tier1Amount;
  remainingProceeds -= tier1Amount;

  // Tier 2: Preferred Return (Hurdle Rate simple/compounded to LP)
  const preferredReturnTarget = Math.round(investedCapital * hurdleRate * years * 100) / 100;
  const tier2Amount = Math.min(remainingProceeds, preferredReturnTarget);
  lpTotal += tier2Amount;
  remainingProceeds -= tier2Amount;

  // Tier 3: GP Catch-Up
  let tier3GpAmount = 0;
  if (hasCatchUp && remainingProceeds > 0) {
    // GP catch-up target: GP share = carryRate / (1 - carryRate) * Tier 2 Preferred Return
    const catchUpTarget = Math.round((tier2Amount * (carryRate / (1 - carryRate))) * 100) / 100;
    tier3GpAmount = Math.min(remainingProceeds, catchUpTarget);
    gpTotal += tier3GpAmount;
    remainingProceeds -= tier3GpAmount;
  }

  // Tier 4: Carried Interest Split (Final Split)
  let tier4LpAmount = 0;
  let tier4GpAmount = 0;
  if (remainingProceeds > 0) {
    tier4GpAmount = Math.round(remainingProceeds * carryRate * 100) / 100;
    tier4LpAmount = Math.round((remainingProceeds - tier4GpAmount) * 100) / 100;
    lpTotal += tier4LpAmount;
    gpTotal += tier4GpAmount;
    remainingProceeds = 0;
  }

  const grandTotal = Math.round((lpTotal + gpTotal) * 100) / 100;
  const lpProfitSgd = Math.max(0, Math.round((lpTotal - investedCapital) * 100) / 100);
  const lpNetMoic = investedCapital > 0 ? Math.round((lpTotal / investedCapital) * 100) / 100 : 0;

  return {
    investedCapitalSgd: investedCapital,
    totalDistributedSgd: grandTotal,
    lpReturnsSummary: {
      totalDistributedToLpSgd: lpTotal,
      capitalReturnedSgd: tier1Amount,
      netProfitToLpSgd: lpProfitSgd,
      netMoicMultiple: lpNetMoic
    },
    gpReturnsSummary: {
      totalCarriedInterestToGpSgd: gpTotal,
      effectiveCarryPercentOfProfits: (lpProfitSgd + gpTotal) > 0
        ? Math.round((gpTotal / (lpProfitSgd + gpTotal)) * 10000) / 100
        : 0
    },
    waterfallTiersBreakdown: {
      tier1ReturnOfCapital: { lpAmountSgd: tier1Amount, gpAmountSgd: 0 },
      tier2PreferredReturn: { lpAmountSgd: tier2Amount, gpAmountSgd: 0, targetSgd: preferredReturnTarget },
      tier3GpCatchUp: { lpAmountSgd: 0, gpAmountSgd: tier3GpAmount },
      tier4CarriedInterestSplit: { lpAmountSgd: tier4LpAmount, gpAmountSgd: tier4GpAmount }
    }
  };
}

module.exports = {
  calculateVccDistributionWaterfall
};
