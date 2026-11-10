/**
 * Singapore SFRS Financial Ratio Analysis Engine (`engines/financial-ratio-engine.js`)
 *
 * Mengimplementasikan kalkulasi dan interpretasi komprehensif 14 rasio keuangan utama
 * sesuai standar Singapore Financial Reporting Standards (SFRS) untuk audit perbankan dan evaluasi kredit:
 *   - Rasio Likuiditas (Liquidity): Current Ratio, Quick Ratio, Cash Ratio.
 *   - Rasio Solvabilitas (Solvency & Leverage): Debt-to-Equity (D/E), Debt-to-Assets, Interest Coverage.
 *   - Rasio Profitabilitas (Profitability): Gross Margin, Operating Margin, Net Margin, ROA, ROE.
 *   - Rasio Efisiensi Aktivitas (Activity/Efficiency): Asset Turnover, Receivables Turnover, Inventory Turnover.
 *
 * 100% deterministik, zero external dependencies.
 */

'use strict';

/**
 * Menghitung dan mengevaluasi 14 rasio keuangan dari data laporan keuangan.
 *
 * @param {Object} params
 * @param {number} params.revenueSgd Pendapatan penjualan bersih
 * @param {number} params.costOfGoodsSoldSgd Beban pokok penjualan (COGS)
 * @param {number} params.grossProfitSgd Laba kotor
 * @param {number} params.ebitSgd Laba operasional (EBIT)
 * @param {number} params.netProfitSgd Laba bersih setelah pajak
 * @param {number} [params.interestExpenseSgd=0] Beban bunga
 * @param {number} params.currentAssetsSgd Total aset lancar
 * @param {number} [params.cashAndEquivalentsSgd=0] Kas dan setara kas
 * @param {number} [params.inventorySgd=0] Nilai persediaan
 * @param {number} [params.tradeReceivablesSgd=0] Piutang usaha
 * @param {number} params.totalAssetsSgd Total aset keseluruhan
 * @param {number} params.currentLiabilitiesSgd Liabilitas jangka pendek
 * @param {number} [params.totalDebtSgd=0] Total utang berbunga (jangka pendek + jangka panjang)
 * @param {number} params.totalLiabilitiesSgd Total liabilitas keseluruhan
 * @param {number} params.totalEquitySgd Total ekuitas pemegang saham
 * @returns {Object} 14 metrik rasio keuangan, klasifikasi risiko kesehatan keuangan, dan ringkasan eksekutif
 */
function analyzeFinancialRatios(params) {
  if (!params || typeof params !== 'object') {
    throw new TypeError("Parameter 'params' harus berupa objek valid.");
  }

  const rev = Math.max(0, Number(params.revenueSgd) || 0);
  const cogs = Math.max(0, Number(params.costOfGoodsSoldSgd) || 0);
  const gp = params.grossProfitSgd !== undefined ? Number(params.grossProfitSgd) : (rev - cogs);
  const ebit = Number(params.ebitSgd !== undefined ? params.ebitSgd : params.ebitOperatingProfitSgd) || 0;
  const np = Number(params.netProfitSgd) || 0;
  const interest = Math.max(0, Number(params.interestExpenseSgd) || 0);

  const ca = Math.max(0, Number(params.currentAssetsSgd) || 0);
  const cash = Math.max(0, Number(params.cashAndEquivalentsSgd) || 0);
  const inv = Math.max(0, Number(params.inventorySgd) || 0);
  const ar = Math.max(0, Number(params.tradeReceivablesSgd) || 0);
  const ta = Math.max(0, Number(params.totalAssetsSgd) || 0);

  const cl = Math.max(0, Number(params.currentLiabilitiesSgd) || 0);
  const debt = Math.max(0, Number(params.totalDebtSgd) || 0);
  const tl = Math.max(0, Number(params.totalLiabilitiesSgd) || 0);
  const eq = Number(params.totalEquitySgd) || 0;

  const round2 = (num) => Math.round(num * 100) / 100;
  const roundPct = (num) => Math.round(num * 10000) / 100;

  // 1. Likuiditas
  const currentRatio = cl > 0 ? round2(ca / cl) : null;
  const quickRatio = cl > 0 ? round2((ca - inv) / cl) : null;
  const cashRatio = cl > 0 ? round2(cash / cl) : null;

  // 2. Solvabilitas
  const debtToEquity = eq > 0 ? round2(debt / eq) : null;
  const debtToAssets = ta > 0 ? round2(debt / ta) : null;
  const interestCoverage = interest > 0 ? round2(ebit / interest) : (ebit > 0 ? 999 : 0);

  // 3. Profitabilitas
  const grossProfitMargin = rev > 0 ? roundPct(gp / rev) : 0;
  const operatingProfitMargin = rev > 0 ? roundPct(ebit / rev) : 0;
  const netProfitMargin = rev > 0 ? roundPct(np / rev) : 0;
  const returnOnAssets = ta > 0 ? roundPct(np / ta) : 0;
  const returnOnEquity = eq > 0 ? roundPct(np / eq) : 0;

  // 4. Efisiensi Aktivitas
  const assetTurnover = ta > 0 ? round2(rev / ta) : 0;
  const receivablesTurnover = ar > 0 ? round2(rev / ar) : null;
  const inventoryTurnover = inv > 0 ? round2(cogs / inv) : null;

  // Health Score (0 - 100)
  let healthScore = 70;
  if (currentRatio !== null && currentRatio >= 1.5) healthScore += 10;
  else if (currentRatio !== null && currentRatio < 1.0) healthScore -= 15;

  if (quickRatio !== null && quickRatio >= 1.0) healthScore += 5;
  if (debtToEquity !== null && debtToEquity <= 1.5) healthScore += 5;
  else if (debtToEquity !== null && debtToEquity > 3.0) healthScore -= 15;

  if (interestCoverage >= 3.0) healthScore += 5;
  else if (interestCoverage < 1.5) healthScore -= 10;

  if (netProfitMargin >= 10.0) healthScore += 5;
  else if (netProfitMargin < 0) healthScore -= 20;

  const normalizedHealthScore = Math.max(0, Math.min(100, healthScore));

  let financialHealthVerdict = 'HEALTHY_STRONG';
  if (normalizedHealthScore < 50) financialHealthVerdict = 'DISTRESSED_VULNERABLE';
  else if (normalizedHealthScore < 70) financialHealthVerdict = 'MODERATE_ACCEPTABLE';

  return {
    liquidityRatios: {
      currentRatio,
      quickRatio,
      cashRatio
    },
    solvencyRatios: {
      debtToEquityRatio: debtToEquity,
      debtToAssetsRatio: debtToAssets,
      interestCoverageRatio: interestCoverage
    },
    profitabilityRatios: {
      grossProfitMarginPercent: grossProfitMargin,
      operatingProfitMarginPercent: operatingProfitMargin,
      netProfitMarginPercent: netProfitMargin,
      returnOnAssetsPercent: returnOnAssets,
      returnOnEquityPercent: returnOnEquity
    },
    efficiencyRatios: {
      assetTurnoverTimes: assetTurnover,
      receivablesTurnoverTimes: receivablesTurnover,
      inventoryTurnoverTimes: inventoryTurnover
    },
    overallHealthAssessment: {
      healthScore: normalizedHealthScore,
      verdict: financialHealthVerdict,
      summary: `Skor kesehatan keuangan: ${normalizedHealthScore}/100 (${financialHealthVerdict}). Current Ratio ${currentRatio || 'N/A'}, D/E ${debtToEquity || 'N/A'}, Net Margin ${netProfitMargin}%.`
    }
  };
}

module.exports = {
  analyzeFinancialRatios
};
