# Checklist Kesiapan Produksi WhatsApp Automation Control (Fase 2D)

Dokumen ini menjelaskan langkah-langkah persiapan, validasi, aktivasi, dan mitigasi risiko untuk merilis WhatsApp Automation Control ke lingkungan produksi (*production*).

---

## 1. Penjelasan Alur Kerja Mode `DRY_RUN`

* **Definisi**: Mode simulasi default yang mencatat seluruh kejadian trigger WhatsApp tanpa mengirimkan pesan nyata atau membuat HTTP request ke Fonnte provider.
* **Perilaku**:
  - `NotificationHistory` log dibuat dengan status `SIMULATED`.
  - Field `providerResponse` mencatat informasi `{ "mode": "DRY_RUN", "providerCalled": false }`.
  - Pilihan template, trigger event, dan data resolusi variabel tetap dirender secara nyata untuk divalidasi di UI.
  - Sifat: **Aman**. Pengujian mode `DRY_RUN` tidak memblokir pengiriman nyata (`LIVE`) di kemudian hari.

---

## 2. Mekanisme `Controlled LIVE Test`

Sebelum mengaktifkan mode `LIVE` secara global, gunakan filter controlled live test untuk membatasi pengiriman WhatsApp nyata hanya ke Work Order pengujian tertentu:
1. Konfigurasi env filter pada `.env`:
   - `AUTOMATION_EXECUTION_MODE=LIVE`
   - `AUTOMATION_LIVE_ENABLED=true`
   - `AUTOMATION_TEST_WORK_ORDER_ID=<ID_WORK_ORDER_TEST>` (Wajib)
   - `AUTOMATION_TEST_TRIGGER=WORK_ORDER_CREATED` (Opsional)
2. Hasil evaluasi:
   - Jika ID Work Order atau Trigger tidak cocok, engine langsung menghentikan proses pengiriman dengan status log detail `WORK_ORDER_NOT_ALLOWED_FOR_LIVE_TEST` / `TRIGGER_NOT_ALLOWED_FOR_LIVE_TEST` tanpa memanggil provider Fonnte.

---

## 3. Checklist Kesiapan Rilis

### A. Kesiapan Provider & WhatsApp (Fonnte)
- [ ] Akun Fonnte aktif dan memiliki kuota pesan/kredit yang cukup.
- [ ] Device WhatsApp sudah berstatus *connected* di dashboard Fonnte.
- [ ] Variabel `FONNTE_API_KEY` terkonfigurasi dengan benar di environment produksi server.
- [ ] Koneksi internet server aman untuk mengirim request HTTP POST ke `https://api.fonnte.com/send`.

### B. Validasi Template Notifikasi
- [ ] Seluruh trigger penting (`WORK_ORDER_CREATED`, `WORK_ORDER_IN_PROGRESS`, `WORK_ORDER_COMPLETED`) sudah dikaitkan dengan template pesan di menu **Automation Control**.
- [ ] Isi pesan template tidak mengandung variabel yang salah tik (gunakan format yang valid seperti `{{customer_name}}`, `{{work_order_number}}`, `{{grand_total}}`).
- [ ] Format pesan rapi dan ramah dibaca oleh pelanggan.

### C. Mekanisme Penanganan Duplikasi & Keamanan
- [ ] Proteksi *Race Condition* diaktifkan menggunakan Pessimistic Row Locking (`SELECT FOR UPDATE`) pada database Work Order.
- [ ] Status `FAILED` dikonfigurasi agar tidak memblokir trigger pengiriman ulang atau eksekusi baru.
- [ ] Status `SIMULATED` dikonfigurasi agar tidak memblokir pengiriman `LIVE`.
- [ ] Tombol Retry dibatasi hanya untuk log berstatus `FAILED`, dan diblokir untuk `SIMULATED`/`SENT`/`DELIVERED`.

### D. Monitoring & Rollback Plan
- [ ] Layanan logging (Console Log / Audit Logs) dipantau untuk mendeteksi status `FAILED` dari Fonnte.
- [ ] Rencana Rollback Cepat:
  - Jika terjadi spamming atau kegagalan kritis di produksi, kembalikan environment secara instan ke mode `DRY_RUN` dengan mengganti:
    ```env
    AUTOMATION_EXECUTION_MODE=DRY_RUN
    AUTOMATION_LIVE_ENABLED=false
    ```
  - Restart aplikasi/server agar perubahan env langsung aktif.

---

## 4. Tahapan Aktivasi Produksi (Go-Live)

1. **Tahap 1: Dry-Run Monitoring (Minimal 1-3 hari)**
   - Jalankan sistem dengan `AUTOMATION_EXECUTION_MODE=DRY_RUN`.
   - Pantau tab **Notification History** di dashboard. Pastikan log berstatus `SIMULATED` terbentuk secara tepat saat Work Order dibuat, dikerjakan, dan diselesaikan.
   
2. **Tahap 2: Controlled Live Testing**
   - Aktifkan filter live testing untuk satu Work Order pengujian milik staf internal bengkel:
     ```env
     AUTOMATION_EXECUTION_MODE=LIVE
     AUTOMATION_LIVE_ENABLED=true
     AUTOMATION_TEST_WORK_ORDER_ID=123
     ```
   - Lakukan transaksi pada Work Order tersebut, verifikasi pesan WhatsApp diterima di nomor handphone tester.
   
3. **Tahap 3: Go-Live Global**
   - Hapus filter pengujian dan jalankan mode LIVE penuh:
     ```env
     AUTOMATION_EXECUTION_MODE=LIVE
     AUTOMATION_LIVE_ENABLED=true
     # Hapus atau kosongkan variabel filter:
     # AUTOMATION_TEST_WORK_ORDER_ID=
     ```
   - Pantau dashboard secara berkala.
