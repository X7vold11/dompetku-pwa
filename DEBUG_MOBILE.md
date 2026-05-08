# 🔍 Debug Import di Mobile

## Cara Debug di Mobile

### **Android Chrome:**

1. **Buka Chrome di laptop**
2. **Connect HP ke laptop** via USB
3. **Enable USB Debugging** di HP:
   - Settings → Developer Options → USB Debugging (ON)
4. **Buka Chrome di laptop** → `chrome://inspect`
5. **Pilih device** Anda
6. **Klik "Inspect"** pada tab DompetKu
7. **Buka Console** tab
8. **Coba import file** di HP
9. **Lihat log** di console laptop

### **iOS Safari:**

1. **Enable Web Inspector** di iPhone:
   - Settings → Safari → Advanced → Web Inspector (ON)
2. **Connect iPhone ke Mac** via USB
3. **Buka Safari di Mac**
4. **Menu Develop** → Pilih iPhone Anda → Pilih tab DompetKu
5. **Lihat Console**
6. **Coba import** di iPhone
7. **Lihat log** di console Mac

### **Tanpa Kabel (Remote Debugging):**

Gunakan **Eruda** (console di mobile):

Tambahkan di `index.html` sebelum `</body>`:

```html
<!-- Debug Console untuk Mobile -->
<script src="https://cdn.jsdelivr.net/npm/eruda"></script>
<script>eruda.init();</script>
```

Refresh halaman, akan muncul icon console di pojok kanan bawah.

---

## 🔍 Yang Harus Dicek

### 1. **Apakah file input ter-trigger?**
Cari log: `📂 File input changed`

**Jika TIDAK muncul:**
- Button tidak trigger file input
- Coba tap lebih lama
- Coba di browser lain

### 2. **Apakah file ter-select?**
Cari log: `✅ File selected: {...}`

**Jika TIDAK muncul:**
- File picker tidak return file
- Permission issue
- Browser compatibility issue

### 3. **Apakah file ter-load?**
Cari log: `✅ File loaded successfully`

**Jika TIDAK muncul:**
- FileReader error
- File corrupt
- Memory issue

### 4. **Apakah parsing berhasil?**
Cari log: `📋 Total rows parsed: X`

**Jika TIDAK muncul:**
- Format file salah
- Encoding issue
- Parser error

### 5. **Apakah ada data valid?**
Cari log: `✅ Valid transactions: X`

**Jika 0:**
- Data tidak sesuai format
- Validasi gagal
- Cek format tanggal, tipe, amount

---

## 🐛 Error Messages

### Error: "XLSX library not loaded"
**Solusi:**
- Refresh halaman
- Clear cache
- Cek koneksi internet (library dari CDN)

### Error: "File kosong atau format tidak valid"
**Solusi:**
- Buka file di text editor, pastikan ada data
- Pastikan ada header row
- Pastikan minimal 2 baris (header + data)

### Error: "Tidak ada data valid untuk diimpor"
**Solusi:**
- Cek format tanggal: harus `YYYY-MM-DD`
- Cek tipe: harus `pemasukan` atau `pengeluaran` (lowercase)
- Cek amount: harus angka positif
- Cek kategori: harus sesuai yang tersedia

---

## 📝 Test File

Buat file `test.csv` dengan isi ini:

```csv
Tanggal,Tipe,Kategori,Deskripsi,Jumlah
2026-05-08,pengeluaran,Makan,Test import,10000
```

Save dan coba import.

---

## 🔧 Quick Fixes

### Fix 1: Tambah Eruda Console
```html
<!-- Tambahkan sebelum </body> di index.html -->
<script src="https://cdn.jsdelivr.net/npm/eruda"></script>
<script>eruda.init();</script>
```

### Fix 2: Cek XLSX Library
Buka console dan ketik:
```javascript
typeof XLSX
```

Harus return `"object"`. Jika `"undefined"`, library tidak load.

### Fix 3: Test FileReader
```javascript
const input = document.getElementById('import-file-input');
input.addEventListener('change', (e) => {
  const file = e.target.files[0];
  console.log('File:', file);
  
  const reader = new FileReader();
  reader.onload = (e) => {
    console.log('Loaded:', e.target.result.substring(0, 100));
  };
  reader.readAsText(file);
});
```

---

## 📊 Expected Console Output

Jika berhasil, Anda akan lihat:

```
📂 File input changed
✅ File selected: {name: "test.csv", size: 123, type: "text/csv", ...}
📁 File selected: test.csv Size: 123 Type: text/csv
📖 Reading as text...
✅ File loaded successfully
📄 Parsing CSV...
CSV content length: 123
Parsed CSV rows: 1
📋 Total rows parsed: 1
✅ Valid transactions: 1
🎉 Import preview ready!
```

---

## 🚨 Common Issues

### Issue 1: File picker tidak muncul
**Penyebab:** Browser security, permission
**Solusi:** 
- Gunakan HTTPS (bukan HTTP)
- Allow file access di browser settings
- Coba browser lain

### Issue 2: File tidak bisa dipilih
**Penyebab:** File type restriction
**Solusi:**
- Pastikan file .csv atau .xlsx
- Rename file jika perlu
- Coba convert ke CSV

### Issue 3: Import button disabled
**Penyebab:** Validasi gagal
**Solusi:**
- Lihat console untuk error
- Cek format data
- Gunakan template yang didownload

---

## 📱 Browser Compatibility

| Browser | Android | iOS | Status |
|---------|---------|-----|--------|
| Chrome | ✅ | ✅ | Supported |
| Firefox | ✅ | ❌ | Android only |
| Safari | ❌ | ✅ | iOS only |
| Edge | ✅ | ❌ | Android only |
| Samsung Internet | ✅ | ❌ | Android only |

---

## 💡 Tips

1. **Gunakan Chrome** di Android untuk best compatibility
2. **Gunakan Safari** di iOS (browser default)
3. **File size** jangan terlalu besar (max 1MB recommended)
4. **Format CSV** lebih reliable daripada Excel di mobile
5. **Test dengan template** yang sudah didownload dulu

---

## 📞 Jika Masih Gagal

Kirim screenshot console log dengan info:
- Device: (Android/iOS)
- Browser: (Chrome/Safari/etc)
- Browser version
- File type yang dicoba
- Console log lengkap

---

**Last Updated:** 2026-05-08
