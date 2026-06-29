/* =====================================================
   DompetKu - Google Sheets Sync Layer
   =====================================================
   Handles communication between the app and Google 
   Apps Script Web App. Supports offline queue and 
   automatic sync when back online.
   ===================================================== */

const SheetsSync = {
  STORAGE_KEY_URL: 'dompetku_webapp_url',
  STORAGE_KEY_TOKEN: 'dompetku_webapp_token',
  STORAGE_KEY_PENDING: 'dompetku_pending_sync',
  STORAGE_KEY_LAST_SYNC: 'dompetku_last_sync',

  _syncing: false,
  _listeners: [],

  /* ---- Configuration ---- */
  getWebAppUrl() {
    return localStorage.getItem(this.STORAGE_KEY_URL) || '';
  },

  setWebAppUrl(url) {
    localStorage.setItem(this.STORAGE_KEY_URL, url.trim());
  },

  isConfigured() {
    return !!this.getWebAppUrl();
  },

  getToken() {
    return localStorage.getItem(this.STORAGE_KEY_TOKEN) || '';
  },

  setToken(token) {
    localStorage.setItem(this.STORAGE_KEY_TOKEN, token.trim());
  },

  isOnline() {
    return navigator.onLine;
  },

  getLastSync() {
    return localStorage.getItem(this.STORAGE_KEY_LAST_SYNC) || null;
  },

  _setLastSync() {
    const now = new Date().toISOString();
    localStorage.setItem(this.STORAGE_KEY_LAST_SYNC, now);
    return now;
  },

  /* ---- Status Listeners ---- */
  onSyncStatusChange(fn) {
    this._listeners.push(fn);
  },

  _notifyStatus(status, message) {
    // status: 'syncing' | 'success' | 'error' | 'offline' | 'idle'
    this._listeners.forEach(fn => fn(status, message));
  },

  /* ---- HTTP Helpers ---- */
  async fetchFromSheets(action, params = {}) {
    const url = this.getWebAppUrl();
    if (!url) throw new Error('Web App URL belum diatur');

    const token = this.getToken();
    const queryParams = new URLSearchParams({ action, token, ...params });
    const fullUrl = `${url}?${queryParams.toString()}`;

    const response = await fetch(fullUrl, {
      method: 'GET',
      redirect: 'follow',
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const json = await response.json();
    if (!json.success) throw new Error(json.error || 'Unknown error');
    return json.data;
  },

  async postToSheets(action, data = {}) {
    const url = this.getWebAppUrl();
    if (!url) throw new Error('Web App URL belum diatur');

    const token = this.getToken();
    const response = await fetch(url, {
      method: 'POST',
      redirect: 'follow',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action, token, ...data }),
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const json = await response.json();
    if (!json.success) throw new Error(json.error || 'Unknown error');
    return json.data;
  },

  /* ---- Pending Queue (Offline Support) ---- */
  _getPendingQueue() {
    return JSON.parse(localStorage.getItem(this.STORAGE_KEY_PENDING) || '[]');
  },

  _savePendingQueue(queue) {
    localStorage.setItem(this.STORAGE_KEY_PENDING, JSON.stringify(queue));
  },

  _addToPending(action, data) {
    const queue = this._getPendingQueue();
    queue.push({ action, data, timestamp: Date.now() });
    this._savePendingQueue(queue);
  },

  _clearPendingQueue() {
    localStorage.removeItem(this.STORAGE_KEY_PENDING);
  },

  hasPendingChanges() {
    return this._getPendingQueue().length > 0;
  },

  /* ---- Flush Pending Queue ---- */
  async flushPendingQueue() {
    if (!this.isConfigured() || !this.isOnline()) return;

    const queue = this._getPendingQueue();
    if (queue.length === 0) return;

    this._notifyStatus('syncing', 'Mengirim data tertunda...');

    const failedItems = [];
    for (const item of queue) {
      try {
        await this.postToSheets(item.action, item.data);
      } catch (err) {
        console.warn('Failed to sync pending item:', err);
        failedItems.push(item);
      }
    }

    this._savePendingQueue(failedItems);

    if (failedItems.length === 0) {
      this._notifyStatus('success', 'Data tertunda berhasil disinkronkan');
    } else {
      this._notifyStatus('error', `${failedItems.length} item gagal disinkronkan`);
    }
  },

  /* ---- Push Operations (with offline fallback) ---- */
  async pushTransaction(trx) {
    if (!this.isConfigured()) return;

    if (!this.isOnline()) {
      this._addToPending('addTransaction', { data: trx });
      this._notifyStatus('offline', 'Tersimpan offline, akan sync saat online');
      return;
    }

    try {
      this._notifyStatus('syncing', 'Menyimpan transaksi...');
      await this.postToSheets('addTransaction', { data: trx });
      this._setLastSync();
      this._notifyStatus('success', 'Transaksi tersimpan ke Sheets');
    } catch (err) {
      console.error('Push transaction failed:', err);
      this._addToPending('addTransaction', { data: trx });
      this._notifyStatus('error', 'Gagal sync, disimpan ke antrian');
    }
  },

  async pushDeleteTransaction(id) {
    if (!this.isConfigured()) return;

    if (!this.isOnline()) {
      this._addToPending('deleteTransaction', { id });
      this._notifyStatus('offline', 'Tersimpan offline');
      return;
    }

    try {
      this._notifyStatus('syncing', 'Menghapus transaksi...');
      await this.postToSheets('deleteTransaction', { id });
      this._setLastSync();
      this._notifyStatus('success', 'Transaksi dihapus dari Sheets');
    } catch (err) {
      console.error('Push delete transaction failed:', err);
      this._addToPending('deleteTransaction', { id });
      this._notifyStatus('error', 'Gagal sync, disimpan ke antrian');
    }
  },

  async pushBudget(category, amount, id) {
    if (!this.isConfigured()) return;

    const data = { category, amount, id: id || Date.now().toString() };

    if (!this.isOnline()) {
      this._addToPending('setBudget', { data });
      this._notifyStatus('offline', 'Tersimpan offline');
      return;
    }

    try {
      this._notifyStatus('syncing', 'Menyimpan anggaran...');
      await this.postToSheets('setBudget', { data });
      this._setLastSync();
      this._notifyStatus('success', 'Anggaran tersimpan ke Sheets');
    } catch (err) {
      console.error('Push budget failed:', err);
      this._addToPending('setBudget', { data });
      this._notifyStatus('error', 'Gagal sync, disimpan ke antrian');
    }
  },

  async pushDeleteBudget(category) {
    if (!this.isConfigured()) return;

    if (!this.isOnline()) {
      this._addToPending('deleteBudget', { category });
      this._notifyStatus('offline', 'Tersimpan offline');
      return;
    }

    try {
      this._notifyStatus('syncing', 'Menghapus anggaran...');
      await this.postToSheets('deleteBudget', { category });
      this._setLastSync();
      this._notifyStatus('success', 'Anggaran dihapus dari Sheets');
    } catch (err) {
      console.error('Push delete budget failed:', err);
      this._addToPending('deleteBudget', { category });
      this._notifyStatus('error', 'Gagal sync, disimpan ke antrian');
    }
  },

  async pushSettings(settings) {
    if (!this.isConfigured()) return;

    if (!this.isOnline()) {
      this._addToPending('updateSettings', { data: settings });
      this._notifyStatus('offline', 'Tersimpan offline');
      return;
    }

    try {
      this._notifyStatus('syncing', 'Menyimpan pengaturan...');
      await this.postToSheets('updateSettings', { data: settings });
      this._setLastSync();
      this._notifyStatus('success', 'Pengaturan tersimpan ke Sheets');
    } catch (err) {
      console.error('Push settings failed:', err);
      this._addToPending('updateSettings', { data: settings });
      this._notifyStatus('error', 'Gagal sync');
    }
  },

  async pushClearAll() {
    if (!this.isConfigured()) return;

    if (!this.isOnline()) {
      this._addToPending('clearAll', {});
      this._notifyStatus('offline', 'Tersimpan offline');
      return;
    }

    try {
      this._notifyStatus('syncing', 'Menghapus semua data...');
      await this.postToSheets('clearAll', {});
      this._setLastSync();
      this._notifyStatus('success', 'Semua data dihapus dari Sheets');
    } catch (err) {
      console.error('Push clearAll failed:', err);
      this._addToPending('clearAll', {});
      this._notifyStatus('error', 'Gagal sync');
    }
  },

  /* ---- Pull from Sheets (Sheets wins) ---- */
  async pullFromSheets() {
    if (!this.isConfigured() || !this.isOnline()) {
      this._notifyStatus('error', 'Tidak dapat pull: offline atau URL belum diatur');
      return false;
    }

    try {
      this._syncing = true;
      this._notifyStatus('syncing', 'Mengambil data dari Sheets...');

      const allData = await this.fetchFromSheets('getAll');

      // Sheets wins: replace localStorage with Sheets data
      if (allData.transactions !== undefined) {
        // Sort transactions by createdAt (newest first)
        const sortedTrx = (allData.transactions || []).sort((a, b) => {
          return new Date(b.createdAt) - new Date(a.createdAt);
        });
        DB.saveTransactions(sortedTrx);
      }

      if (allData.budgets !== undefined) {
        DB.saveBudgets(allData.budgets || []);
      }

      if (allData.settings !== undefined && Object.keys(allData.settings).length > 0) {
        DB.saveSettings(allData.settings);
      }

      const lastSync = this._setLastSync();
      this._syncing = false;
      this._notifyStatus('success', 'Data berhasil diambil dari Sheets');
      return true;
    } catch (err) {
      console.error('Pull from Sheets failed:', err);
      this._syncing = false;
      this._notifyStatus('error', 'Gagal mengambil data: ' + err.message);
      return false;
    }
  },

  /* ---- Full Push to Sheets ---- */
  async pushAllToSheets() {
    if (!this.isConfigured() || !this.isOnline()) {
      this._notifyStatus('error', 'Tidak dapat push: offline atau URL belum diatur');
      return false;
    }

    try {
      this._syncing = true;
      this._notifyStatus('syncing', 'Mengunggah semua data ke Sheets...');

      const transactions = DB.getTransactions();
      const budgets = DB.getBudgets();
      const settings = DB.getSettings();

      await this.postToSheets('syncAll', {
        data: { transactions, budgets, settings }
      });

      // Clear pending queue after successful full push
      this._clearPendingQueue();

      const lastSync = this._setLastSync();
      this._syncing = false;
      this._notifyStatus('success', 'Semua data berhasil diunggah ke Sheets');
      return true;
    } catch (err) {
      console.error('Push all to Sheets failed:', err);
      this._syncing = false;
      this._notifyStatus('error', 'Gagal mengunggah data: ' + err.message);
      return false;
    }
  },

  /* ---- Full Sync (Pull from Sheets, Sheets wins) ---- */
  async syncAll() {
    if (!this.isConfigured()) {
      this._notifyStatus('error', 'URL Web App belum diatur');
      return false;
    }

    if (!this.isOnline()) {
      this._notifyStatus('offline', 'Tidak ada koneksi internet');
      return false;
    }

    // First flush any pending changes
    await this.flushPendingQueue();

    // Then pull from Sheets (Sheets wins)
    return await this.pullFromSheets();
  },

  /* ---- Test Connection ---- */
  async testConnection() {
    if (!this.isConfigured()) {
      return { success: false, message: 'URL Web App belum diatur' };
    }

    try {
      this._notifyStatus('syncing', 'Menguji koneksi...');
      const result = await this.fetchFromSheets('ping');
      this._notifyStatus('success', 'Koneksi berhasil!');
      return { success: true, message: 'Koneksi berhasil!', data: result };
    } catch (err) {
      this._notifyStatus('error', 'Koneksi gagal: ' + err.message);
      return { success: false, message: 'Koneksi gagal: ' + err.message };
    }
  },

  /* ---- Initialize (call on app start) ---- */
  init() {
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this._notifyStatus('idle', 'Kembali online');
      // Auto-flush pending queue when back online
      if (this.hasPendingChanges()) {
        setTimeout(() => this.flushPendingQueue(), 1000);
      }
    });

    window.addEventListener('offline', () => {
      this._notifyStatus('offline', 'Mode offline');
    });

    // Set initial status
    if (!this.isConfigured()) {
      this._notifyStatus('idle', 'Google Sheets belum dikonfigurasi');
    } else if (!this.isOnline()) {
      this._notifyStatus('offline', 'Mode offline');
    } else {
      this._notifyStatus('idle', 'Siap');
    }
  }
};
