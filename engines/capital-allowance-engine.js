/**
 * Singapore Capital Allowance (Plant and Machinery) Engine (`engines/capital-allowance-engine.js`)
 *
 * Mengimplementasikan kalkulasi penyusutan fiskal (Capital Allowances / CA) untuk pabrik dan mesin
 * (Plant & Machinery) berdasarkan Sections 19 dan 19A Income Tax Act 1947:
 *   - Section 19A(1): Accelerated 3-Year Write-off (33.33% per tahun).
 *   - Section 19A(2): 1-Year 100% Immediate Write-off (Komputer, perangkat lunak, dan aset otomatisasi).
 *   - Section 19A(10A): Aset bernilai rendah (Low-Value Assets <= S$5.000 per item) dengan batas pagu
 *     agregat S$30.000 per Tahun Pajak (YA).
 *   - Section 19: Penyusutan standar (Initial Allowance 20% + Annual Allowance berkala).
 *   - Perhitungan Balancing Allowance (BA) atau Balancing Charge (BC) pada saat pelepasan/penjualan aset.
 *
 * 100% deterministik, zero external dependencies.
 */

'use strict';

const LOW_VALUE_ASSET_UNIT_LIMIT = 5000;  // Batas per unit aset bernilai rendah: S$5,000
const LOW_VALUE_ASSET_ANNUAL_CAP = 30000; // Pagu agregat per YA: S$30,000

/**
 * Menghitung klaim Capital Allowance untuk portofolio perolehan aset tetap tahun berjalan.
 *
 * @param {Object} params
 * @param {Array<Object>} params.assets Daftar aset yang diakuisisi
 *   Contoh item: {
 *     description: 'Laptops',
 *     costSgd: 12000,
 *     scheme: '19A_1YR' | '19A_3YR' | 'LOW_VALUE' | 'SECTION_19',
 *     quantity: 4, // jika LOW_VALUE, unit cost = costSgd / quantity
 *     annualAllowanceRate: 0.10 // jika SECTION_19
 *   }
 * @returns {Object} Rincian klaim penyusutan fiskal tahun berjalan dan sisa unabsorbed CA
 */
function calculateCapitalAllowances(params) {
  if (!params || typeof params !== 'object') {
    throw new TypeError("Parameter 'params' harus berupa objek valid.");
  }

  const assets = Array.isArray(params.assets) ? params.assets : [];
  let totalCost = 0;
  let totalCurrentYearClaim = 0;
  let lowValuePoolClaimed = 0;

  const itemizedClaims = [];

  for (const asset of assets) {
    const cost = Math.max(0, Number(asset.costSgd) || 0);
    const scheme = String(asset.scheme || '19A_3YR').toUpperCase().trim();
    totalCost += cost;

    let claimYear1 = 0;
    let subsequentYearsClaim = 0;
    let remarks = '';

    if (scheme === '19A_1YR' || scheme === '100%') {
      // 100% write-off di Tahun 1
      claimYear1 = cost;
      remarks = 'Section 19A(2) 100% 1-Year write-off untuk komputer/otomatisasi.';
    } else if (scheme === 'LOW_VALUE') {
      // Periksa apakah unit cost <= S$5,000
      const qty = Math.max(1, Number(asset.quantity) || 1);
      const unitCost = cost / qty;

      if (unitCost <= LOW_VALUE_ASSET_UNIT_LIMIT) {
        const remainingCap = Math.max(0, LOW_VALUE_ASSET_ANNUAL_CAP - lowValuePoolClaimed);
        claimYear1 = Math.min(cost, remainingCap);
        lowValuePoolClaimed += claimYear1;
        const excessCost = cost - claimYear1;
        if (excessCost > 0) {
          remarks = `Section 19A(10A): S$${claimYear1} diklaim 100%, sisa S$${excessCost} melebihi pagu tahunan S$30.000.`;
        } else {
          remarks = 'Section 19A(10A): 100% diklaim di bawah pagu S$30.000.';
        }
      } else {
        // Jika melebihi unit limit S$5,000, alihkan ke 3-year write-off
        claimYear1 = Number((cost * (1 / 3)).toFixed(2));
        subsequentYearsClaim = claimYear1;
        remarks = 'Unit cost > S$5.000; dialihkan ke skema Section 19A 3-year write-off.';
      }
    } else if (scheme === 'SECTION_19') {
      // Standard Section 19: Initial Allowance 20% + Annual Allowance
      const aaRate = Number(asset.annualAllowanceRate) || 0.10;
      const initialAllowance = cost * 0.20;
      const annualAllowance = cost * aaRate;
      claimYear1 = Number((initialAllowance + annualAllowance).toFixed(2));
      subsequentYearsClaim = Number(annualAllowance.toFixed(2));
      remarks = `Section 19: Initial Allowance 20% + Annual Allowance ${(aaRate * 100).toFixed(1)}%.`;
    } else {
      // Default: Section 19A 3-Year Write-off (33.33% per tahun)
      claimYear1 = Number((cost * (1 / 3)).toFixed(2));
      subsequentYearsClaim = claimYear1;
      remarks = 'Section 19A(1) 3-year write-off (33.33% p.a.).';
    }

    totalCurrentYearClaim += claimYear1;

    itemizedClaims.push({
      description: asset.description || 'Asset',
      scheme,
      costSgd: cost,
      currentYearClaimSgd: claimYear1,
      subsequentYearsAnnualClaimSgd: subsequentYearsClaim,
      taxWrittenDownValueClosingSgd: Math.max(0, cost - claimYear1),
      remarks
    });
  }

  return {
    summary: {
      totalAssetAdditionsCostSgd: totalCost,
      totalCapitalAllowancesClaimedSgd: Number(totalCurrentYearClaim.toFixed(2)),
      lowValueAssetsClaimedSgd: lowValuePoolClaimed,
      lowValueAnnualCapSgd: LOW_VALUE_ASSET_ANNUAL_CAP
    },
    itemizedClaims
  };
}

/**
 * Menghitung Balancing Adjustment (Balancing Charge atau Balancing Allowance) pada pelepasan aset.
 * @param {Object} params
 * @param {number} params.originalCostSgd Harga perolehan awal
 * @param {number} params.taxWrittenDownValueSgd Nilai sisa buku fiskal saat pelepasan
 * @param {number} params.saleProceedsSgd Nilai penerimaan penjualan/pelepasan aset
 * @returns {Object}
 */
function calculateBalancingAdjustment(params) {
  const cost = Math.max(0, Number(params.originalCostSgd) || 0);
  const twdv = Math.max(0, Number(params.taxWrittenDownValueSgd) || 0);
  const proceeds = Math.max(0, Number(params.saleProceedsSgd) || 0);

  if (proceeds > twdv) {
    // Balancing Charge (kena pajak), dibatasi tidak melebihi total CA yang pernah diklaim
    const totalAllowancesClaimed = cost - twdv;
    const grossBc = proceeds - twdv;
    const balancingCharge = Math.min(grossBc, totalAllowancesClaimed);

    return {
      type: 'BALANCING_CHARGE',
      amountSgd: Number(balancingCharge.toFixed(2)),
      taxImplication: 'Menambah penghasilan kena pajak (taxable income).'
    };
  } else if (proceeds < twdv) {
    // Balancing Allowance (pengurang pajak)
    const balancingAllowance = twdv - proceeds;
    return {
      type: 'BALANCING_ALLOWANCE',
      amountSgd: Number(balancingAllowance.toFixed(2)),
      taxImplication: 'Mengurangi penghasilan kena pajak sebagai deduction tambahan.'
    };
  }

  return {
    type: 'NIL',
    amountSgd: 0,
    taxImplication: 'Penerimaan penjualan sama persis dengan TWDV fiskal.'
  };
}

module.exports = {
  calculateCapitalAllowances,
  calculateBalancingAdjustment,
  LOW_VALUE_ASSET_UNIT_LIMIT,
  LOW_VALUE_ASSET_ANNUAL_CAP
};
