# 📱 Cara Test Import di Mobile

## 🎯 Langkah-langkah Testing

### **Step 1: Buka Aplikasi di Mobile**
1. Buka browser (Chrome/Safari)
2. Akses aplikasi DompetKu
3. **Akan muncul icon console** di pojok kanan bawah (Eruda)
4. Tap icon tersebut untuk buka console

### **Step 2: Download Template**
1. Login ke aplikasi
2. Klik menu **Laporan**
3. Klik tombol **Import** (icon upload)
4. Klik **"Download Template CSV"**
5. File `DompetKu_Template.csv` akan terdownload

### **Step 3: Coba Import Template**
1. Masih di modal Import
2. Klik button **"Pilih File CSV atau Excel"**
3. **File picker akan muncul**
4. Pilih file `DompetKu_Template.csv` yang baru didownload
5. **Lihat console** (tap icon Eruda)

### **Step 4: Baca Console Log**

**Jika BERHASIL, Anda akan lihat:**
```
📂 File input changed
✅ File selected: {name: "DompetKu_Template.csv", ...}
📁 File selected: DompetKu_Template.csv Size: XXX Type: text/csv
📖 Reading as text...
✅ File loaded successfully
📄 Parsing CSV...
CSV content length: XXX
Parsed CSV rows: 5
📋 Total rows parsed: 5
✅ Valid transactions: 5
🎉 Import preview ready!
```

**Jika GAGAL, akan ada error message:**
```
❌ FileReader error: ...
atau
❌ Import error: ...
atau
⚠️ No file selected
```

---

## 🔍 Troubleshooting Berdasarkan Log

### ❌ Log: "No file selected"
**Masalah:** File picker tidak return file
**Solusi:**
1. Coba tap button lagi
2. Coba tap dan tahan
3. Coba browser lain (Chrome/Safari)
4. Restart browser

### ❌ Log: "FileReader error"
**Masalah:** Browser tidak bisa baca file
**Solusi:**
1. Cek permission browser untuk akses file
2. Coba file lain
3. Coba convert ke CSV plain text
4. Restart browser

### ❌ Log: "XLSX library not loaded"
**Masalah:** Library Excel tidak load
**Solusi:**
1. Refresh halaman (pull down)
2. Clear cache browser
3. Cek koneksi internet
4. Tunggu beberapa detik dan coba lagi

### ❌ Log: "File kosong atau format tidak valid"
**Masalah:** File tidak bisa di-parse
**Solusi:**
1. Buka file di text editor, pastikan ada isi
2. Pastikan format CSV benar
3. Coba download template lagi
4. Jangan edit di Excel mobile (gunakan Google Sheets)

### ❌ Log: "Tidak ada data valid"
**Masalah:** Data tidak lolos validasi
**Solusi:**
1. Cek format tanggal: `YYYY-MM-DD`
2. Cek tipe: `pemasukan` atau `pengeluaran` (lowercase)
3. Cek amount: harus angka
4. Gunakan template yang sudah didownload

---

## 📝 Test Manual

Jika masih gagal, coba test manual di console:

### Test 1: Cek XLSX Library
Buka console Eruda, ketik:
```javascript
typeof XLSX
```
Harus return: `"object"`

### Test 2: Cek File Input
```javascript
const input = document.getElementById('import-file-input');
console.log('Input element:', input);
console.log('Accept:', input.accept);
```

### Test 3: Test FileReader
```javascript
// Pilih file dulu, lalu jalankan:
const input = document.getElementById('import-file-input');
const file = input.files[0];
console.log('File:', file);

if (file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    console.log('SUCCESS! Content:', e.target.result.substring(0, 200));
  };
  reader.onerror = (e) => {
    console.error('ERROR!', e);
  };
  reader.readAsText(file);
}
```

---

## 🎬 Video Tutorial (Simulasi)

### Android Chrome:
```
1. Buka DompetKu
2. Lihat icon console pojok kanan bawah (🐛)
3. Tap icon → Console tab
4. Klik Import button
5. Klik "Pilih File"
6. Pilih DompetKu_Template.csv
7. Lihat log di console
8. Jika ada preview → SUCCESS ✅
9. Jika ada error → Screenshot dan kirim
```

### iOS Safari:
```
1. Buka DompetKu
2. Lihat icon console pojok kanan bawah (🐛)
3. Tap icon → Console tab
4. Klik Import button
5. Klik "Pilih File"
6. Browse Files → Downloads
7. Pilih DompetKu_Template.csv
8. Lihat log di console
9. Jika ada preview → SUCCESS ✅
10. Jika ada error → Screenshot dan kirim
```

---

## 📊 Expected Behavior

### ✅ BERHASIL:
1. Button "Pilih File" diklik → File picker muncul
2. File dipilih → Nama file muncul di button
3. Console log muncul → Parsing berhasil
4. Preview muncul → Tabel dengan 5 transaksi
5. Button "Import Transaksi" aktif (tidak disabled)
6. Klik Import → Toast "Berhasil mengimpor 5 transaksi"

### ❌ GAGAL:
1. Button diklik → File picker tidak muncul
2. File dipilih → Tidak ada response
3. Console log error
4. Preview tidak muncul
5. Button "Import Transaksi" tetap disabled

---

## 🚀 Jika Berhasil

Setelah import berhasil:
1. Close modal
2. Lihat di halaman Transaksi
3. Seharusnya ada 5 transaksi baru
4. Cek di Dashboard → Saldo berubah
5. Cek di Laporan → Chart berubah

---

## 📸 Screenshot yang Dibutuhkan (Jika Gagal)

Kirim screenshot:
1. **Console log** lengkap (dari Eruda)
2. **Modal import** (button dan preview)
3. **File picker** (jika muncul)
4. **Browser info**: Settings → About

Info tambahan:
- Device: (contoh: Samsung A52, iPhone 13)
- OS: (contoh: Android 12, iOS 16)
- Browser: (contoh: Chrome 120, Safari 16)
- File yang dicoba: (contoh: DompetKu_Template.csv)

---

## 💡 Tips Penting

1. **Gunakan template** yang didownload dari aplikasi
2. **Jangan edit** file di Excel mobile (corrupt encoding)
3. **Gunakan Google Sheets** jika mau edit di mobile
4. **Export as CSV** dari Google Sheets
5. **File size** jangan lebih dari 1MB
6. **Koneksi internet** harus stabil (untuk load library)
7. **Clear cache** jika ada masalah
8. **Restart browser** jika masih gagal

---

## 🔄 Alternative: Import via Desktop

Jika mobile tetap gagal:
1. Download template di mobile
2. Transfer ke laptop/PC
3. Import di laptop
4. Data akan sync (karena localStorage per browser)

Atau:
1. Edit di Google Sheets di mobile
2. Share link ke laptop
3. Download CSV di laptop
4. Import di laptop

---

**Status:** Ready for Testing
**Version:** 1.2.0 (with Eruda Console)
**Date:** 2026-05-08

---

## 📞 Support

Jika masih ada masalah setelah testing:
1. Screenshot console log
2. Screenshot modal import
3. Info device & browser
4. File yang dicoba

Kirim ke developer untuk analisis lebih lanjut.
