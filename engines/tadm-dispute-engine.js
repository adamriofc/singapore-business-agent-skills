/**
 * Singapore TADM & Employment Claims Tribunal (ECT) Dispute Engine (`engines/tadm-dispute-engine.js`)
 *
 * Mengimplementasikan evaluasi mediasi sengketa ketenagakerjaan dan kelayakan pengajuan klaim
 * berdasarkan Singapore Employment Claims Act 2016 (ECA) dan Tripartite Alliance for Dispute Management (TADM):
 *   - Yurisdiksi Statuter TADM & ECT:
 *       * Mediasi wajib di TADM sebelum eskalasi ke Employment Claims Tribunals (ECT).
 *   - Batas Maksimum Nilai Klaim (Claim Limits per Section 12 ECA):
 *       * Klaim Standar (Non-Unionised): Maksimal S$20.000 per aplikasi.
 *       * Klaim Berbantuan Serikat Pekerja (Tripartite Mediation Framework / NTUC Unionised): Maksimal S$30.000 per aplikasi.
 *   - Batas Waktu Pengajuan Statuter (Statutory Limitation Periods):
 *       * Sengketa Gaji saat Masih Bekerja: Maksimal 1 tahun sejak penyebab klaim timbul (1 year from date of accrual).
 *       * Sengketa Gaji setelah PHK/Berhenti: Maksimal 6 bulan sejak tanggal pemutusan kerja (6 months from cessation).
 *       * Sengketa Pemutusan Hubungan Kerja Tidak Sah (Wrongful Dismissal): Maksimal 1 bulan sejak tanggal pemecatan.
 *   - Klasifikasi Jenis Klaim Ketenagakerjaan:
 *       * Gaji pokok belum dibayar, lembur Part IV, kompensasi PHK, uang pengganti cuti tahunan, uang pengganti masa pemberitahuan.
 *       * Pemecatan sewenang-wenang tanpa alasan yang sah (Section 14 Employment Act).
 *   - Biaya Registrasi Statuter TADM/ECT (S$10 s/d S$60 berdasarkan nilai klaim).
 *   - Evaluasi Kelayakan Klaim, Risiko Hukum, dan Rekomendasi Resolusi Mediasi.
 *
 * 100% deterministik, zero external dependencies.
 */

'use strict';

const TADM_ECT_STATUTORY_LIMITS = {
  STANDARD_CLAIM_MAX_SGD: 20000,
  UNIONISED_CLAIM_MAX_SGD: 30000,
  SALARY_CLAIM_ONGOING_EMPLOYMENT_LIMIT_MONTHS: 12,
  SALARY_CLAIM_POST_CESSATION_LIMIT_MONTHS: 6,
  WRONGFUL_DISMISSAL_LIMIT_MONTHS: 1
};

const STATUTORY_CLAIM_TYPES = [
  'UNPAID_BASIC_SALARY',
  'OVERTIME_PAY_PART_IV',
  'SALARY_IN_LIEU_OF_NOTICE',
  'UNPAID_ANNUAL_LEAVE_ENCASHMENT',
  'PUBLIC_HOLIDAY_COMPENSATION',
  'RETRENCHMENT_BENEFIT',
  'WRONGFUL_DISMISSAL'
];

/**
 * Menghitung biaya mediasi pendaftaran resmi TADM/ECT.
 *
 * @param {number|Object} param Nilai total klaim dalam SGD atau objek parameter
 * @returns {Object} Rincian biaya pendaftaran dalam SGD
 */
function calculateTadmRegistrationFee(param) {
  const amount = typeof param === 'object' && param !== null
    ? Math.max(0, Number(param.claimAmountSgd) || 0)
    : Math.max(0, Number(param) || 0);

  let fee = 10;
  if (amount <= 10000) fee = 10;
  else if (amount <= 20000) fee = 20;
  else fee = 60;

  return {
    applicableFeeSgd: fee,
    feeSgd: fee,
    claimAmountSgd: amount
  };
}

/**
 * Mengevaluasi kelayakan klaim sengketa ketenagakerjaan di TADM dan ECT.
 *
 * @param {Object} params
 * @param {string} params.claimType Jenis klaim (misal: 'SALARY_ARREARS', 'UNPAID_BASIC_SALARY', 'WRONGFUL_DISMISSAL')
 * @param {number} params.claimAmountSgd Nilai nominal tuntutan klaim dalam SGD
 * @param {boolean} [params.isEmploymentOngoing=false] Apakah karyawan masih aktif bekerja saat pengajuan
 * @param {boolean} [params.wasEmploymentTerminated] Apakah hubungan kerja telah berakhir
 * @param {number} [params.monthsSinceCauseOfAction] Jumlah bulan sejak timbulnya penyebab klaim
 * @param {number} [params.monthsSinceDisputeEvent] Alias jumlah bulan sejak kejadian sengketa
 * @param {boolean} [params.isUnionisedEmployee=false] Apakah anggota serikat pekerja NTUC
 * @param {boolean} [params.isUnionMember=false] Alias apakah anggota serikat pekerja NTUC
 * @returns {Object} Kelayakan pengajuan, batas yurisdiksi ECT, audit batas waktu statuter, dan biaya registrasi
 */
function evaluateTadmDispute(params) {
  if (!params || typeof params !== 'object') {
    throw new TypeError("Parameter 'params' harus berupa objek valid.");
  }

  const claimType = String(params.claimType || 'UNPAID_BASIC_SALARY').toUpperCase().trim();
  const claimAmount = Math.max(0, Number(params.claimAmountSgd) || 0);
  
  let isOngoing = false;
  if (params.isEmploymentOngoing !== undefined) {
    isOngoing = Boolean(params.isEmploymentOngoing);
  } else if (params.wasEmploymentTerminated !== undefined) {
    isOngoing = !Boolean(params.wasEmploymentTerminated);
  }

  const rawMonths = params.monthsSinceDisputeEvent !== undefined
    ? params.monthsSinceDisputeEvent
    : params.monthsSinceCauseOfAction;
  const monthsElapsed = Math.max(0, Number(rawMonths) || 0);

  const isUnionised = params.isUnionMember !== undefined
    ? Boolean(params.isUnionMember)
    : Boolean(params.isUnionisedEmployee);

  const maxStatutoryCap = isUnionised
    ? TADM_ECT_STATUTORY_LIMITS.UNIONISED_CLAIM_MAX_SGD
    : TADM_ECT_STATUTORY_LIMITS.STANDARD_CLAIM_MAX_SGD;

  const isWithinMonetaryCap = claimAmount <= maxStatutoryCap;
  const excessAmountSgd = isWithinMonetaryCap ? 0 : claimAmount - maxStatutoryCap;

  // Evaluasi Batas Waktu Statuter (Limitation Period)
  let allowedMonths = TADM_ECT_STATUTORY_LIMITS.SALARY_CLAIM_POST_CESSATION_LIMIT_MONTHS;
  if (claimType === 'WRONGFUL_DISMISSAL') {
    allowedMonths = TADM_ECT_STATUTORY_LIMITS.WRONGFUL_DISMISSAL_LIMIT_MONTHS;
  } else if (isOngoing) {
    allowedMonths = TADM_ECT_STATUTORY_LIMITS.SALARY_CLAIM_ONGOING_EMPLOYMENT_LIMIT_MONTHS;
  }

  const isWithinTimeLimit = monthsElapsed <= allowedMonths;
  const isEligibleForTadmEct = isWithinTimeLimit && claimAmount > 0;
  const isEligibleForTadmMediation = isEligibleForTadmEct;

  const feeResult = calculateTadmRegistrationFee(claimAmount);
  const registrationFeeSgd = feeResult.applicableFeeSgd;

  const proceduralAdvice = [];
  if (!isWithinTimeLimit) {
    proceduralAdvice.push(`Klaim telah kadaluwarsa (Time-barred). Batas waktu pengajuan untuk jenis klaim ini adalah maksimal ${allowedMonths} bulan (${monthsElapsed} bulan telah berlalu). TADM tidak dapat menerima klaim ini.`);
  } else {
    proceduralAdvice.push("Langkah 1: Ajukan mediasi resmi online di portal TADM (Tripartite Alliance for Dispute Management).");
    if (!isWithinMonetaryCap) {
      proceduralAdvice.push(`PERINGATAN PLAFON: Nilai klaim (S$${claimAmount.toLocaleString()}) melebihi plafon statuter ECT (S$${maxStatutoryCap.toLocaleString()}). Pemohon harus melepaskan selisih klaim sebesar S$${excessAmountSgd.toLocaleString()} agar dapat diadili di ECT, atau mengajukan gugatan perdata melalui State Courts / High Court.`);
    } else {
      proceduralAdvice.push(`Langkah 2: Jika mediasi TADM tidak mencapai kesepakatan, TADM akan menerbitkan Claim Referral Certificate untuk didaftarkan ke Employment Claims Tribunals (ECT) dalam 14 hari.`);
    }
  }

  let disputeForum = 'INELIGIBLE_STATUTE_BARRED';
  if (isEligibleForTadmEct) {
    disputeForum = isWithinMonetaryCap
      ? 'TADM_THEN_EMPLOYMENT_CLAIMS_TRIBUNAL'
      : 'STATE_COURTS_OR_HIGH_COURT_CIVIL_LITIGATION';
  }

  return {
    claimType,
    claimAmountSgd: claimAmount,
    isUnionisedEmployee: isUnionised,
    isEligibleForTadmMediation,
    isEligibleForTadmEct,
    disputeForum,
    tadmFilingFeeEstimateSgd: registrationFeeSgd,
    registrationFeeSgd,
    statutoryLimitCheck: {
      isWithinStatutoryClaimLimit: isWithinMonetaryCap,
      statutoryClaimLimitSgd: maxStatutoryCap,
      claimAmountSgd: claimAmount,
      excessAmountSgd
    },
    statutoryCapSgd: maxStatutoryCap,
    isWithinMonetaryCap,
    excessAmountSgd,
    timeLimitAudit: {
      isWithinTimeLimit,
      allowedMonthsLimit: allowedMonths,
      monthsElapsed,
      limitationStatus: isWithinTimeLimit ? 'WITHIN_STATUTORY_WINDOW' : 'TIME_BARRED_EXPIRED'
    },
    proceduralRecommendations: proceduralAdvice
  };
}

module.exports = {
  evaluateTadmDispute,
  calculateTadmRegistrationFee,
  TADM_ECT_STATUTORY_LIMITS,
  STATUTORY_CLAIM_TYPES
};
