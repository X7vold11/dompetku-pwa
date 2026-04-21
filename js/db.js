/* =====================================================
   DompetKu - Database Layer (localStorage)
   ===================================================== */

const DB = {
  KEYS: {
    TRANSACTIONS: 'dompetku_transactions',
    BUDGETS: 'dompetku_budgets',
    SETTINGS: 'dompetku_settings',
    USERS: 'dompetku_users',
    SESSION: 'dompetku_session',
  },

  // ---- TRANSACTIONS ----
  getTransactions() {
    return JSON.parse(localStorage.getItem(this.KEYS.TRANSACTIONS) || '[]');
  },
  saveTransactions(data) {
    localStorage.setItem(this.KEYS.TRANSACTIONS, JSON.stringify(data));
  },
  addTransaction(trx) {
    const list = this.getTransactions();
    const newTrx = { ...trx, id: Date.now().toString(), createdAt: new Date().toISOString() };
    list.unshift(newTrx);
    this.saveTransactions(list);
    return newTrx;
  },
  deleteTransaction(id) {
    const list = this.getTransactions().filter(t => t.id !== id);
    this.saveTransactions(list);
  },
  getTransactionsByMonth(year, month) {
    return this.getTransactions().filter(t => {
      const d = new Date(t.date);
      return d.getFullYear() === year && d.getMonth() === month;
    });
  },

  // ---- BUDGETS ----
  getBudgets() {
    return JSON.parse(localStorage.getItem(this.KEYS.BUDGETS) || '[]');
  },
  saveBudgets(data) {
    localStorage.setItem(this.KEYS.BUDGETS, JSON.stringify(data));
  },
  setBudget(category, amount) {
    const list = this.getBudgets();
    const idx = list.findIndex(b => b.category === category);
    if (idx >= 0) {
      list[idx].amount = amount;
    } else {
      list.push({ id: Date.now().toString(), category, amount });
    }
    this.saveBudgets(list);
  },
  deleteBudget(category) {
    const list = this.getBudgets().filter(b => b.category !== category);
    this.saveBudgets(list);
  },

  // ---- SETTINGS ----
  getSettings() {
    return JSON.parse(localStorage.getItem(this.KEYS.SETTINGS) || '{"name":"Mahasiswa","avatar":"🎓","darkMode":true}');
  },
  saveSettings(data) {
    localStorage.setItem(this.KEYS.SETTINGS, JSON.stringify(data));
  },
  updateSettings(patch) {
    const curr = this.getSettings();
    this.saveSettings({ ...curr, ...patch });
  },

  // ---- CLEAR ALL ----
  clearAll() {
    Object.values(this.KEYS).forEach(k => {
      if (k !== this.KEYS.USERS) localStorage.removeItem(k);
    });
    // Also clear user-specific data if any
    const session = this.getCurrentUser();
    if (session) {
      localStorage.removeItem(`dompetku_${session.username}_transactions`);
      localStorage.removeItem(`dompetku_${session.username}_budgets`);
      localStorage.removeItem(`dompetku_${session.username}_settings`);
    }
  },

  // ---- AUTHENTICATION ----
  getUsers() {
    return JSON.parse(localStorage.getItem(this.KEYS.USERS) || '[]');
  },
  saveUsers(users) {
    localStorage.setItem(this.KEYS.USERS, JSON.stringify(users));
  },
  registerUser(name, username, password) {
    const users = this.getUsers();
    if (users.find(u => u.username === username)) return { success: false, message: 'Username sudah digunakan' };
    
    const newUser = { name, username, password, avatar: '🎓' };
    users.push(newUser);
    this.saveUsers(users);
    return { success: true };
  },
  loginUser(username, password) {
    const users = this.getUsers();
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
      localStorage.setItem(this.KEYS.SESSION, JSON.stringify({ name: user.name, username: user.username, avatar: user.avatar }));
      return { success: true };
    }
    return { success: false, message: 'Username atau password salah' };
  },
  getCurrentUser() {
    return JSON.parse(localStorage.getItem(this.KEYS.SESSION) || 'null');
  },
  logoutUser() {
    localStorage.removeItem(this.KEYS.SESSION);
  },

  // ---- HELPERS ----
  sumByType(transactions, type) {
    return transactions
      .filter(t => t.type === type)
      .reduce((acc, t) => acc + Number(t.amount), 0);
  },
  groupByCategory(transactions) {
    const map = {};
    transactions.forEach(t => {
      if (!map[t.category]) map[t.category] = { total: 0, emoji: t.emoji };
      map[t.category].total += Number(t.amount);
    });
    return map;
  },
  getMonthlyData(numMonths = 6) {
    const all = this.getTransactions();
    const result = [];
    const now = new Date();
    for (let i = numMonths - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const trxs = all.filter(t => {
        const td = new Date(t.date);
        return td.getFullYear() === d.getFullYear() && td.getMonth() === d.getMonth();
      });
      result.push({
        label: d.toLocaleDateString('id-ID', { month: 'short' }),
        income: this.sumByType(trxs, 'pemasukan'),
        expense: this.sumByType(trxs, 'pengeluaran'),
        month: d.getMonth(),
        year: d.getFullYear(),
      });
    }
    return result;
  },
};
