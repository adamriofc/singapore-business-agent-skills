/**
 * Singapore SFRS 2 Inventory Valuation & NRV Engine (`engines/inventory-valuation-engine.js`)
 *
 * Mengimplementasikan penilaian persediaan berdasarkan SFRS 2 Inventories dan ketentuan pajak IRAS:
 *   - Metode Penilaian Biaya Persediaan:
 *       * FIFO (First-In, First-Out).
 *       * Weighted Average Cost (WAC).
 *       * LARANGAN STATUTER: Metode LIFO dilarang keras oleh SFRS 2 dan IRAS.
 *   - Aturan Nilai Terendah antara Biaya dan Nilai Realisasi Bersih (Lower of Cost and Net Realisable Value - NRV):
 *       * NRV = Estimated Selling Price in Ordinary Course of Business - Estimated Costs of Completion & Sale.
 *       * Pengakuan Beban Penurunan Nilai Persediaan (Inventory Write-Down) pada Laba Rugi.
 *   - Pembalikan Penurunan Nilai Persediaan (Reversal of Write-Down).
 *
 * 100% deterministik, zero external dependencies.
 */

'use strict';

/**
 * Menghitung penilaian persediaan menggunakan metode FIFO dari batch pembelian dan penjualan.
 * Mendukung 2 bentuk pemanggilan:
 *   1. calculateFifoInventory(purchaseBatches, unitsSold)
 *   2. calculateFifoInventory({ purchases, unitsSold })
 *
 * @param {Array|Object} arg1 Batch pembelian persediaan ATAU objek parameter
 * @param {number} [arg2] Jumlah unit yang terjual jika arg1 berupa array
 * @returns {Object} COGS FIFO, Nilai Persediaan Akhir, dan Sisa Batch
 */
function calculateFifoInventory(arg1, arg2) {
  let rawBatches = [];
  let unitsSold = 0;

  if (Array.isArray(arg1)) {
    rawBatches = arg1;
    unitsSold = Math.max(0, Number(arg2) || 0);
  } else if (arg1 && typeof arg1 === 'object') {
    rawBatches = arg1.purchases || arg1.purchaseBatches || [];
    unitsSold = Math.max(0, Number(arg1.unitsSold) || 0);
  }

  const batches = rawBatches.map(b => ({
    units: Math.max(0, Number(b.units) || 0),
    costPerUnitSgd: Math.max(0, Number(b.costPerUnitSgd !== undefined ? b.costPerUnitSgd : b.unitCostSgd) || 0)
  }));
  let remainingUnitsToSell = unitsSold;

  let cogs = 0;

  for (let i = 0; i < batches.length; i++) {
    if (remainingUnitsToSell <= 0) break;
    const batch = batches[i];
    const available = batch.units;
    const cost = batch.costPerUnitSgd;

    const unitsToDeduct = Math.min(available, remainingUnitsToSell);
    cogs += unitsToDeduct * cost;
    batch.units -= unitsToDeduct;
    remainingUnitsToSell -= unitsToDeduct;
  }

  let endingInventoryValue = 0;
  let endingInventoryUnits = 0;

  for (const batch of batches) {
    if (batch.units > 0) {
      endingInventoryUnits += batch.units;
      endingInventoryValue += batch.units * batch.costPerUnitSgd;
    }
  }

  return {
    method: 'FIFO',
    unitsSold,
    costOfGoodsSoldSgd: Math.round(cogs * 100) / 100,
    endingInventoryUnits,
    endingInventoryValueSgd: Math.round(endingInventoryValue * 100) / 100,
    remainingBatches: batches.filter(b => b.units > 0)
  };
}

/**
 * Menghitung penilaian persediaan menggunakan metode Rata-Rata Tertimbang (Weighted Average Cost - WAC).
 * Mendukung 2 bentuk pemanggilan:
 *   1. calculateWeightedAverageInventory(purchaseBatches, unitsSold)
 *   2. calculateWeightedAverageInventory({ purchases, unitsSold })
 *
 * @param {Array|Object} arg1 Batch persediaan ATAU objek parameter
 * @param {number} [arg2] Jumlah unit yang terjual jika arg1 berupa array
 * @returns {Object} Weighted Average Cost per unit, COGS, dan Nilai Persediaan Akhir
 */
function calculateWeightedAverageInventory(arg1, arg2) {
  let rawBatches = [];
  let unitsSold = 0;

  if (Array.isArray(arg1)) {
    rawBatches = arg1;
    unitsSold = Math.max(0, Number(arg2) || 0);
  } else if (arg1 && typeof arg1 === 'object') {
    rawBatches = arg1.purchases || arg1.purchaseBatches || [];
    unitsSold = Math.max(0, Number(arg1.unitsSold) || 0);
  }

  const batches = rawBatches.map(b => ({
    units: Math.max(0, Number(b.units) || 0),
    costPerUnitSgd: Math.max(0, Number(b.costPerUnitSgd !== undefined ? b.costPerUnitSgd : b.unitCostSgd) || 0)
  }));
  const sold = unitsSold;

  let totalUnits = 0;
  let totalCost = 0;

  for (const b of batches) {
    const u = b.units;
    const c = b.costPerUnitSgd;
    totalUnits += u;
    totalCost += u * c;
  }

  if (totalUnits === 0) {
    return {
      method: 'WEIGHTED_AVERAGE',
      unitsSold: 0,
      averageUnitCostSgd: 0,
      weightedAverageCostPerUnitSgd: 0,
      costOfGoodsSoldSgd: 0,
      endingInventoryUnits: 0,
      endingInventoryValueSgd: 0
    };
  }

  const averageCostPerUnit = Math.round((totalCost / totalUnits) * 10000) / 10000;
  const actualSoldUnits = Math.min(totalUnits, sold);
  const endingUnits = totalUnits - actualSoldUnits;

  const cogs = Math.round(actualSoldUnits * averageCostPerUnit * 100) / 100;
  const endingValue = Math.round(endingUnits * averageCostPerUnit * 100) / 100;

  return {
    method: 'WEIGHTED_AVERAGE',
    unitsSold: actualSoldUnits,
    averageUnitCostSgd: averageCostPerUnit,
    weightedAverageCostPerUnitSgd: averageCostPerUnit,
    costOfGoodsSoldSgd: cogs,
    endingInventoryUnits: endingUnits,
    endingInventoryValueSgd: endingValue
  };
}

/**
 * Mengevaluasi aturan Lower of Cost and Net Realisable Value (NRV) sesuai SFRS 2.
 *
 * @param {Object} params
 * @param {number} params.inventoryCostSgd Nilai buku perolehan persediaan (SGD)
 * @param {number} params.estimatedSellingPriceSgd Estimasi harga jual dalam kondisi normal (SGD)
 * @param {number} [params.estimatedCompletionCostSgd=0] Estimasi biaya penyelesaian produk (SGD)
 * @param {number} [params.estimatedSellingExpenseSgd=0] Estimasi biaya pemasaran dan distribusi untuk menjual (SGD)
 * @returns {Object} Nilai NRV, nilai persediaan akhir di neraca, dan jumlah penurunan nilai (write-down)
 */
function evaluateLowerOfCostAndNrv(params) {
  if (!params || typeof params !== 'object') {
    throw new TypeError("Parameter 'params' harus berupa objek valid.");
  }

  const cost = Math.max(0, Number(params.inventoryCostSgd) || 0);
  const sellingPrice = Math.max(0, Number(params.estimatedSellingPriceSgd) || 0);
  const completionCost = Math.max(0, Number(params.estimatedCompletionCostSgd) || 0);
  const sellingExpense = Math.max(0, Number(params.estimatedSellingExpenseSgd) || 0);

  const nrv = Math.max(0, Math.round((sellingPrice - completionCost - sellingExpense) * 100) / 100);

  const isNrvLower = nrv < cost;
  const writeDownAmountSgd = isNrvLower ? Math.round((cost - nrv) * 100) / 100 : 0;
  const finalCarryingValueSgd = isNrvLower ? nrv : cost;

  return {
    costSgd: cost,
    netRealisableValueSgd: nrv,
    finalCarryingValueBalanceSheetSgd: finalCarryingValueSgd,
    isWriteDownRequired: isNrvLower,
    inventoryWriteDownExpenseSgd: writeDownAmountSgd,
    sfrsComplianceNote: isNrvLower
      ? `NRV (S$${nrv.toLocaleString()}) lebih rendah daripada biaya perolehan (S$${cost.toLocaleString()}). Penurunan nilai persediaan sebesar S$${writeDownAmountSgd.toLocaleString()} wajib diakui sebagai beban di Laba Rugi.`
      : `Biaya perolehan (S$${cost.toLocaleString()}) lebih rendah atau sama dengan NRV (S$${nrv.toLocaleString()}). Persediaan dicatat penuh pada nilai biaya perolehan.`
  };
}

module.exports = {
  calculateFifoInventory,
  calculateWeightedAverageInventory,
  evaluateLowerOfCostAndNrv
};
