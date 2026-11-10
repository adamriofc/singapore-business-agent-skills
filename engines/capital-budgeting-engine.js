/**
 * Singapore Corporate Capital Budgeting & Investment Valuation Engine (`engines/capital-budgeting-engine.js`)
 *
 * Mengimplementasikan evaluasi penganggaran modal investasi korporat berbasis SORA & SFRS:
 *   - Net Present Value (NPV): Arus kas masa depan didiskontokan dengan hurdle rate (SORA/WACC).
 *   - Internal Rate of Return (IRR): Algoritma aproksimasi numerik konvergen deterministik.
 *   - Payback Period (Undiscounted Payback & Discounted Payback Period dalam tahun).
 *   - Profitability Index (PI / BCR: Benefit-Cost Ratio).
 *   - Keputusan Kelayakan Investasi (Accept/Reject Gate).
 *
 * 100% deterministik, zero external dependencies.
 */

'use strict';

/**
 * Menghitung Net Present Value (NPV).
 * Mendukung format:
 *   1. calculateNpv(discountRate, cashFlowsWithCf0)
 *   2. calculateNpv(initialOutflow, annualCashFlows, discountRate)
 *
 * @param {number} arg1 Tingkat diskonto desimal ATAU initialOutflow positif/negatif
 * @param {number[]} cashFlows Array arus kas
 * @param {number} [arg3] Tingkat diskonto desimal jika format ke-2
 * @returns {number} Nilai NPV dalam SGD dibulatkan 2 desimal
 */
function calculateNpv(arg1, cashFlows, arg3) {
  let discountRate = 0;
  let fullCfs = [];

  if (arg1 && typeof arg1 === 'object' && !Array.isArray(arg1)) {
    // Format Object: { initialOutlaySgd, annualCashFlowsSgd, discountRate }
    const initial = -Math.abs(Number(arg1.initialOutlaySgd || arg1.initialInvestmentSgd) || 0);
    discountRate = Number(arg1.discountRate || (arg1.discountRatePercent ? arg1.discountRatePercent / 100 : 0) || (arg1.hurdleDiscountRatePercent ? arg1.hurdleDiscountRatePercent / 100 : 0)) || 0;
    const cfs = Array.isArray(arg1.annualCashFlowsSgd || arg1.cashFlows) ? (arg1.annualCashFlowsSgd || arg1.cashFlows) : [];
    fullCfs = [initial, ...cfs];
  } else if (typeof arg3 === 'number') {
    // Format 2: (initialOutflow, annualCashFlows, discountRate)
    const initial = -Math.abs(Number(arg1) || 0);
    discountRate = Number(arg3) || 0;
    fullCfs = [initial, ...(Array.isArray(cashFlows) ? cashFlows : [])];
  } else {
    // Format 1: (discountRate, cashFlows)
    discountRate = Number(arg1) || 0;
    fullCfs = Array.isArray(cashFlows) ? cashFlows : [];
  }

  if (fullCfs.length === 0) return 0;
  let npv = 0;
  for (let t = 0; t < fullCfs.length; t++) {
    const cf = Number(fullCfs[t]) || 0;
    npv += cf / Math.pow(1 + discountRate, t);
  }
  return Math.round(npv * 100) / 100;
}

/**
 * Menghitung Internal Rate of Return (IRR) menggunakan bisection search deterministik.
 * Mendukung format:
 *   1. calculateIrr(cashFlowsWithCf0, tolerance, maxIterations)
 *   2. calculateIrr(initialOutflow, annualCashFlows)
 *
 * @param {number|number[]} arg1 Cash flows array ATAU initialOutflow
 * @param {number[]|number} [arg2] Annual cash flows array ATAU tolerance
 * @param {number} [maxIterations=100] Batas iterasi maksimal
 * @returns {number|null} Nilai IRR dalam bentuk desimal (misal 0.145 untuk 14.5%) atau null jika tidak konvergen
 */
function calculateIrr(arg1, arg2, maxIterations = 100) {
  let fullCfs = [];
  let tolerance = 0.00001;

  if (arg1 && typeof arg1 === 'object' && !Array.isArray(arg1)) {
    // Format Object: { initialOutlaySgd, annualCashFlowsSgd }
    const initial = -Math.abs(Number(arg1.initialOutlaySgd || arg1.initialInvestmentSgd) || 0);
    const cfs = Array.isArray(arg1.annualCashFlowsSgd || arg1.cashFlows) ? (arg1.annualCashFlowsSgd || arg1.cashFlows) : [];
    fullCfs = [initial, ...cfs];
    if (typeof arg1.tolerance === 'number') tolerance = arg1.tolerance;
  } else if (typeof arg1 === 'number' && Array.isArray(arg2)) {
    // Format 2: (initialOutflow, annualCashFlows)
    const initial = -Math.abs(Number(arg1) || 0);
    fullCfs = [initial, ...arg2];
  } else if (Array.isArray(arg1)) {
    // Format 1: (cashFlows, tolerance, maxIterations)
    fullCfs = arg1;
    if (typeof arg2 === 'number') tolerance = arg2;
  } else {
    return null;
  }

  if (fullCfs.length < 2) return null;

  // Cek minimal 1 arus kas negatif dan 1 positif
  const hasNegative = fullCfs.some(cf => cf < 0);
  const hasPositive = fullCfs.some(cf => cf > 0);
  if (!hasNegative || !hasPositive) return null;

  let lowRate = -0.9999;
  let highRate = 5.0; // 500%

  for (let i = 0; i < maxIterations; i++) {
    const midRate = (lowRate + highRate) / 2;
    const npv = calculateNpv(midRate, fullCfs);

    if (Math.abs(npv) < tolerance) {
      return Math.round(midRate * 10000) / 10000;
    }

    if (npv > 0) {
      lowRate = midRate;
    } else {
      highRate = midRate;
    }
  }

  return Math.round(((lowRate + highRate) / 2) * 10000) / 10000;
}

/**
 * Menghitung Payback Period (Undiscounted & Discounted).
 *
 * @param {number} discountRate Tingkat diskonto tahunan
 * @param {number[]} cashFlows Array arus kas [CF0, CF1, ...]
 * @returns {Object} Payback period dalam tahun
 */
function calculatePaybackPeriod(discountRate, cashFlows) {
  if (discountRate && typeof discountRate === 'object' && !Array.isArray(discountRate)) {
    const p = discountRate;
    const initial = -Math.abs(Number(p.initialOutlaySgd || p.initialInvestmentSgd) || 0);
    const cfs = Array.isArray(p.annualCashFlowsSgd || p.cashFlows) ? (p.annualCashFlowsSgd || p.cashFlows) : [];
    cashFlows = [initial, ...cfs];
    discountRate = Number(p.discountRate || (p.discountRatePercent ? p.discountRatePercent / 100 : 0)) || 0;
  }

  if (!Array.isArray(cashFlows) || cashFlows.length < 2) {
    return { undiscountedPaybackYears: null, discountedPaybackYears: null };
  }

  const initialOutlay = Math.abs(Number(cashFlows[0]) || 0);

  // 1. Undiscounted
  let cumulative = 0;
  let undiscountedPayback = null;
  for (let t = 1; t < cashFlows.length; t++) {
    const cf = Number(cashFlows[t]) || 0;
    if (cumulative + cf >= initialOutlay) {
      const remainingNeeded = initialOutlay - cumulative;
      undiscountedPayback = Math.round(((t - 1) + (remainingNeeded / cf)) * 100) / 100;
      break;
    }
    cumulative += cf;
  }

  // 2. Discounted
  let discountedCumulative = 0;
  let discountedPayback = null;
  for (let t = 1; t < cashFlows.length; t++) {
    const pvCf = (Number(cashFlows[t]) || 0) / Math.pow(1 + discountRate, t);
    if (discountedCumulative + pvCf >= initialOutlay) {
      const remainingNeeded = initialOutlay - discountedCumulative;
      discountedPayback = Math.round(((t - 1) + (remainingNeeded / pvCf)) * 100) / 100;
      break;
    }
    discountedCumulative += pvCf;
  }

  return {
    undiscountedPaybackYears: undiscountedPayback,
    discountedPaybackYears: discountedPayback
  };
}

/**
 * Mengevaluasi proyek investasi secara komprehensif.
 *
 * @param {Object} params
 * @param {string} [params.projectName='Project Investment'] Nama proyek
 * @param {number} params.discountRate Tingkat diskonto hurdle rate (misal: 0.075 untuk 7.5% WACC)
 * @param {number} params.initialInvestmentSgd Modal investasi awal (nilai positif, akan dijadikan outflow CF0)
 * @param {number[]} params.annualCashFlowsSgd Arus kas masuk bersih per tahun [Tahun 1, Tahun 2, ...]
 * @returns {Object} Metrik NPV, IRR, Payback, PI, dan keputusan investasi
 */
function evaluateCapitalInvestment(params) {
  if (!params || typeof params !== 'object') {
    throw new TypeError("Parameter 'params' harus berupa objek valid.");
  }

  const name = String(params.projectName || 'Capital Project').trim();
  const rate = Math.max(0, Number(params.discountRate) || 0.08);
  const initial = Math.abs(Number(params.initialInvestmentSgd) || 0);
  const flows = Array.isArray(params.annualCashFlowsSgd) ? params.annualCashFlowsSgd : [];

  const fullCashFlows = [-initial, ...flows.map(v => Number(v) || 0)];

  const npv = calculateNpv(rate, fullCashFlows);
  const irr = calculateIrr(fullCashFlows);
  const payback = calculatePaybackPeriod(rate, fullCashFlows);

  // Present Value of future inflows
  let pvFutureInflows = 0;
  for (let t = 1; t < fullCashFlows.length; t++) {
    pvFutureInflows += fullCashFlows[t] / Math.pow(1 + rate, t);
  }
  const profitabilityIndex = initial > 0 ? Math.round((pvFutureInflows / initial) * 100) / 100 : 0;

  const isAcceptable = npv > 0 && (irr !== null ? irr > rate : true);

  return {
    projectName: name,
    hurdleRatePercent: Math.round(rate * 10000) / 100,
    initialInvestmentSgd: initial,
    evaluationMetrics: {
      netPresentValueSgd: npv,
      internalRateOfReturnPercent: irr !== null ? Math.round(irr * 10000) / 100 : null,
      profitabilityIndex,
      undiscountedPaybackYears: payback.undiscountedPaybackYears,
      discountedPaybackYears: payback.discountedPaybackYears
    },
    investmentDecision: {
      isAcceptable,
      verdict: isAcceptable ? 'ACCEPT_PROJECT' : 'REJECT_PROJECT',
      reasoning: isAcceptable
        ? `Proyek menghasilkan NPV positif (+S$${npv.toLocaleString()}) dengan IRR (${irr !== null ? (irr * 100).toFixed(2) + '%' : 'N/A'}) melampaui hurdle rate (${(rate * 100).toFixed(2)}%).`
        : `Proyek tidak layak: NPV bernilai negatif (S$${npv.toLocaleString()}) atau IRR berada di bawah hurdle rate.`
    }
  };
}

module.exports = {
  calculateNpv,
  calculateIrr,
  calculatePaybackPeriod,
  evaluateCapitalInvestment
};
