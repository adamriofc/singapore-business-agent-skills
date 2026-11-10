/**
 * Singapore Statutory Sick & Hospitalisation Leave Engine (`engines/sick-hospitalisation-leave-engine.js`)
 *
 * Mengimplementasikan kalkulasi hak cuti sakit berbayar (Paid Outpatient Sick Leave) dan
 * cuti rawat inap (Paid Hospitalisation Leave) berdasarkan Section 89 Employment Act 1968:
 *   - Periode Kualifikasi Awal: Minimal 3 bulan masa kerja berkelanjutan.
 *   - Tabel Pro-rata Statuter Tahun Pertama (Berdasarkan jumlah bulan masa kerja selesai):
 *       * 3 bulan: 5 hari rawat jalan (outpatient), 15 hari rawat inap (hospitalisation).
 *       * 4 bulan: 8 hari rawat jalan, 30 hari rawat inap.
 *       * 5 bulan: 11 hari rawat jalan, 45 hari rawat inap.
 *       * 6 bulan ke atas: 14 hari rawat jalan, 60 hari rawat inap (maksimum tahunan).
 *   - Hubungan Inklusif: Batas 60 hari cuti rawat inap sudah mencakup (inklusif) 14 hari cuti sakit rawat jalan.
 *   - Validitas Surat Keterangan Medis (Medical Certificate / MC): Wajib dikeluarkan oleh dokter SMC atau institusi medis pemerintah/disetujui.
 *
 * 100% deterministik, zero external dependencies.
 */

'use strict';

const STATUTORY_SICK_LEAVE_TIERS = [
  { minMonths: 6, outpatientDays: 14, hospitalisationDays: 60 },
  { minMonths: 5, outpatientDays: 11, hospitalisationDays: 45 },
  { minMonths: 4, outpatientDays: 8,  hospitalisationDays: 30 },
  { minMonths: 3, outpatientDays: 5,  hospitalisationDays: 15 },
  { minMonths: 0, outpatientDays: 0,  hospitalisationDays: 0 }
];

/**
 * Menghitung hak cuti sakit dan rawat inap statuter MOM.
 *
 * @param {Object} params
 * @param {number} params.monthsOfService Jumlah bulan masa kerja yang telah diselesaikan
 * @param {number} [params.outpatientSickLeaveTakenDays=0] Cuti sakit rawat jalan yang telah diambil tahun ini
 * @param {number} [params.hospitalisationLeaveTakenDays=0] Cuti rawat inap yang telah diambil tahun ini
 * @param {boolean} [params.hasValidMcFromRegisteredDoctor=true] Apakah memiliki MC dari dokter yang sah
 * @returns {Object} Rincian hak kuota, sisa saldo, dan validitas kepatuhan MOM
 */
function calculateSickLeaveEntitlement(params) {
  if (!params || typeof params !== 'object') {
    throw new TypeError("Parameter 'params' harus berupa objek valid.");
  }

  const months = Math.max(0, Math.floor(Number(params.monthsOfService) || 0));
  const outpatientTaken = Math.max(0, Number(params.outpatientSickLeaveTakenDays) || 0);
  const hospTaken = Math.max(0, Number(params.hospitalisationLeaveTakenDays) || 0);
  const validMc = params.hasValidMcFromRegisteredDoctor !== undefined
    ? Boolean(params.hasValidMcFromRegisteredDoctor)
    : true;

  // Cari tier yang berlaku
  const tier = STATUTORY_SICK_LEAVE_TIERS.find(t => months >= t.minMonths) || STATUTORY_SICK_LEAVE_TIERS[4];

  const totalOutpatientEntitlement = tier.outpatientDays;
  const totalHospitalisationEntitlement = tier.hospitalisationDays;

  // Cuti rawat jalan yang tersisa
  const remainingOutpatient = Math.max(0, totalOutpatientEntitlement - outpatientTaken);

  // Sisa cuti rawat inap: kuota hospitalisation dikurangi outpatient taken dan hospitalisation taken
  // Karena 60 hari hospitalisation bersifat inklusif terhadap outpatient leave
  const remainingHospitalisation = Math.max(0, totalHospitalisationEntitlement - outpatientTaken - hospTaken);

  const isEligible = months >= 3 && validMc;

  const notes = [];
  if (months < 3) {
    notes.push("Karyawan belum mencapai masa kerja minimum 3 bulan untuk berhak atas cuti sakit berbayar.");
  }
  if (!validMc) {
    notes.push("MC tidak berasal dari dokter terdaftar SMC / fasilitas medis yang disetujui MOM.");
  }

  return {
    monthsOfService: months,
    isEligibleForPaidSickLeave: isEligible,
    complianceNotes: notes,
    entitlements: {
      outpatientSickLeaveTotalDays: totalOutpatientEntitlement,
      hospitalisationLeaveTotalDays: totalHospitalisationEntitlement,
      isInclusiveRelationship: true
    },
    usage: {
      outpatientSickLeaveTakenDays: outpatientTaken,
      hospitalisationLeaveTakenDays: hospTaken,
      totalPaidDaysClaimed: outpatientTaken + hospTaken
    },
    balances: {
      remainingOutpatientSickLeaveDays: remainingOutpatient,
      remainingHospitalisationLeaveDays: remainingHospitalisation
    },
    statutoryAdvice: isEligible
      ? "Perusahaan wajib membayar gaji pokok harian penuh (full basic rate of pay) selama periode cuti sakit berbayar yang sah."
      : "Karyawan tidak berhak atas cuti sakit berbayar statuter (dapat diperlakukan sebagai cuti tidak berbayar / unpaid leave)."
  };
}

module.exports = {
  calculateSickLeaveEntitlement,
  STATUTORY_SICK_LEAVE_TIERS
};
