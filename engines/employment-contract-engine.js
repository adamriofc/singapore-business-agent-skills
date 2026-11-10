/**
 * Singapore Employment Contract & Restrictive Covenants Audit Engine (`engines/employment-contract-engine.js`)
 *
 * Mengimplementasikan audit kepatuhan perjanjian kerja berdasarkan Employment Act 1968
 * (khususnya Sections 10, 11, dan 14) serta Doktrin Common Law Singapura mengenai Restraint of Trade:
 *   - Masa Pemberitahuan Statuter Default (Section 10(3) Employment Act):
 *       * Masa kerja < 26 minggu: 1 hari pemberitahuan.
 *       * 26 minggu s/d < 2 tahun: 1 minggu pemberitahuan.
 *       * 2 tahun s/d < 5 tahun: 2 minggu pemberitahuan.
 *       * 5 tahun ke atas: 4 minggu pemberitahuan.
 *   - Asimetri Pemberitahuan: Masa pemberitahuan majikan dan karyawan wajib setara (Section 10(2)).
 *   - Audit Klausul Non-Kompetisi (Non-Compete / Restraint of Trade):
 *       * Prinsip Common Law Singapura: Prima facie void and unenforceable kecuali melindungi
 *         kepentingan sah (legitimate business interest) dan durasi wajar (<= 6-12 bulan) serta batas geografis proporsional.
 *   - Audit Masa Percobaan (Probation Period): Norma wajar 3 s/d 6 bulan dengan hak pemutusan terukur.
 *
 * 100% deterministik, zero external dependencies.
 */

'use strict';

/**
 * Mendapatkan masa pemberitahuan statuter minimal MOM jika tidak diatur dalam kontrak.
 * @param {number} yearsOfService
 * @returns {{ noticeWeeks: number, statutoryBasis: string }}
 */
function getStatutoryDefaultNotice(yearsOfService) {
  const yrs = Math.max(0, Number(yearsOfService) || 0);
  if (yrs < 0.5) return { noticeWeeks: 0.14, noticeDays: 1, statutoryBasis: 'Section 10(3)(a): 1 day (< 26 weeks)' };
  if (yrs < 2.0) return { noticeWeeks: 1.00, noticeDays: 7, statutoryBasis: 'Section 10(3)(b): 1 week (26 weeks to < 2 years)' };
  if (yrs < 5.0) return { noticeWeeks: 2.00, noticeDays: 14, statutoryBasis: 'Section 10(3)(c): 2 weeks (2 years to < 5 years)' };
  return { noticeWeeks: 4.00, noticeDays: 28, statutoryBasis: 'Section 10(3)(d): 4 weeks (>= 5 years)' };
}

/**
 * Mengaudit klausul perjanjian kerja terhadap Employment Act dan preseden pengadilan Singapura.
 *
 * @param {Object} params
 * @param {number} params.contractualEmployerNoticeWeeks Masa pemberitahuan majikan dalam minggu
 * @param {number} params.contractualEmployeeNoticeWeeks Masa pemberitahuan karyawan dalam minggu
 * @param {number} params.yearsOfService Masa kerja karyawan dalam tahun
 * @param {number} [params.probationDurationMonths=3] Durasi masa percobaan (bulan)
 * @param {Object} [params.nonCompeteClause] Klausul non-kompetisi
 * @param {boolean} [params.nonCompeteClause.hasNonCompete=false] Apakah ada klausul non-kompetisi
 * @param {number} [params.nonCompeteClause.durationMonths=12] Durasi restriksi dalam bulan
 * @param {string} [params.nonCompeteClause.geographicalScope='SINGAPORE'] Cakupan geografis ('SINGAPORE', 'REGIONAL_APAC', 'GLOBAL')
 * @param {boolean} [params.nonCompeteClause.protectsTradeSecrets=true] Apakah melindungi rahasia dagang/hubungan klien riil
 * @returns {Object} Hasil audit kepatuhan kontrak kerja
 */
function auditEmploymentContract(params) {
  if (!params || typeof params !== 'object') {
    throw new TypeError("Parameter 'params' harus berupa objek valid.");
  }

  const employerNotice = Math.max(0, Number(params.contractualEmployerNoticeWeeks) || 0);
  const employeeNotice = Math.max(0, Number(params.contractualEmployeeNoticeWeeks) || 0);
  const years = Math.max(0, Number(params.yearsOfService) || 0);
  const probationMonths = Math.max(0, Number(params.probationDurationMonths) || 3);
  const nc = params.nonCompeteClause || {};

  const statutoryDefault = getStatutoryDefaultNotice(years);

  const findings = [];
  let scoreDeductions = 0;

  // 1. Audit Asimetri Masa Pemberitahuan (Section 10(2))
  const isNoticeAsymmetrical = employerNotice !== employeeNotice;
  if (isNoticeAsymmetrical) {
    scoreDeductions += 25;
    findings.push({
      clause: 'NOTICE_PERIOD_ASYMMETRY',
      severity: 'HIGH',
      description: `Masa pemberitahuan asimetris (Majikan: ${employerNotice} minggu vs Karyawan: ${employeeNotice} minggu). Section 10(2) Employment Act mensyaratkan durasi notice period kedua pihak harus setara.`
    });
  }

  // 2. Audit Pemenuhan Batas Minimal Statuter
  if (employerNotice < statutoryDefault.noticeWeeks && employerNotice > 0) {
    scoreDeductions += 15;
    findings.push({
      clause: 'BELOW_STATUTORY_NOTICE_MINIMUM',
      severity: 'MEDIUM',
      description: `Masa pemberitahuan (${employerNotice} minggu) lebih pendek dari standar minimal statuter MOM (${statutoryDefault.statutoryBasis}).`
    });
  }

  // 3. Audit Masa Percobaan (Probation)
  if (probationMonths > 6) {
    scoreDeductions += 15;
    findings.push({
      clause: 'EXCESSIVE_PROBATION_PERIOD',
      severity: 'MEDIUM',
      description: `Masa percobaan ${probationMonths} bulan melebihi norma praktik ketenagakerjaan Singapura (maksimal 3 s/d 6 bulan).`
    });
  }

  // 4. Audit Restraint of Trade / Non-Compete
  let nonCompeteAssessment = 'NOT_APPLICABLE';
  if (nc.hasNonCompete) {
    const ncMonths = Number(nc.durationMonths) || 12;
    const geo = String(nc.geographicalScope || 'SINGAPORE').toUpperCase();
    const hasLegitimateInterest = Boolean(nc.protectsTradeSecrets);

    let isEnforceable = true;
    const ncReasons = [];

    if (!hasLegitimateInterest) {
      isEnforceable = false;
      ncReasons.push("Tidak ada kepentingan kepemilikan bisnis yang sah (legitimate proprietary interest) yang dilindungi.");
    }
    if (ncMonths > 12) {
      isEnforceable = false;
      ncReasons.push(`Durasi non-kompetisi ${ncMonths} bulan dianggap berlebihan dan melampaui batas kewajaran di mata pengadilan Singapura.`);
    }
    if (geo === 'GLOBAL') {
      isEnforceable = false;
      ncReasons.push("Cakupan geografis bersifat global tanpa batasan spesifik pasar terbukti riil.");
    }

    if (!isEnforceable) {
      scoreDeductions += 20;
      nonCompeteAssessment = 'LIKELY_UNENFORCEABLE_VOID';
      findings.push({
        clause: 'NON_COMPETE_OVERREACH',
        severity: 'HIGH',
        description: `Klausul non-kompetisi kemungkinan besar batal demi hukum (void): ${ncReasons.join(' ')}`
      });
    } else {
      nonCompeteAssessment = 'REASONABLY_ENFORCEABLE';
    }
  }

  const complianceScore = Math.max(0, 100 - scoreDeductions);

  return {
    complianceScore,
    isFullyCompliant: findings.length === 0,
    noticePeriodAudit: {
      employerNoticeWeeks: employerNotice,
      employeeNoticeWeeks: employeeNotice,
      isNoticeAsymmetrical,
      statutoryBenchmark: statutoryDefault
    },
    probationAudit: {
      durationMonths: probationMonths,
      isStandardNorm: probationMonths <= 6
    },
    nonCompeteAudit: {
      hasNonCompete: Boolean(nc.hasNonCompete),
      assessment: nonCompeteAssessment
    },
    totalFindings: findings.length,
    findings
  };
}

module.exports = {
  auditEmploymentContract,
  getStatutoryDefaultNotice
};
