# Statutory Provenance & Legal Architecture

## Singapore Business Agent Skills (SBAS)

Dokumen ini mendokumentasikan landasan statuter resmi, sumber hukum Pemerintah Singapura, dan arsitektur provenance untuk repositori `singapore-business-agent-skills`.

---

## 1. Official Singapore Statutory Authorities

Seluruh formula komputasi, batasan kuota, jadwal tenggat waktu, dan tarif pajak merujuk langsung ke undang-undang dan peraturan resmi Republik Singapura:

| Domain | Statutory Authority / Body | Primary Statutes & Frameworks |
|---|---|---|
| **CIT & Tax** | Inland Revenue Authority of Singapore (IRAS) | Income Tax Act 1947 (ITA) Sec 43, 45, 13(8), 13W |
| **GST** | Inland Revenue Authority of Singapore (IRAS) | Goods and Services Tax Act 1993 (GSTA) |
| **CPF & Levies** | Central Provident Fund Board (CPFB) | Central Provident Fund Act 1953 (CPFA) |
| **Employment** | Ministry of Manpower (MOM) | Employment Act 1968 (Part IV), EFMA, COMPASS |
| **Governance** | Accounting and Corporate Regulatory Authority (ACRA) | Companies Act 1967 (Sec 145, 171, 175, 197, 13th Sched) |
| **Data Privacy** | Personal Data Protection Commission (PDPC) | Personal Data Protection Act 2012 (Part VIA) |
| **Benchmark Rates** | Monetary Authority of Singapore (MAS) | Singapore Overnight Rate Average (SORA) |
| **Enterprise Grants** | Enterprise Singapore (EnterpriseSG) | Enterprise Development Grant (EDG), MRA, PSG |
| **Bilateral Treaty** | IRAS & Direktorat Jenderal Pajak RI (DJP) | Singapore-Indonesia Double Tax Agreement (DTA) |

---

## 2. Release Provenance Architecture

- **Authoritative Boundary**: Git tag (misal `v1.0.0`) merupakan batas rilis permanen dan tak dapat diubah (*immutable release boundary*).
- **Lineage Verification**: `release-manifest.json` mencatat versi, metrik domain, hash file verifikasi, dan status gerbang rilis tanpa menggunakan self-referencing commit hash (menghindari paradoks hash Git).
- **Trust Anchor**: `SHA256SUMS.txt` mengunci hash kriptografis dari seluruh 8 berkas aturan statuter di `engines/rules/`.
