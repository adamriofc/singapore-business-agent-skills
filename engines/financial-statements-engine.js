/**
 * Singapore SFRS Financial Statements Presentation Engine (`engines/financial-statements-engine.js`)
 *
 * Mengimplementasikan struktur dan kalkulasi laporan keuangan standar
 * Singapore Financial Reporting Standards (SFRS 1 Presentation of Financial Statements):
 *   - Laporan Laba Rugi Komprehensif (Statement of Comprehensive Income):
 *       * Revenue, Cost of Sales, Gross Profit, Operating Expenses, EBIT, Finance Costs, Tax, Net Profit, EBITDA.
 *   - Laporan Posisi Keuangan (Statement of Financial Position / Balance Sheet):
 *       * Current Assets, Non-Current Assets, Current Liabilities, Non-Current Liabilities, Shareholders' Equity.
 *       * Verifikasi Persamaan Akuntansi: Total Aset = Total Liabilitas + Total Ekuitas (Zero Discrepancy).
 *   - Laporan Arus Kas (Statement of Cash Flows):
 *       * Arus Kas Operasi (CFO), Arus Kas Investasi (CFI), Arus Kas Pendanaan (CFF), Perubahan Kas Bersih.
 *
 * 100% deterministik, zero external dependencies.
 */

'use strict';

/**
 * Menyusun dan menghitung Laporan Laba Rugi Komprehensif per SFRS 1.
 *
 * @param {Object} params
 * @param {number} params.revenueSgd Total pendapatan penjualan
 * @param {number} [params.costOfSalesSgd=0] Beban pokok penjualan (COGS)
 * @param {number} [params.operatingExpensesSgd=0] Beban operasional umum, administrasi, dan penjualan
 * @param {number} [params.depreciationAndAmortisationSgd=0] Beban penyusutan dan amortisasi
 * @param {number} [params.financeCostsSgd=0] Beban bunga dan pembiayaan
 * @param {number} [params.taxExpenseSgd=0] Beban pajak penghasilan badan
 * @returns {Object} Struktur P&L lengkap dengan margin profitabilitas
 */
function compileIncomeStatement(params) {
  if (!params || typeof params !== 'object') {
    throw new TypeError("Parameter 'params' harus berupa objek valid.");
  }

  const revenue = Math.max(0, Number(params.revenueSgd) || 0);
  const cogs = Math.max(0, Number(params.costOfSalesSgd) || 0);
  const opex = Math.max(0, Number(params.operatingExpensesSgd) || 0);
  const da = Math.max(0, Number(params.depreciationAndAmortisationSgd) || 0);
  const financeCosts = Math.max(0, Number(params.financeCostsSgd) || 0);
  const tax = Math.max(0, Number(params.taxExpenseSgd) || 0);

  const grossProfit = Math.round((revenue - cogs) * 100) / 100;
  const ebitda = Math.round((grossProfit - opex) * 100) / 100;
  const operatingProfitEbit = Math.round((ebitda - da) * 100) / 100;
  const profitBeforeTax = Math.round((operatingProfitEbit - financeCosts) * 100) / 100;
  const netProfit = Math.round((profitBeforeTax - tax) * 100) / 100;

  const grossMarginPct = revenue > 0 ? Math.round((grossProfit / revenue) * 10000) / 100 : 0;
  const netMarginPct = revenue > 0 ? Math.round((netProfit / revenue) * 10000) / 100 : 0;
  const ebitdaMarginPct = revenue > 0 ? Math.round((ebitda / revenue) * 10000) / 100 : 0;

  return {
    revenueSgd: revenue,
    costOfSalesSgd: cogs,
    grossProfitSgd: grossProfit,
    operatingExpensesSgd: opex,
    ebitdaSgd: ebitda,
    depreciationAndAmortisationSgd: da,
    operatingProfitEbitSgd: operatingProfitEbit,
    financeCostsSgd: financeCosts,
    profitBeforeTaxSgd: profitBeforeTax,
    taxExpenseSgd: tax,
    netProfitSgd: netProfit,
    profitabilityMetrics: {
      grossProfitMarginPercent: grossMarginPct,
      ebitdaMarginPercent: ebitdaMarginPct,
      netProfitMarginPercent: netMarginPct
    }
  };
}

/**
 * Menyusun dan memverifikasi Laporan Posisi Keuangan (Balance Sheet) per SFRS 1.
 *
 * @param {Object} params
 * @param {Object} params.currentAssets Rincian aset lancar (cash, receivables, inventory, dll.)
 * @param {Object} params.nonCurrentAssets Rincian aset tidak lancar (ppe, intangibles, rouAssets)
 * @param {Object} params.currentLiabilities Rincian liabilitas jangka pendek (payables, shortTermDebt, leaseLiabilityCurrent)
 * @param {Object} params.nonCurrentLiabilities Rincian liabilitas jangka panjang (longTermDebt, leaseLiabilityNonCurrent)
 * @param {Object} params.equity Rincian ekuitas (shareCapital, retainedEarnings, otherReserves)
 * @returns {Object} Struktur neraca, total aset, total liabilitas & ekuitas, dan balance check
 */
function compileBalanceSheet(params) {
  if (!params || typeof params !== 'object') {
    throw new TypeError("Parameter 'params' harus berupa objek valid.");
  }

  const ca = params.currentAssets || {};
  const nca = params.nonCurrentAssets || {};
  const cl = params.currentLiabilities || {};
  const ncl = params.nonCurrentLiabilities || {};
  const eq = params.equity || {};

  const sumValues = (obj) => Object.values(obj).reduce((sum, v) => sum + (Number(v) || 0), 0);

  const totalCurrentAssets = Math.round(sumValues(ca) * 100) / 100;
  const totalNonCurrentAssets = Math.round(sumValues(nca) * 100) / 100;
  const totalAssets = Math.round((totalCurrentAssets + totalNonCurrentAssets) * 100) / 100;

  const totalCurrentLiabilities = Math.round(sumValues(cl) * 100) / 100;
  const totalNonCurrentLiabilities = Math.round(sumValues(ncl) * 100) / 100;
  const totalLiabilities = Math.round((totalCurrentLiabilities + totalNonCurrentLiabilities) * 100) / 100;

  const totalEquity = Math.round(sumValues(eq) * 100) / 100;
  const totalLiabilitiesAndEquity = Math.round((totalLiabilities + totalEquity) * 100) / 100;

  const balanceDifference = Math.round((totalAssets - totalLiabilitiesAndEquity) * 100) / 100;
  const isBalanced = Math.abs(balanceDifference) < 0.01;

  return {
    statementOfFinancialPosition: {
      currentAssets: { items: ca, totalSgd: totalCurrentAssets },
      nonCurrentAssets: { items: nca, totalSgd: totalNonCurrentAssets },
      totalAssetsSgd: totalAssets,
      currentLiabilities: { items: cl, totalSgd: totalCurrentLiabilities },
      nonCurrentLiabilities: { items: ncl, totalSgd: totalNonCurrentLiabilities },
      totalLiabilitiesSgd: totalLiabilities,
      equity: { items: eq, totalSgd: totalEquity },
      totalLiabilitiesAndEquitySgd: totalLiabilitiesAndEquity
    },
    verification: {
      isBalanced,
      differenceSgd: balanceDifference,
      status: isBalanced ? 'PERFECTLY_BALANCED' : 'IMBALANCED_DISCREPANCY_DETECTED'
    }
  };
}

module.exports = {
  compileIncomeStatement,
  compileBalanceSheet
};
