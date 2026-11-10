/**
 * Singapore ACRA Company Striking Off Engine (`engines/striking-off-engine.js`)
 *
 * Mengimplementasikan evaluasi kelayakan dan audit prosedur penutupan perusahaan secara sukarela
 * (Application to Strike Off Company) di bawah Section 344A Companies Act 1967 yang diawasi oleh ACRA:
 *   - 7 Kriteria Kelayakan Statuter ACRA (Section 344A):
 *       1. Telah berhenti beroperasi atau tidak pernah memulai kegiatan usaha.
 *       2. Tidak memiliki aset dan liabilitas (No assets and liabilities - zero balance sheet).
 *       3. Tidak terlibat dalam proses litigasi pengadilan atau proses kepailitan yang sedang berlangsung.
 *       4. Tidak memiliki utang tertunggak kepada instansi pemerintah Singapura (IRAS, CPF Board, MOM, dll.).
 *       5. Telah memperoleh Tax Clearance resmi dari IRAS (Penyelesaian Form C-S/C & penutupan akun GST).
 *       6. Rekening bank korporat telah ditutup secara resmi (Zero bank balance & closed account).
 *       7. Telah disetujui oleh mayoritas pemegang saham (Shareholder written resolution).
 *   - Jadwal Linimasa Publikasi Warta Pemerintah (Government Gazette Timeline):
 *       * Penerbitan First Gazette Notice (Pemberitahuan Pertama di Warta).
 *       * Masa tunggu keberatan pihak ketiga (Objection Period: 60 hari statuter).
 *       * Penerbitan Final Gazette Notice (Pencoretan nama resmi: ~4-5 bulan dari pengajuan).
 *   - Skor Kesiapan Penutupan (0 - 100) dan Daftar Periksa Tindakan Pra-Pengajuan.
 *
 * 100% deterministik, zero external dependencies.
 */

'use strict';

const STRIKING_OFF_STATUTORY_REQUIREMENTS = [
  { id: 'CEASED_TRADING', name: 'Ceased Trading / Dormant', weight: 15 },
  { id: 'ZERO_ASSETS_LIABILITIES', name: 'Zero Assets and Liabilities', weight: 20 },
  { id: 'IRAS_TAX_CLEARANCE', name: 'IRAS Tax Clearance Obtained', weight: 20 },
  { id: 'BANK_ACCOUNT_CLOSED', name: 'Corporate Bank Account Officially Closed', weight: 15 },
  { id: 'NO_OUTSTANDING_STATUTORY_DEBTS', name: 'No Debts to IRAS, CPF, MOM, or ACRA', weight: 15 },
  { id: 'NO_PENDING_LEGAL_PROCEEDINGS', name: 'No Pending Litigation / Court Actions', weight: 10 },
  { id: 'SHAREHOLDER_APPROVAL', name: 'Majority Shareholder Approval Resolution', weight: 5 }
];

const GAZETTE_TIMELINE = {
  FIRST_GAZETTE_NOTICE_WEEKS: 4,
  OBJECTION_PERIOD_DAYS: 60,
  FINAL_GAZETTE_NOTICE_MONTHS: 4
};

/**
 * Mengevaluasi kesiapan dan kelayakan perusahaan untuk pengajuan Striking Off di ACRA.
 *
 * @param {Object} params
 * @param {boolean} [params.hasCeasedTrading=true] Apakah perusahaan telah berhenti beroperasi
 * @param {number} [params.totalAssetsSgd=0] Total nilai aset tersisa (harus 0)
 * @param {number} [params.totalLiabilitiesSgd=0] Total kewajiban/utang tersisa (harus 0)
 * @param {boolean} [params.hasIrasTaxClearance=false] Apakah telah memperoleh surat bebas pajak IRAS
 * @param {boolean} [params.isBankAccountClosed=false] Apakah rekening bank telah resmi ditutup
 * @param {boolean} [params.hasOutstandingTaxOrLevy=false] Apakah ada utang pajak, CPF, atau FWL tertunggak
 * @param {boolean} [params.hasPendingLegalAction=false] Apakah ada perkara hukum yang sedang berjalan
 * @param {boolean} [params.hasShareholderApproval=true] Apakah telah disetujui pemegang saham
 * @returns {Object} Skor kesiapan, status kelayakan statuter, hambatan yang belum selesai, dan linimasa warta
 */
function evaluateStrikingOffReadiness(params) {
  if (!params || typeof params !== 'object') {
    throw new TypeError("Parameter 'params' harus berupa objek valid.");
  }

  // Resolusi ceased trading: jika hasCommencedBusiness false, berarti dormant/tidak beroperasi
  let hasCeased = true;
  if (params.hasCeasedTrading !== undefined) {
    hasCeased = Boolean(params.hasCeasedTrading);
  } else if (params.hasCommencedBusiness !== undefined) {
    hasCeased = !Boolean(params.hasCommencedBusiness);
  }

  const assets = Math.max(0, Number(params.totalAssetsSgd) || 0);
  const liabilities = Math.max(0, Number(params.totalLiabilitiesSgd) || 0);

  // Resolusi IRAS tax clearance
  let hasTaxClearance = false;
  if (params.hasIrasTaxClearance !== undefined) {
    hasTaxClearance = Boolean(params.hasIrasTaxClearance);
  } else if (params.hasOutstandingIrasTaxMatters !== undefined) {
    hasTaxClearance = !Boolean(params.hasOutstandingIrasTaxMatters);
  }

  // Resolusi penutupan rekening bank
  let isBankClosed = false;
  if (params.isBankAccountClosed !== undefined) {
    isBankClosed = Boolean(params.isBankAccountClosed);
  } else if (params.hasActiveBankAccounts !== undefined) {
    isBankClosed = !Boolean(params.hasActiveBankAccounts);
  }

  // Resolusi utang tertunggak pemerintah / pihak ketiga
  let hasDebts = false;
  if (params.hasOutstandingTaxOrLevy !== undefined) {
    hasDebts = Boolean(params.hasOutstandingTaxOrLevy);
  } else if (params.hasOutstandingDebtsToGovernmentOrThirdParties !== undefined) {
    hasDebts = Boolean(params.hasOutstandingDebtsToGovernmentOrThirdParties);
  }

  // Resolusi perkara hukum
  let hasLitigation = false;
  if (params.hasPendingLegalAction !== undefined) {
    hasLitigation = Boolean(params.hasPendingLegalAction);
  } else if (params.hasOngoingLitigation !== undefined) {
    hasLitigation = Boolean(params.hasOngoingLitigation);
  }

  // Resolusi persetujuan pemegang saham
  let hasApproval = true;
  if (params.hasShareholderApproval !== undefined) {
    hasApproval = Boolean(params.hasShareholderApproval);
  } else if (params.hasMajorityShareholderApproval !== undefined) {
    hasApproval = Boolean(params.hasMajorityShareholderApproval);
  }

  const blockers = [];
  let score = 0;

  // 1. Ceased trading
  if (hasCeased) {
    score += 15;
  } else {
    blockers.push("Perusahaan masih aktif beroperasi. Seluruh kegiatan bisnis harus dihentikan terlebih dahulu.");
  }

  // 2. Zero assets & liabilities
  if (assets === 0 && liabilities === 0) {
    score += 20;
  } else {
    blockers.push(`Neraca belum nihil: Sisa aset S$${assets.toLocaleString()} dan utang S$${liabilities.toLocaleString()} harus diselesaikan atau dihapusbukukan (written off).`);
  }

  // 3. Tax clearance
  if (hasTaxClearance) {
    score += 20;
  } else {
    blockers.push("Belum memperoleh Tax Clearance resmi dari IRAS. Ajukan penutupan akun PPh Badan dan de-registrasi GST ke IRAS.");
  }

  // 4. Bank account closed
  if (isBankClosed) {
    score += 15;
  } else {
    blockers.push("Rekening bank korporat belum ditutup secara resmi. Saldo rekening wajib ditarik ke nol dan rekening ditutup.");
  }

  // 5. No outstanding statutory debts
  if (!hasDebts) {
    score += 15;
  } else {
    blockers.push("Terdapat tunggakan utang pajak (IRAS), iuran CPF karyawan, atau denda ACRA.");
  }

  // 6. No pending litigation
  if (!hasLitigation) {
    score += 10;
  } else {
    blockers.push("Perusahaan sedang terlibat dalam sengketa hukum di pengadilan Singapura.");
  }

  // 7. Shareholder approval
  if (hasApproval) {
    score += 5;
  } else {
    blockers.push("Belum ada resolusi persetujuan tertulis dari mayoritas pemegang saham.");
  }

  const isEligibleToApply = blockers.length === 0;
  const readinessStatus = isEligibleToApply
    ? 'READY_FOR_STRIKING_OFF_APPLICATION'
    : 'BLOCKED_BY_STATUTORY_REQUIREMENTS';

  return {
    strikingOffReadinessScore: score,
    isEligibleToApply,
    status: isEligibleToApply ? 'READY_FOR_ACRA_SUBMISSION' : 'PRE_APPLICATION_REQUIREMENTS_PENDING',
    readinessStatus,
    checklistAudit: {
      hasCeasedTrading: hasCeased,
      hasZeroBalanceSheet: assets === 0 && liabilities === 0,
      hasIrasTaxClearance: hasTaxClearance,
      isBankAccountClosed: isBankClosed,
      isFreeOfStatutoryDebts: !hasDebts,
      isFreeOfLitigation: !hasLitigation,
      hasShareholderApproval: hasApproval
    },
    totalOutstandingBlockers: blockers.length,
    outstandingBlockersList: blockers,
    gazetteTimelineEstimation: {
      step1Submission: 'Aplikasi online diajukan via ACRA BizFile+ (biaya permohonan S$35).',
      step2FirstGazette: `Sekitar ${GAZETTE_TIMELINE.FIRST_GAZETTE_NOTICE_WEEKS} minggu setelah pengajuan jika disetujui ACRA.`,
      step3ObjectionWindow: `Masa tunggu keberatan pihak ketiga (kreditur) selama ${GAZETTE_TIMELINE.OBJECTION_PERIOD_DAYS} hari statuter.`,
      step4FinalGazette: `Sekitar ${GAZETTE_TIMELINE.FINAL_GAZETTE_NOTICE_MONTHS} bulan setelah First Gazette Notice; nama perusahaan resmi dicoret dari Register ACRA.`
    },
    statutoryAdvice: isEligibleToApply
      ? "Semua kriteria statuter Section 344A terpenuhi. Direktur dapat segera mengajukan Striking Off di ACRA BizFile+."
      : "Permohonan striking off kemungkinan besar akan ditolak ACRA jika diajukan saat ini. Selesaikan seluruh poin pada daftar penghambat di atas."
  };
}

module.exports = {
  evaluateStrikingOffReadiness,
  STRIKING_OFF_STATUTORY_REQUIREMENTS,
  GAZETTE_TIMELINE
};
