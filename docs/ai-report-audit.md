# Audit Report & AI Business Insight Architecture (Fase AI-1)

Dokumen ini berisi hasil audit menyeluruh terhadap infrastruktur laporan (*reports*), statistik dashboard, serta perencanaan arsitektur untuk membangun **AI Business Insight** pada aplikasi POS Bengkel.

---

## A. Struktur Report Saat Ini

### 1. Daftar Endpoint API Backend
| Method | Endpoint | Fungsi | Handler / Source |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/dashboard` | Ringkasan metrik dashboard (overview, WO status, revenue, low stock) | [`lib/dashboard/overview.ts`](file:///c:/Users/LENOVO/Documents/Antigravity/pos_bb/lib/dashboard/overview.ts), [`revenue.ts`](file:///c:/Users/LENOVO/Documents/Antigravity/pos_bb/lib/dashboard/revenue.ts), [`work-orders.ts`](file:///c:/Users/LENOVO/Documents/Antigravity/pos_bb/lib/dashboard/work-orders.ts), [`inventory.ts`](file:///c:/Users/LENOVO/Documents/Antigravity/pos_bb/lib/dashboard/inventory.ts) |
| `GET` | `/api/reports/revenue` | Laporan pendapatan, tren harian, average ticket, & breakdown metode pembayaran | [`lib/reports/revenue.ts`](file:///c:/Users/LENOVO/Documents/Antigravity/pos_bb/lib/reports/revenue.ts) |
| `GET` | `/api/reports/work-orders` | Statistik WO, estimasi durasi pengerjaan, tren harian 30 hari, & performa mekanik | [`lib/reports/work-orders.ts`](file:///c:/Users/LENOVO/Documents/Antigravity/pos_bb/lib/reports/work-orders.ts) |
| `GET` | `/api/reports/customer-analytics` | Analisis pelanggan aktif/inaktif, pertumbuhan bulanan, frekuensi kunjungan, & top spending | [`lib/reports/customer-analytics.ts`](file:///c:/Users/LENOVO/Documents/Antigravity/pos_bb/lib/reports/customer-analytics.ts) |
| `GET` | `/api/reports/service-analytics` | Performa layanan, pendapatan per servis, servis terlaris/sepi, & kombinasi servis | [`lib/reports/service-analytics.ts`](file:///c:/Users/LENOVO/Documents/Antigravity/pos_bb/lib/reports/service-analytics.ts) |
| `GET` | `/api/reports/spare-parts` | Analisis inventaris, nilai aset, pergerakan stok, spare part terlaris & slow-moving | [`lib/reports/spare-parts.ts`](file:///c:/Users/LENOVO/Documents/Antigravity/pos_bb/lib/reports/spare-parts.ts) |

---

### 2. Daftar Service Backend
- **`lib/dashboard/overview.ts`**: Menghitung `totalCustomers`, `totalVehicles`, `totalMechanics`, `totalServices`, `totalSpareParts`, `totalWorkOrders`.
- **`lib/dashboard/revenue.ts`**: Menghitung pendapatan hari ini (`todayRevenue`), kemarin (`yesterdayRevenue`), bulan ini (`monthlyRevenue`), dan total kumulatif (`totalRevenue`) dari tabel `Payment`.
- **`lib/dashboard/work-orders.ts`**: Menghitung hitungan status Work Order (`PENDING`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`) & 5 transaksi WO terbaru.
- **`lib/dashboard/inventory.ts`**: Menampilkan daftar spare part dengan stok kritis ($\le 5$).
- **`lib/reports/revenue.ts`**: Menghitung `totalRevenue`, `totalTransactions`, `averageTransaction`, array `dailyRevenue`, serta persentase metode pembayaran (`CASH`, `QRIS`, `TRANSFER`, `EWALLET`).
- **`lib/reports/work-orders.ts`**: Menghitung rata-rata/tercepat/terlama durasi pengerjaan (`completionTime`), tren WO 30 hari terakhir, serta pemeringkatan jumlah pengerjaan mekanik (`mechanicPerformance`).
- **`lib/reports/customer-analytics.ts`**: Menghitung `activeCustomers` vs `inactiveCustomers` (ambang batas 6 bulan), pelanggan baru bulan ini, persentase *repeat customer*, distribusi pengeluaran (*spending brackets*), serta daftar pelanggan inaktif.
- **`lib/reports/service-analytics.ts`**: Menghitung total pendapatan per servis, `mostPopularService`, `leastPopularService`, tren bulanan/harian servis, dan kombinasi servis yang sering diambil bersamaan (*frequent combinations*).
- **`lib/reports/spare-parts.ts`**: Menghitung total nilai aset suku cadang (`totalValue`), jumlah barang *low stock* & *out of stock*, barang paling laris (*top selling*), serta barang lambat laku (*slow moving* >30 hari).

---

### 3. Daftar Halaman dan Komponen Frontend
- **Halaman Utama**: [`src/app/(app)/reports/page.tsx`](file:///c:/Users/LENOVO/Documents/Antigravity/pos_bb/pos-bb-frontend/src/app/(app)/reports/page.tsx)
- **Container Laporan**: [`UnifiedReportsDashboard.tsx`](file:///c:/Users/LENOVO/Documents/Antigravity/pos_bb/pos-bb-frontend/src/components/reports/UnifiedReportsDashboard.tsx)
- **Komponen Pendukung (44 Komponen)**:
  - Header & Filter: `ReportsFilters.tsx`, `ReportsTabs.tsx`, `ReportsSummary.tsx`
  - Sub-halaman / Views: `RevenueReportView.tsx`, `WorkOrdersReportView.tsx`, `CustomerAnalyticsView.tsx`, `ServiceAnalyticsView.tsx`, `InventoryReportView.tsx`
  - Cards & Charts: `RevenueTrendChart.tsx`, `WorkOrderTrendChart.tsx`, `CustomerGrowthChart.tsx`, `ServiceRevenueChart.tsx`, `InventoryMovementChart.tsx`, `CompletionTimeCard.tsx`, `InactiveCustomersList.tsx`, `LowStockTable.tsx`, `SlowMovingTable.tsx`, `TopCustomersTable.tsx`, dll.

---

### 4. Metrik yang Sudah Tersedia
1. **Financial**: Total Pendapatan, Average Ticket per Transaksi, Distribusi Metode Pembayaran, Pendapatan Harian & Bulanan.
2. **Operasional Work Order**: Jumlah WO per status, Rata-rata/Tercepat/Terlama Waktu Penyelesaian WO, Tren WO Harian, Performa Jumlah Selesai per Mekanik.
3. **Pelanggan**: Total Pelanggan, Pelanggan Aktif (<6 bulan), Pelanggan Inaktif (>6 bulan), Pelanggan Baru Bulan Ini, Persentase Pelanggan Kembali (*Returning Rate*), Distribusi Pengeluaran (*Spending Brackets*).
4. **Layanan/Servis**: Servis Paling Populer, Servis Paling Sepi, Revenue per Servis, Kombinasi Paket Servis Sering Dibeli Bersamaan.
5. **Inventaris/Suku Cadang**: Nilai Total Aset Barang, Jumlah Barang Stok Kritis ($\le 5$), Jumlah Barang Habis ($0$), Suku Cadang Terlaris (*Top Selling*), Suku Cadang Lambat Laku (*Slow Moving*).

---

## B. Data yang Dapat Digunakan AI

Data yang dikalkulasi backend dapat digolongkan untuk konsumsi engine AI Insight:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            DATA AGREGASI BENGKEL                            │
├───────────────┬────────────────┬───────────────┬──────────────┬─────────────┤
│    REVENUE    │   WORK ORDER   │   CUSTOMER    │   SERVICE    │ INVENTORY   │
├───────────────┼────────────────┼───────────────┼──────────────┼─────────────┤
│ Total Revenue │ Status Counts  │ Total Cust    │ Top Services │ Total Value │
│ Today/Monthly │ Completion Time│ Active/Inact  │ Low Services │ Low Stock   │
│ Avg Ticket    │ Daily Trend    │ Returning %   │ Combos       │ Out of Stock│
│ Payment Method│ Mech Rankings  │ Spending Dist │ Category Dist│ Slow Moving │
└───────────────┴────────────────┴───────────────┴──────────────┴─────────────┘
```

---

## C. Gap Analysis (Data yang Belum Tersedia)

Untuk menghasilkan rekomendasi bisnis AI yang bernilai tinggi, terdapat beberapa gap kalkulasi data pada backend saat ini:

1. **Perbandingan Periode Sebelumnya (Period-over-Period / MoM / YoY Growth)**:
   - *Kondisi saat ini*: Backend menghitung total absolut pada range tanggal terpilih, namun **belum menghitung data pada periode sebelumnya secara otomatis** (misal: 30 hari ini vs 30 hari sebelumnya).
   - *Dampak untuk AI*: AI belum dapat menghitung persentase kenaikan/penurunan pendapatan (`changePercent`) secara presisi.

2. **Deteksi Tren Penurunan Layanan (Declining Service Detection)**:
   - *Kondisi saat ini*: `service-analytics.ts` menyediakan pemeringkatan tren sederhana, namun belum menghitung persentase penurunan signifikan dari periode sebelumnya.
   - *Dampak untuk AI*: AI belum bisa mendeteksi secara pasti servis mana yang mengalami penurunan drastis (misal: "Tune Up turun 18%").

3. **Prediksi Churn Pelanggan (Due for Service Alert)**:
   - *Kondisi saat ini*: `customer-analytics.ts` mengelompokkan pelanggan inaktif (>6 bulan), namun belum mengidentifikasi pelanggan yang memasuki jendela servis berkala (3–4 bulan sejak servis terakhir).
   - *Dampak untuk AI*: AI belum bisa memberikan rekomendasi penjangkauan spesifik via WhatsApp Reminder.

4. **Kombinasi Peluang Cross-Selling / Upselling**:
   - *Kondisi saat ini*: Ada data `frequentCombinations` pada layanan, namun belum ada matriks hubungan antara Layanan + Spare Part (contoh: "85% ganti oli membeli Filter Oli, namun 15% Work Order ganti oli tidak membeli filter").

---

## D. Rekomendasi Arsitektur & Payload Aggregated API

AI **tidak boleh diberi akses langsung ke Prisma atau PostgreSQL** untuk alasan keamanan dan performa. AI akan menerima payload JSON yang sudah ter-agregasi dari backend service.

### Struktur Payload Agregasi (`GET /api/reports/ai-insight/data`)

```json
{
  "period": {
    "label": "30 Hari Terakhir",
    "startDate": "2026-07-01",
    "endDate": "2026-07-31",
    "previousStartDate": "2026-06-01",
    "previousEndDate": "2026-06-30"
  },
  "revenue": {
    "current": 42500000,
    "previous": 38200000,
    "changePercent": 11.25,
    "averageTicketCurrent": 245000,
    "averageTicketPrevious": 230000
  },
  "workOrders": {
    "current": 173,
    "previous": 166,
    "changePercent": 4.22,
    "completedCount": 158,
    "cancelledCount": 5,
    "averageCompletionTime": "1j 45m"
  },
  "customers": {
    "total": 340,
    "newThisMonth": 28,
    "active": 210,
    "inactive": 130,
    "returningPercent": 68
  },
  "services": {
    "topByRevenue": [
      { "name": "Servis Berkala Paket Gold", "revenue": 18500000, "count": 37 }
    ],
    "decliningServices": [
      { "name": "Tune Up Injeksi", "changePercent": -18.5 }
    ]
  },
  "inventory": {
    "totalValue": 85400000,
    "lowStockCount": 4,
    "outOfStockCount": 1,
    "topSellingParts": ["Oli Mesin Synthetic 10W-40", "Filter Oli Denso"],
    "slowMovingCount": 8
  }
}
```

---

## E. Rekomendasi AI Insight & Format Output (Versi 1)

Engine AI Insight akan memproses payload agregasi di atas dan menghasilkan output terstruktur untuk UI Frontend Card:

### Output JSON Terstruktur AI (`GET /api/reports/ai-insight`)

```json
{
  "summary": "Pendapatan bulan ini naik 11.2% menjadi Rp 42.500.000 didorong oleh peningkatan transaksi servis berkala. Namun, stok 1 barang laris habis dan layanan Tune Up mengalami penurunan 18.5%.",
  "highlights": [
    {
      "type": "positive",
      "title": "Pertumbuhan Revenue Positif",
      "description": "Pendapatan meningkat Rp 4.300.000 (+11.2%) dibandingkan bulan sebelumnya dengan rata-rata transaksi naik menjadi Rp 245.000."
    },
    {
      "type": "warning",
      "title": "Stok Komponen Utama Habis",
      "description": "Filter Oli Denso mencapai stok 0 sementara permintaan Work Order bulan ini tetap tinggi."
    },
    {
      "type": "opportunity",
      "title": "Potensi Retensi 130 Pelanggan Inaktif",
      "description": "Terdapat 130 pelanggan yang belum kembali dalam 6 bulan terakhir. Mengirimkan WhatsApp Service Reminder dapat memicu kunjungan kembali."
    }
  ],
  "recommendation": {
    "title": "Pengadaan Stok & Kampanye Reminder",
    "description": "Segera lakukan restock Filter Oli Denso dan aktifkan Automation/Reminder untuk pelanggan inaktif.",
    "actionLabel": "Buka WhatsApp Automation",
    "actionTarget": "/whatsapp"
  }
}
```

---

## F. Lokasi Penempatan UI di Frontend

* **Lokasi Terbaik**: Pada komponen [`UnifiedReportsDashboard.tsx`](file:///c:/Users/LENOVO/Documents/Antigravity/pos_bb/pos-bb-frontend/src/components/reports/UnifiedReportsDashboard.tsx), diletakkan di **bagian paling atas (setelah KPI Cards dan sebelum Chart Tren)**.
* **Alasan**: Memberikan *Executive Summary* seketika saat pengguna membuka halaman laporan, tanpa mengganggu atau mempersempit grafik dan tabel detail di bawahnya.

---

## G. Rencana Tahapan Implementasi Berikutnya

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        TAHAPAN IMPLEMENTASI FASE AI-1                       │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. Fase AI-1A: Report Insight Data API                                      │
│    - Buat Service Agregator & Period Comparison Helper di backend.           │
│    - Sediakan endpoint GET /api/reports/ai-insight/data.                    │
├─────────────────────────────────────────────────────────────────────────────┤
│ 2. Fase AI-1B: AI Insight Generator Engine                                 │
│    - Implemen Engine Insight (Structured Rule-based / Isolated LLM Prompt).  │
│    - Sediakan endpoint GET /api/reports/ai-insight.                         │
├─────────────────────────────────────────────────────────────────────────────┤
│ 3. Fase AI-1C: Frontend AI Insight Card Component                           │
│    - Buat komponen AiBusinessInsightCard.tsx di pos-bb-frontend.            │
│    - Hubungkan ke endpoint API dengan Skeleton Loading & Badge visual.      │
├─────────────────────────────────────────────────────────────────────────────┤
│ 4. Fase AI-1D: Validation & Production Hardening                             │
│    - Pengujian skenario data kosong, error handling, dan build kompilasi.   │
└─────────────────────────────────────────────────────────────────────────────┘
```
