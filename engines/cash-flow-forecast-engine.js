/**
 * Singapore Direct Cash Flow Forecasting & Runway Engine (`engines/cash-flow-forecast-engine.js`)
 *
 * Mengimplementasikan proyeksi arus kas langsung 13-minggu (Rolling 13-Week Cash Flow Forecast)
 * dan analisis ketahanan kas (Cash Runway & Burn Rate) untuk korporasi dan UKM Singapura:
 *   - Proyeksi Saldo Kas Mingguan (Starting Cash, Inflows, Outflows, Net Cash Flow, Ending Cash).
 *   - Analisis Burn Rate:
 *       * Gross Burn Rate: Total pengeluaran kas bulanan tanpa memperhitungkan pemasukan.
 *       * Net Burn Rate: Defisit kas bersih bulanan (Pengeluaran - Pemasukan).
 *   - Cash Runway (Jumlah bulan kas bertahan sebelum mencapai nol).
 *   - Deteksi Titik Nadir Kas (Minimum Cash Dip) dan Peringatan Insolvensi Arus Kas.
 *
 * 100% deterministik, zero external dependencies.
 */

'use strict';

/**
 * Menghitung proyeksi arus kas rolling mingguan dan indikator runway.
 *
 * @param {Object} params
 * @param {number} params.startingCashBalanceSgd Saldo kas awal dalam SGD
 * @param {Array<{ weekNumber: number, projectedInflowSgd: number, projectedOutflowSgd: number }>} params.weeklyForecasts Proyeksi arus kas mingguan
 * @param {number} [params.minimumCashReserveSgd=10000] Batas aman cadangan kas minimum
 * @returns {Object} Rincian tabel 13 minggu, burn rate bulanan, runway, dan deteksi risiko likuiditas
 */
function forecastWeeklyCashFlow(params) {
  if (!params || typeof params !== 'object') {
    throw new TypeError("Parameter 'params' harus berupa objek valid.");
  }

  const startingCash = Math.max(0, Number(params.startingCashBalanceSgd) || 0);
  const minReserve = Math.max(0, Number(params.minimumCashReserveSgd) || 10000);
  const forecasts = Array.isArray(params.weeklyForecasts) ? params.weeklyForecasts : [];

  let runningBalance = startingCash;
  let minBalance = startingCash;
  let minBalanceWeek = 0;
  let totalInflows = 0;
  let totalOutflows = 0;

  const weeklySchedule = [];
  const deficitWeeks = [];

  for (let i = 0; i < forecasts.length; i++) {
    const item = forecasts[i];
    const week = Number(item.weekNumber) || (i + 1);
    let inflow = Math.max(0, Number(item.projectedInflowSgd !== undefined ? item.projectedInflowSgd : (item.inflowSgd !== undefined ? item.inflowSgd : item.operatingReceiptsSgd)) || 0);
    let outflow = 0;
    if (item.projectedOutflowSgd !== undefined) {
      outflow = Math.max(0, Number(item.projectedOutflowSgd) || 0);
    } else if (item.outflowSgd !== undefined) {
      outflow = Math.max(0, Number(item.outflowSgd) || 0);
    } else {
      const payroll = Math.max(0, Number(item.payrollAndLeviesSgd) || 0);
      const rent = Math.max(0, Number(item.rentAndUtilitiesSgd) || 0);
      const cogs = Math.max(0, Number(item.supplierPaymentsSgd || item.cogsSgd) || 0);
      const other = Math.max(0, Number(item.otherExpensesSgd) || 0);
      outflow = payroll + rent + cogs + other;
    }
    const netFlow = Math.round((inflow - outflow) * 100) / 100;

    const opening = runningBalance;
    runningBalance = Math.round((runningBalance + netFlow) * 100) / 100;

    totalInflows += inflow;
    totalOutflows += outflow;

    if (runningBalance < minBalance) {
      minBalance = runningBalance;
      minBalanceWeek = week;
    }

    if (runningBalance < minReserve) {
      deficitWeeks.push({
        weekNumber: week,
        endingBalanceSgd: runningBalance,
        deficitBelowReserveSgd: Math.round((minReserve - runningBalance) * 100) / 100
      });
    }

    weeklySchedule.push({
      weekNumber: week,
      openingBalanceSgd: opening,
      inflowSgd: inflow,
      outflowSgd: outflow,
      netCashFlowSgd: netFlow,
      closingBalanceSgd: runningBalance
    });
  }

  const weekCount = Math.max(1, forecasts.length);
  const monthsEquivalent = weekCount / 4.33;

  const monthlyGrossBurnRate = Math.round((totalOutflows / monthsEquivalent) * 100) / 100;
  const netMonthlyDeficit = (totalOutflows - totalInflows) / monthsEquivalent;
  const monthlyNetBurnRate = Math.max(0, Math.round(netMonthlyDeficit * 100) / 100);

  let cashRunwayMonths = null;
  if (monthlyNetBurnRate > 0) {
    cashRunwayMonths = Math.round((startingCash / monthlyNetBurnRate) * 10) / 10;
  } else {
    cashRunwayMonths = 999; // Arus kas net positif / mandiri
  }

  const isSolvent = runningBalance >= 0;
  const hasBreachedReserve = deficitWeeks.length > 0;

  return {
    startingCashBalanceSgd: startingCash,
    endingCashBalanceSgd: runningBalance,
    totalProjectedInflowsSgd: Math.round(totalInflows * 100) / 100,
    totalProjectedOutflowsSgd: Math.round(totalOutflows * 100) / 100,
    burnRateAnalysis: {
      averageMonthlyGrossBurnSgd: monthlyGrossBurnRate,
      averageMonthlyNetBurnSgd: monthlyNetBurnRate,
      cashRunwayMonths: cashRunwayMonths === 999 ? 'CASH_FLOW_POSITIVE' : cashRunwayMonths
    },
    minimumCashPoint: {
      lowestBalanceSgd: minBalance,
      occurredInWeekNumber: minBalanceWeek,
      isDeficit: minBalance < 0
    },
    liquidityRiskAssessment: {
      isSolventThroughoutPeriod: isSolvent && minBalance >= 0,
      hasBreachedMinimumReserve: hasBreachedReserve,
      totalWeeksBelowReserve: deficitWeeks.length,
      deficitAlerts: deficitWeeks
    },
    weeklySchedule
  };
}

module.exports = {
  forecastWeeklyCashFlow
};
