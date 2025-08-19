# 🗺️ Mappin Jembatan - Sistem Pemetaan Lokasi

Website sederhana untuk memetakan lokasi jembatan dengan fitur upload data dari file Excel.

## ✨ Fitur Utama

- **Peta Interaktif**: Menggunakan Leaflet.js untuk menampilkan peta
- **Upload Excel**: Upload file Excel (.xlsx/.xls) berisi data koordinat jembatan
- **Drag & Drop**: Fitur drag and drop untuk upload file
- **Marker Otomatis**: Marker jembatan otomatis muncul di peta sesuai koordinat
- **Popup Info**: Klik marker untuk melihat detail jembatan
- **Statistik**: Menampilkan total jembatan, area tercover, dan waktu update
- **Daftar Jembatan**: List semua jembatan yang bisa diklik untuk fokus ke lokasi

## 📋 Format Excel yang Diperlukan

File Excel harus memiliki kolom dengan nama berikut:
- **Nama Jembatan** (atau nama, Nama, Name)
- **Latitude** (atau lat, Lat)
- **Longitude** (atau lng, Lng, Long)
- **Deskripsi** (opsional)

### Contoh Data Excel:

| Nama Jembatan | Latitude | Longitude | Deskripsi |
|---------------|----------|-----------|-----------|
| Jembatan Suramadu | -7.1907 | 112.7847 | Jembatan terpanjang di Indonesia |
| Jembatan Ampera | -3.0167 | 104.7333 | Jembatan ikonik Palembang |

## 🚀 Cara Menggunakan

1. **Buka file `index.html`** di browser web
2. **Upload file Excel** dengan cara:
   - Klik area upload dan pilih file
   - Atau drag & drop file Excel ke area upload
3. **Tunggu proses** - data akan otomatis diproses dan ditampilkan di peta
4. **Interaksi dengan peta**:
   - Klik marker untuk melihat detail jembatan
   - Klik item di daftar jembatan untuk fokus ke lokasi
   - Zoom dan pan untuk navigasi peta

## 🛠️ Teknologi yang Digunakan

- **HTML5**: Struktur website
- **CSS3**: Styling dan animasi
- **JavaScript**: Logika aplikasi
- **Leaflet.js**: Library peta interaktif
- **SheetJS**: Library untuk membaca file Excel

## 📁 Struktur File

```
mappin-jembatan/
├── index.html          # File utama website
└── README.md           # Dokumentasi ini
```

## 🌐 Browser Support

Website ini kompatibel dengan browser modern:
- Chrome (direkomendasikan)
- Firefox
- Safari
- Edge

## 📝 Catatan

- File Excel harus berformat .xlsx atau .xls
- Koordinat harus dalam format desimal (contoh: -7.1907, 112.7847)
- Latitude harus antara -90 sampai 90
- Longitude harus antara -180 sampai 180
- Website berjalan sepenuhnya di browser (tidak memerlukan server)

## 🔧 Troubleshooting

**Jika file Excel tidak terbaca:**
1. Pastikan format file adalah .xlsx atau .xls
2. Pastikan nama kolom sesuai dengan format yang diperlukan
3. Pastikan data koordinat dalam format angka desimal

**Jika peta tidak muncul:**
1. Pastikan koneksi internet aktif (untuk loading tile peta)
2. Refresh halaman browser
3. Coba browser yang berbeda

---

**Dibuat dengan ❤️ untuk pemetaan jembatan Indonesia** 