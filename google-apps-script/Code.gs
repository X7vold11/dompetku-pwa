/* =====================================================
   DompetKu - Google Apps Script Backend
   =====================================================
   
   CARA SETUP:
   1. Buka https://script.google.com
   2. Buat project baru
   3. Copy-paste seluruh kode ini ke Code.gs
   4. Jalankan fungsi setSecretToken() sekali untuk set password
   5. Klik Deploy > New Deployment
   6. Pilih type: Web app
   7. Execute as: Me
   8. Who has access: Anyone
   9. Klik Deploy, lalu copy URL web app
   10. Paste URL + token di Pengaturan DompetKu
   ===================================================== */

// ID Spreadsheet akan otomatis dibuat saat pertama kali dijalankan
const SPREADSHEET_ID_KEY = 'DOMPETKU_SPREADSHEET_ID';
const SECRET_TOKEN_KEY = 'DOMPETKU_SECRET_TOKEN';

/**
 * JALANKAN FUNGSI INI SEKALI untuk mengatur token rahasia.
 * Ganti 'GANTI_DENGAN_PASSWORD_KAMU' dengan password yang kamu inginkan.
 * Setelah dijalankan, token tersimpan di Script Properties.
 */
function setSecretToken() {
  const TOKEN = 'GANTI_DENGAN_PASSWORD_KAMU'; // <-- GANTI INI!
  PropertiesService.getScriptProperties().setProperty(SECRET_TOKEN_KEY, TOKEN);
  Logger.log('✅ Token berhasil disimpan: ' + TOKEN);
}

/**
 * Validasi token dari request
 */
function validateToken(token) {
  const savedToken = PropertiesService.getScriptProperties().getProperty(SECRET_TOKEN_KEY);
  // Jika belum set token, izinkan semua (backward compatible)
  if (!savedToken) return true;
  return token === savedToken;
}

function unauthorizedResponse() {
  return ContentService
    .createTextOutput(JSON.stringify({ success: false, error: 'Unauthorized: Token tidak valid' }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Mendapatkan atau membuat spreadsheet baru
 */
function getOrCreateSpreadsheet() {
  const props = PropertiesService.getScriptProperties();
  let ssId = props.getProperty(SPREADSHEET_ID_KEY);
  
  if (ssId) {
    try {
      return SpreadsheetApp.openById(ssId);
    } catch (e) {
      // Spreadsheet mungkin dihapus, buat baru
    }
  }
  
  // Buat spreadsheet baru
  const ss = SpreadsheetApp.create('DompetKu Data');
  props.setProperty(SPREADSHEET_ID_KEY, ss.getId());
  
  // Setup sheets
  setupSheets(ss);
  
  return ss;
}

/**
 * JALANKAN FUNGSI INI untuk mempercantik tampilan Spreadsheet yang sudah ada
 * Fungsi ini tidak akan menghapus data kamu, hanya mengatur warna dan ukuran tabel.
 */
function formatSpreadsheet() {
  const ss = getOrCreateSpreadsheet();
  
  const formatHeader = (sheet, cols) => {
    if (!sheet) return;
    const range = sheet.getRange(1, 1, 1, cols);
    range.setFontWeight('bold');
    range.setBackground('#7C3AED'); // Primary color DompetKu
    range.setFontColor('#FFFFFF');
    range.setHorizontalAlignment('center');
    sheet.setFrozenRows(1); // Bekukan baris pertama
  };

  const trxSheet = ss.getSheetByName('Transactions');
  if (trxSheet) {
    formatHeader(trxSheet, 8);
    trxSheet.setTabColor('#10B981'); // Tab hijau
    trxSheet.setColumnWidth(1, 120);
    trxSheet.setColumnWidth(3, 110);
    trxSheet.setColumnWidth(4, 130);
    trxSheet.setColumnWidth(6, 250);
    trxSheet.setColumnWidth(7, 120);
    trxSheet.setColumnWidth(8, 180);
  }
  
  const budgetSheet = ss.getSheetByName('Budgets');
  if (budgetSheet) {
    formatHeader(budgetSheet, 3);
    budgetSheet.setTabColor('#2563EB'); // Tab biru
    budgetSheet.setColumnWidth(1, 120);
    budgetSheet.setColumnWidth(2, 150);
    budgetSheet.setColumnWidth(3, 120);
  }
  
  const settingsSheet = ss.getSheetByName('Settings');
  if (settingsSheet) {
    formatHeader(settingsSheet, 2);
    settingsSheet.setTabColor('#64748B'); // Tab abu-abu
    settingsSheet.setColumnWidth(1, 150);
    settingsSheet.setColumnWidth(2, 250);
  }
  
  Logger.log('✨ Tampilan Spreadsheet berhasil dipercantik!');
}

/**
 * Setup sheet structure untuk spreadsheet baru
 */
function setupSheets(ss) {
  // Sheet 1: Transactions
  let trxSheet = ss.getSheetByName('Transactions');
  if (!trxSheet) {
    trxSheet = ss.getSheets()[0];
    trxSheet.setName('Transactions');
  }
  trxSheet.clear();
  trxSheet.getRange(1, 1, 1, 8).setValues([
    ['id', 'type', 'amount', 'category', 'emoji', 'description', 'date', 'createdAt']
  ]);
  
  // Sheet 2: Budgets
  let budgetSheet = ss.getSheetByName('Budgets');
  if (!budgetSheet) {
    budgetSheet = ss.insertSheet('Budgets');
  }
  budgetSheet.clear();
  budgetSheet.getRange(1, 1, 1, 3).setValues([
    ['id', 'category', 'amount']
  ]);
  
  // Sheet 3: Settings
  let settingsSheet = ss.getSheetByName('Settings');
  if (!settingsSheet) {
    settingsSheet = ss.insertSheet('Settings');
  }
  settingsSheet.clear();
  settingsSheet.getRange(1, 1, 1, 2).setValues([
    ['key', 'value']
  ]);
  
  // Default settings
  settingsSheet.getRange(2, 1, 3, 2).setValues([
    ['name', 'Mahasiswa'],
    ['avatar', '🎓'],
    ['darkMode', 'true']
  ]);
  
  // Aplikasikan warna & ukuran kolom
  formatSpreadsheet();
}

/**
 * GET Request Handler
 */
function doGet(e) {
  try {
    // Validasi token
    const token = e.parameter.token || '';
    if (!validateToken(token)) return unauthorizedResponse();

    const action = e.parameter.action || '';
    const ss = getOrCreateSpreadsheet();
    let result;
    
    switch (action) {
      case 'getTransactions':
        result = getSheetData(ss, 'Transactions');
        break;
      case 'getBudgets':
        result = getSheetData(ss, 'Budgets');
        break;
      case 'getSettings':
        result = getSettingsData(ss);
        break;
      case 'getAll':
        result = {
          transactions: getSheetData(ss, 'Transactions'),
          budgets: getSheetData(ss, 'Budgets'),
          settings: getSettingsData(ss)
        };
        break;
      case 'ping':
        result = { status: 'ok', timestamp: new Date().toISOString() };
        break;
      default:
        result = { error: 'Unknown action: ' + action };
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({ success: true, data: result }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * POST Request Handler
 */
function doPost(e) {
  try {
    let body;
    try {
      body = JSON.parse(e.postData.contents);
    } catch (parseError) {
      // Fallback: try form data
      body = e.parameter;
    }
    
    // Validasi token
    const token = body.token || e.parameter.token || '';
    if (!validateToken(token)) return unauthorizedResponse();

    const action = body.action || '';
    const ss = getOrCreateSpreadsheet();
    let result;
    
    switch (action) {
      case 'addTransaction':
        result = addTransaction(ss, body.data);
        break;
      case 'deleteTransaction':
        result = deleteTransaction(ss, body.id);
        break;
      case 'syncTransactions':
        result = syncTransactions(ss, body.data);
        break;
      case 'setBudget':
        result = setBudget(ss, body.data);
        break;
      case 'deleteBudget':
        result = deleteBudget(ss, body.category);
        break;
      case 'syncBudgets':
        result = syncBudgets(ss, body.data);
        break;
      case 'updateSettings':
        result = updateSettings(ss, body.data);
        break;
      case 'syncAll':
        result = syncAll(ss, body.data);
        break;
      case 'clearAll':
        result = clearAllData(ss);
        break;
      default:
        result = { error: 'Unknown action: ' + action };
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({ success: true, data: result }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/* =====================================================
   TRANSACTION OPERATIONS
   ===================================================== */

function addTransaction(ss, trx) {
  const sheet = ss.getSheetByName('Transactions');
  if (!sheet) throw new Error('Sheet Transactions not found');
  
  sheet.appendRow([
    trx.id || Date.now().toString(),
    trx.type,
    trx.amount,
    trx.category,
    trx.emoji || '',
    trx.description || '',
    trx.date,
    trx.createdAt || new Date().toISOString()
  ]);
  
  return { added: true, id: trx.id };
}

function deleteTransaction(ss, id) {
  const sheet = ss.getSheetByName('Transactions');
  if (!sheet) throw new Error('Sheet Transactions not found');
  
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      sheet.deleteRow(i + 1);
      return { deleted: true, id: id };
    }
  }
  return { deleted: false, id: id, message: 'Not found' };
}

function syncTransactions(ss, transactions) {
  const sheet = ss.getSheetByName('Transactions');
  if (!sheet) throw new Error('Sheet Transactions not found');
  
  // Clear existing data (keep header)
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, 8).clear();
  }
  
  // Write all transactions
  if (transactions && transactions.length > 0) {
    const rows = transactions.map(trx => [
      trx.id || Date.now().toString(),
      trx.type,
      trx.amount,
      trx.category,
      trx.emoji || '',
      trx.description || '',
      trx.date,
      trx.createdAt || new Date().toISOString()
    ]);
    sheet.getRange(2, 1, rows.length, 8).setValues(rows);
  }
  
  return { synced: true, count: (transactions || []).length };
}

/* =====================================================
   BUDGET OPERATIONS
   ===================================================== */

function setBudget(ss, budget) {
  const sheet = ss.getSheetByName('Budgets');
  if (!sheet) throw new Error('Sheet Budgets not found');
  
  const data = sheet.getDataRange().getValues();
  
  // Check if category exists, update it
  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === budget.category) {
      sheet.getRange(i + 1, 3).setValue(budget.amount);
      return { updated: true, category: budget.category };
    }
  }
  
  // Category not found, add new row
  sheet.appendRow([
    budget.id || Date.now().toString(),
    budget.category,
    budget.amount
  ]);
  
  return { added: true, category: budget.category };
}

function deleteBudget(ss, category) {
  const sheet = ss.getSheetByName('Budgets');
  if (!sheet) throw new Error('Sheet Budgets not found');
  
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === category) {
      sheet.deleteRow(i + 1);
      return { deleted: true, category: category };
    }
  }
  return { deleted: false, category: category, message: 'Not found' };
}

function syncBudgets(ss, budgets) {
  const sheet = ss.getSheetByName('Budgets');
  if (!sheet) throw new Error('Sheet Budgets not found');
  
  // Clear existing data (keep header)
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, 3).clear();
  }
  
  // Write all budgets
  if (budgets && budgets.length > 0) {
    const rows = budgets.map(b => [
      b.id || Date.now().toString(),
      b.category,
      b.amount
    ]);
    sheet.getRange(2, 1, rows.length, 3).setValues(rows);
  }
  
  return { synced: true, count: (budgets || []).length };
}

/* =====================================================
   SETTINGS OPERATIONS
   ===================================================== */

function getSettingsData(ss) {
  const sheet = ss.getSheetByName('Settings');
  if (!sheet) return {};
  
  const data = sheet.getDataRange().getValues();
  const settings = {};
  
  for (let i = 1; i < data.length; i++) {
    const key = data[i][0];
    let value = data[i][1];
    
    // Parse boolean values
    if (value === 'true') value = true;
    else if (value === 'false') value = false;
    // Parse numbers
    else if (!isNaN(value) && value !== '') value = Number(value);
    
    if (key) settings[key] = value;
  }
  
  return settings;
}

function updateSettings(ss, settings) {
  const sheet = ss.getSheetByName('Settings');
  if (!sheet) throw new Error('Sheet Settings not found');
  
  const data = sheet.getDataRange().getValues();
  
  Object.keys(settings).forEach(key => {
    let found = false;
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === key) {
        sheet.getRange(i + 1, 2).setValue(String(settings[key]));
        found = true;
        break;
      }
    }
    if (!found) {
      sheet.appendRow([key, String(settings[key])]);
    }
  });
  
  return { updated: true };
}

/* =====================================================
   SYNC ALL & CLEAR
   ===================================================== */

function syncAll(ss, data) {
  const results = {};
  
  if (data.transactions !== undefined) {
    results.transactions = syncTransactions(ss, data.transactions);
  }
  if (data.budgets !== undefined) {
    results.budgets = syncBudgets(ss, data.budgets);
  }
  if (data.settings !== undefined) {
    results.settings = updateSettings(ss, data.settings);
  }
  
  return results;
}

function clearAllData(ss) {
  // Clear Transactions (keep header)
  const trxSheet = ss.getSheetByName('Transactions');
  if (trxSheet && trxSheet.getLastRow() > 1) {
    trxSheet.getRange(2, 1, trxSheet.getLastRow() - 1, 8).clear();
  }
  
  // Clear Budgets (keep header)
  const budgetSheet = ss.getSheetByName('Budgets');
  if (budgetSheet && budgetSheet.getLastRow() > 1) {
    budgetSheet.getRange(2, 1, budgetSheet.getLastRow() - 1, 3).clear();
  }
  
  // Reset Settings to default
  const settingsSheet = ss.getSheetByName('Settings');
  if (settingsSheet) {
    const lastRow = settingsSheet.getLastRow();
    if (lastRow > 1) {
      settingsSheet.getRange(2, 1, lastRow - 1, 2).clear();
    }
    settingsSheet.getRange(2, 1, 3, 2).setValues([
      ['name', 'Mahasiswa'],
      ['avatar', '🎓'],
      ['darkMode', 'true']
    ]);
  }
  
  return { cleared: true };
}

/* =====================================================
   HELPER: Read Sheet Data
   ===================================================== */

function getSheetData(ss, sheetName) {
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return []; // Only header
  
  const headers = data[0];
  const result = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = {};
    let hasData = false;
    headers.forEach((header, j) => {
      if (data[i][j] !== '' && data[i][j] !== null && data[i][j] !== undefined) {
        hasData = true;
      }
      row[header] = data[i][j];
    });
    // Only add rows that have some data
    if (hasData) {
      // Ensure amount is a number
      if (row.amount !== undefined) {
        row.amount = Number(row.amount);
      }
      // Ensure id is string
      if (row.id !== undefined) {
        row.id = String(row.id);
      }
      result.push(row);
    }
  }
  
  return result;
}

/* =====================================================
   INITIAL SETUP (Run once manually)
   ===================================================== */

function initialSetup() {
  const ss = getOrCreateSpreadsheet();
  Logger.log('Spreadsheet created/found: ' + ss.getUrl());
  Logger.log('Spreadsheet ID: ' + ss.getId());
}
