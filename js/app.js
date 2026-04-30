/* =====================================================
   DompetKu - Main App Controller
   ===================================================== */

const App = {
  currentPage: 'dashboard',
  filterType: 'semua',
  filterMonth: new Date().getMonth(),
  filterYear: new Date().getFullYear(),
  selectedTrxType: 'pengeluaran',
  selectedBudgetCat: null,
  deferredPrompt: null,

  /* ===================================================
     INIT
     =================================================== */
  init() {
    this.applySavedTheme();
    this.showSplash();
    this.bindEvents();
    
    // Check session after splash
    setTimeout(() => {
      this.checkSession();
    }, 1900);

    this.registerServiceWorker();
    this.handlePWAInstall();
    lucide.createIcons();
  },

  checkSession() {
    const user = DB.getCurrentUser();
    if (user) {
      document.body.classList.add('logged-in');
      document.getElementById('auth-pages').style.display = 'none';
      document.getElementById('app').style.display = 'block';
      this.loadSettings();
      this.navigate('dashboard');
    } else {
      document.body.classList.remove('logged-in');
      document.getElementById('auth-pages').style.display = 'flex';
      document.getElementById('app').style.display = 'none';
      this.showAuth('login');
    }
  },

  showAuth(page) {
    document.getElementById('page-login').style.display = page === 'login' ? 'block' : 'none';
    document.getElementById('page-register').style.display = page === 'register' ? 'block' : 'none';
  },

  showSplash() {
    setTimeout(() => {
      const splash = document.getElementById('splash-screen');
      const appEl = document.getElementById('app');
      if (splash) splash.classList.add('hide');
      if (appEl) appEl.style.display = 'block';
      setTimeout(() => {
        if (splash) splash.style.display = 'none';
        lucide.createIcons();
      }, 600);
    }, 1800);
  },

  /* ===================================================
     THEME
     =================================================== */
  applySavedTheme() {
    const settings = DB.getSettings();
    if (settings.darkMode === false) {
      document.body.classList.remove('dark-mode');
      document.body.classList.add('light-mode');
    } else {
      document.body.classList.add('dark-mode');
      document.body.classList.remove('light-mode');
    }
    this.updateThemeIcon();
  },

  toggleTheme() {
    const isDark = document.body.classList.contains('dark-mode');
    document.body.classList.toggle('dark-mode', !isDark);
    document.body.classList.toggle('light-mode', isDark);
    DB.updateSettings({ darkMode: !isDark });
    const tog = document.getElementById('dark-mode-toggle');
    if (tog) tog.checked = !isDark;
    this.updateThemeIcon();
    // Redraw charts after theme change
    setTimeout(() => this.renderCurrentPage(), 100);
  },

  updateThemeIcon() {
    const icon = document.getElementById('theme-icon');
    if (!icon) return;
    const isDark = document.body.classList.contains('dark-mode');
    icon.setAttribute('data-lucide', isDark ? 'sun' : 'moon');
    lucide.createIcons();
  },

  /* ===================================================
     NAVIGATION
     =================================================== */
  navigate(page) {
    // If already on this page, do nothing
    if (this.currentPage === page) return;
    
    // Hide current page with fade out
    const currentPageEl = document.getElementById(`page-${this.currentPage}`);
    if (currentPageEl) {
      currentPageEl.style.opacity = '0';
      currentPageEl.style.transform = 'translateY(10px)';
    }
    
    // Show target page
    const target = document.getElementById(`page-${page}`);
    if (target) {
      target.classList.add('active');
      target.style.opacity = '0';
      target.style.transform = 'translateY(10px)';
      
      // Trigger reflow
      target.offsetHeight;
      
      // Fade in
      setTimeout(() => {
        target.style.opacity = '1';
        target.style.transform = 'translateY(0)';
      }, 10);
    }

    // Hide other pages after transition
    setTimeout(() => {
      document.querySelectorAll('.page').forEach(p => {
        if (p.id !== `page-${page}`) {
          p.classList.remove('active');
          p.style.opacity = '';
          p.style.transform = '';
        }
      });
    }, 300);

    // Update nav items
    document.querySelectorAll('.bottom-nav-item[data-page]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.page === page);
    });
    document.querySelectorAll('.nav-item[data-page]').forEach(a => {
      a.classList.toggle('active', a.dataset.page === page);
    });

    // Close sidebar
    this.closeSidebar();

    this.currentPage = page;
    
    // Render after transition
    setTimeout(() => {
      this.renderCurrentPage();
    }, 100);

    // Scroll to top
    document.getElementById('main-content')?.scrollTo({ top: 0, behavior: 'smooth' });
  },

  renderCurrentPage() {
    switch (this.currentPage) {
      case 'dashboard':   this.renderDashboard(); break;
      case 'transaksi':   this.renderTransaksi(); break;
      case 'budget':      this.renderBudget(); break;
      case 'laporan':     this.renderLaporan(); break;
      case 'pengaturan':  this.renderPengaturan(); break;
    }
    lucide.createIcons();
  },

  /* ===================================================
     SIDEBAR
     =================================================== */
  openSidebar() {
    document.getElementById('sidebar')?.classList.add('open');
    document.getElementById('sidebar-overlay')?.classList.add('active');
  },
  closeSidebar() {
    document.getElementById('sidebar')?.classList.remove('open');
    document.getElementById('sidebar-overlay')?.classList.remove('active');
  },

  /* ===================================================
     SETTINGS
     =================================================== */
  loadSettings() {
    const user = DB.getCurrentUser();
    const s = DB.getSettings();
    const nameEl = document.getElementById('sidebar-username');
    const avatarEl = document.getElementById('avatar-emoji');
    
    // Priority to session name/avatar
    const displayName = user ? user.name : s.name;
    const displayAvatar = user ? user.avatar : s.avatar;

    if (nameEl) nameEl.textContent = displayName || 'Mahasiswa';
    if (avatarEl) avatarEl.textContent = displayAvatar || '🎓';
    this.updateGreeting(displayName);
  },

  updateGreeting(name) {
    const h = new Date().getHours();
    let greeting = h < 12 ? 'Selamat Pagi' : h < 15 ? 'Selamat Siang' : h < 18 ? 'Selamat Sore' : 'Selamat Malam';
    const el = document.getElementById('greeting-text');
    if (el) el.textContent = `${greeting}, ${name || 'Mahasiswa'}! 👋`;

    const dateEl = document.getElementById('today-date');
    if (dateEl) {
      dateEl.textContent = new Date().toLocaleDateString('id-ID', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
      });
    }
  },

  /* ===================================================
     RENDER DASHBOARD
     =================================================== */
  renderDashboard() {
    const now = new Date();
    const trxAll = DB.getTransactions();
    const trxMonth = DB.getTransactionsByMonth(now.getFullYear(), now.getMonth());

    const income = DB.sumByType(trxMonth, 'pemasukan');
    const expense = DB.sumByType(trxMonth, 'pengeluaran');
    const balance = DB.sumByType(trxAll, 'pemasukan') - DB.sumByType(trxAll, 'pengeluaran');

    // Balance card
    UI.animateCounter(document.getElementById('total-balance'), balance);
    UI.animateCounter(document.getElementById('total-income'), income);
    UI.animateCounter(document.getElementById('total-expense'), expense);

    const monthLabel = now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    const balMonthEl = document.getElementById('balance-month');
    if (balMonthEl) balMonthEl.textContent = monthLabel;

    // Donut chart
    UI.renderDonut(trxMonth);

    // Recent transactions (last 5)
    UI.renderTransactionList('recent-list', trxAll.slice(0, 5), (id) => {
      UI.confirm('Hapus Transaksi', 'Yakin ingin menghapus transaksi ini?', () => {
        DB.deleteTransaction(id);
        UI.toast('Transaksi dihapus', 'error');
        this.renderDashboard();
      });
    });

    // Budget snapshot
    const budgets = DB.getBudgets();
    UI.renderBudgetSnapshot('budget-snapshot', budgets, trxAll);

    // Check budget alerts
    this.checkBudgetAlerts(budgets, trxMonth);

    // Update settings greeting
    const s = DB.getSettings();
    this.updateGreeting(s.name);

    lucide.createIcons();
  },

  checkBudgetAlerts(budgets, trxMonth) {
    if (!budgets.length) return;
    const expenses = trxMonth.filter(t => t.type === 'pengeluaran');
    const grouped = DB.groupByCategory(expenses);
    let overCount = 0;
    budgets.forEach(b => {
      const spent = grouped[b.category]?.total || 0;
      if (spent > b.amount) overCount++;
    });
    const badge = document.getElementById('notif-badge');
    if (badge) badge.style.display = overCount > 0 ? 'block' : 'none';
  },

  /* ===================================================
     RENDER TRANSAKSI
     =================================================== */
  renderTransaksi() {
    this.updateFilterMonthLabel();
    let trxs = DB.getTransactionsByMonth(this.filterYear, this.filterMonth);

    // Type filter
    if (this.filterType !== 'semua') {
      trxs = trxs.filter(t => t.type === this.filterType);
    }

    // Search filter
    const q = document.getElementById('search-input')?.value?.toLowerCase() || '';
    if (q) {
      trxs = trxs.filter(t =>
        t.category.toLowerCase().includes(q) ||
        (t.description || '').toLowerCase().includes(q)
      );
    }

    UI.renderTransactionList('trx-list', trxs, (id) => {
      UI.confirm('Hapus Transaksi', 'Yakin ingin menghapus transaksi ini?', () => {
        DB.deleteTransaction(id);
        UI.toast('Transaksi dihapus', 'error');
        this.renderTransaksi();
      });
    });
    lucide.createIcons();
  },

  updateFilterMonthLabel() {
    const d = new Date(this.filterYear, this.filterMonth, 1);
    const label = d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    const el = document.getElementById('current-filter-month');
    if (el) el.textContent = label;
  },

  /* ===================================================
     RENDER BUDGET
     =================================================== */
  renderBudget() {
    const now = new Date();
    const label = now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    const el = document.getElementById('budget-month-label');
    if (el) el.textContent = `Anggaran ${label}`;

    const budgets = DB.getBudgets();
    const trxAll = DB.getTransactions();
    UI.renderBudgetList('budget-list', budgets, trxAll, (cat) => {
      UI.confirm('Hapus Anggaran', `Hapus anggaran untuk kategori "${cat}"?`, () => {
        DB.deleteBudget(cat);
        UI.toast('Anggaran dihapus', 'error');
        this.renderBudget();
      });
    });
    lucide.createIcons();
  },

  /* ===================================================
     RENDER LAPORAN
     =================================================== */
  renderLaporan() {
    const trxAll = DB.getTransactions();
    const totalIncome = DB.sumByType(trxAll, 'pemasukan');
    const totalExpense = DB.sumByType(trxAll, 'pengeluaran');
    const net = totalIncome - totalExpense;

    const incEl = document.getElementById('report-income');
    const expEl = document.getElementById('report-expense');
    const netEl = document.getElementById('report-net');
    if (incEl) incEl.textContent = UI.formatRp(totalIncome);
    if (expEl) expEl.textContent = UI.formatRp(totalExpense);
    if (netEl) {
      netEl.textContent = UI.formatRp(Math.abs(net));
      netEl.style.color = net >= 0 ? 'var(--income)' : 'var(--expense)';
    }

    // Bar chart
    const monthly = DB.getMonthlyData(6);
    setTimeout(() => Charts.drawBar('bar-chart', monthly), 50);

    // Category breakdown (all time)
    UI.renderCategoryBreakdown('category-breakdown', trxAll);
    lucide.createIcons();
  },

  /* ===================================================
     RENDER PENGATURAN
     =================================================== */
  renderPengaturan() {
    const s = DB.getSettings();
    const nameInput = document.getElementById('setting-name');
    if (nameInput) nameInput.value = s.name || '';

    // Avatar picker
    document.querySelectorAll('.avatar-opt').forEach(opt => {
      opt.classList.toggle('selected', opt.dataset.emoji === (s.avatar || '🎓'));
    });

    // Dark mode toggle
    const tog = document.getElementById('dark-mode-toggle');
    if (tog) tog.checked = s.darkMode !== false;

    // Install button
    const installBtn = document.getElementById('install-btn');
    const installNote = document.getElementById('install-note');
    if (this.deferredPrompt) {
      if (installBtn) installBtn.style.display = 'flex';
      if (installNote) installNote.textContent = '';
    } else {
      if (installBtn) installBtn.style.display = 'none';
      if (installNote) installNote.textContent = 'Buka di Chrome/Edge lalu pilih "Add to Home Screen" 📲';
    }
  },

  /* ===================================================
     TRANSACTION MODAL
     =================================================== */
  openTrxModal(type = 'pengeluaran') {
    this.selectedTrxType = type;

    // Set type tabs
    document.querySelectorAll('.type-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.type === type);
    });

    // Render categories
    UI.renderCategoryGrid('category-grid', type);

    // Set today's date
    const dateInput = document.getElementById('trx-date');
    if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];

    // Clear inputs
    const amtInput = document.getElementById('trx-amount');
    if (amtInput) { amtInput.value = ''; amtInput.focus(); }
    const descInput = document.getElementById('trx-desc');
    if (descInput) descInput.value = '';

    document.getElementById('modal-title').textContent = 'Tambah Transaksi';
    UI.openModal('trx-modal');
    lucide.createIcons();
  },

  saveTrx() {
    const amountInput = document.getElementById('trx-amount')?.value || '';
    // Parse formatted amount (remove thousand separators)
    const amount = parseFloat(amountInput.replace(/\./g, '')) || 0;
    const desc = document.getElementById('trx-desc')?.value?.trim();
    const date = document.getElementById('trx-date')?.value;
    const cat = UI.getSelectedCategory('category-grid');

    if (!amount || amount <= 0) {
      UI.toast('Masukkan jumlah yang valid!', 'error'); return;
    }
    if (!cat) {
      UI.toast('Pilih kategori terlebih dahulu!', 'error'); return;
    }
    if (!date) {
      UI.toast('Pilih tanggal transaksi!', 'error'); return;
    }

    DB.addTransaction({
      type: this.selectedTrxType,
      amount: amount,
      category: cat.name,
      emoji: cat.emoji,
      description: desc,
      date: date,
    });

    UI.closeModal('trx-modal');
    UI.toast(`${this.selectedTrxType === 'pemasukan' ? 'Pemasukan' : 'Pengeluaran'} ditambahkan! ✅`, 'success');
    this.renderCurrentPage();
  },

  /* ===================================================
     BUDGET MODAL
     =================================================== */
  openBudgetModal() {
    this.selectedBudgetCat = null;
    UI.renderCategoryGrid('budget-category-grid', 'pengeluaran');
    const amtEl = document.getElementById('budget-amount');
    if (amtEl) amtEl.value = '';
    UI.openModal('budget-modal');
    lucide.createIcons();
  },

  saveBudget() {
    const amountInput = document.getElementById('budget-amount')?.value || '';
    // Parse formatted amount (remove thousand separators)
    const amount = parseFloat(amountInput.replace(/\./g, '')) || 0;
    const cat = UI.getSelectedCategory('budget-category-grid');

    if (!cat) {
      UI.toast('Pilih kategori anggaran!', 'error'); return;
    }
    if (!amount || amount <= 0) {
      UI.toast('Masukkan jumlah anggaran!', 'error'); return;
    }

    DB.setBudget(cat.name, amount);
    UI.closeModal('budget-modal');
    UI.toast(`Anggaran ${cat.emoji} ${cat.name} disimpan! ✅`, 'success');
    this.renderBudget();
  },

  /* ===================================================
     EXPORT CSV
     =================================================== */
  exportCSV() {
    const trxs = DB.getTransactions();
    if (!trxs.length) {
      UI.toast('Belum ada data untuk diekspor!', 'error'); return;
    }
    const header = ['Tanggal', 'Tipe', 'Kategori', 'Deskripsi', 'Jumlah'];
    const rows = trxs.map(t => [
      t.date,
      t.type,
      t.category,
      t.description || '',
      t.amount,
    ]);
    const csv = [header, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DompetKu_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    UI.toast('Data berhasil diekspor! 📊', 'success');
  },

  /* ===================================================
     PWA
     =================================================== */
  registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }
  },

  handlePWAInstall() {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
    });
    window.addEventListener('appinstalled', () => {
      this.deferredPrompt = null;
      UI.toast('DompetKu berhasil diinstall! 🎉', 'success');
    });
  },

  installPWA() {
    if (this.deferredPrompt) {
      this.deferredPrompt.prompt();
      this.deferredPrompt.userChoice.then(() => {
        this.deferredPrompt = null;
      });
    } else {
      UI.toast('Buka di Chrome/Edge untuk install!', 'info');
    }
  },

  /* ===================================================
     BIND EVENTS
     =================================================== */
  bindEvents() {
    // --- Sidebar ---
    document.getElementById('menu-toggle')?.addEventListener('click', () => this.openSidebar());
    document.getElementById('sidebar-overlay')?.addEventListener('click', () => this.closeSidebar());

    // --- Theme toggle ---
    document.getElementById('theme-toggle')?.addEventListener('click', () => this.toggleTheme());

    // --- Bottom Nav ---
    document.querySelectorAll('.bottom-nav-item[data-page]').forEach(btn => {
      btn.addEventListener('click', () => this.navigate(btn.dataset.page));
    });

    // --- Sidebar Nav ---
    document.querySelectorAll('.nav-item[data-page]').forEach(a => {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        this.navigate(a.dataset.page);
      });
    });

    // --- Link buttons (Lihat Semua, Kelola, etc.) ---
    document.addEventListener('click', (e) => {
      const lb = e.target.closest('.link-btn[data-page]');
      if (lb) this.navigate(lb.dataset.page);
    });

    // --- FAB & Quick Add ---
    document.getElementById('fab-add')?.addEventListener('click', () => this.openTrxModal('pengeluaran'));
    document.getElementById('quick-add-btn')?.addEventListener('click', () => this.openTrxModal('pengeluaran'));
    document.getElementById('add-trx-btn')?.addEventListener('click', () => this.openTrxModal('pengeluaran'));

    // --- Type Tabs in Modal ---
    document.querySelectorAll('.type-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        this.selectedTrxType = tab.dataset.type;
        document.querySelectorAll('.type-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        UI.renderCategoryGrid('category-grid', this.selectedTrxType);
        lucide.createIcons();
      });
    });

    // --- Save Transaction ---
    document.getElementById('save-trx-btn')?.addEventListener('click', () => this.saveTrx());

    // --- Format Amount Input Real-time ---
    document.getElementById('trx-amount')?.addEventListener('input', (e) => {
      const input = e.target;
      const cursorPos = input.selectionStart;
      const rawValue = input.value.replace(/\./g, '');
      const formatted = rawValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      input.value = formatted;
      
      // Restore cursor position
      const diff = formatted.length - input.value.length;
      input.setSelectionRange(cursorPos + diff, cursorPos + diff);
    });

    // --- Format Budget Amount Input Real-time ---
    document.getElementById('budget-amount')?.addEventListener('input', (e) => {
      const input = e.target;
      const cursorPos = input.selectionStart;
      const rawValue = input.value.replace(/\./g, '');
      const formatted = rawValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      input.value = formatted;
      
      // Restore cursor position
      const diff = formatted.length - input.value.length;
      input.setSelectionRange(cursorPos + diff, cursorPos + diff);
    });

    // --- Number Pad Events ---
    document.querySelectorAll('.num-btn[data-num]').forEach(btn => {
      btn.addEventListener('click', () => {
        const num = btn.dataset.num;
        const input = document.getElementById('trx-amount');
        if (input) {
          const current = input.value.replace(/\./g, '');
          input.value = (current + num).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
          input.dispatchEvent(new Event('input'));
        }
      });
    });

    document.querySelector('.del-btn[data-action="backspace"]')?.addEventListener('click', () => {
      const input = document.getElementById('trx-amount');
      if (input && input.value.length > 0) {
        const current = input.value.replace(/\./g, '');
        input.value = current.slice(0, -1).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        input.dispatchEvent(new Event('input'));
      }
    });

    // --- Budget Number Pad Events ---
    document.querySelectorAll('.budget-num[data-num]').forEach(btn => {
      btn.addEventListener('click', () => {
        const num = btn.dataset.num;
        const input = document.getElementById('budget-amount');
        if (input) {
          const current = input.value.replace(/\./g, '');
          input.value = (current + num).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
          input.dispatchEvent(new Event('input'));
        }
      });
    });

    document.querySelector('.budget-del[data-action="backspace"]')?.addEventListener('click', () => {
      const input = document.getElementById('budget-amount');
      if (input && input.value.length > 0) {
        const current = input.value.replace(/\./g, '');
        input.value = current.slice(0, -1).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        input.dispatchEvent(new Event('input'));
      }
    });

    // --- Transaction Modal Close ---
    document.getElementById('close-trx-modal')?.addEventListener('click', () => UI.closeModal('trx-modal'));
    document.getElementById('trx-modal')?.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) UI.closeModal('trx-modal');
    });

    // --- Transaction Filter Tabs ---
    document.querySelectorAll('.filter-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        this.filterType = tab.dataset.filter;
        document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.renderTransaksi();
      });
    });

    // --- Search ---
    document.getElementById('search-input')?.addEventListener('input', () => this.renderTransaksi());

    // --- Month Navigation ---
    document.getElementById('prev-month')?.addEventListener('click', () => {
      this.filterMonth--;
      if (this.filterMonth < 0) { this.filterMonth = 11; this.filterYear--; }
      this.renderTransaksi();
    });
    document.getElementById('next-month')?.addEventListener('click', () => {
      this.filterMonth++;
      if (this.filterMonth > 11) { this.filterMonth = 0; this.filterYear++; }
      this.renderTransaksi();
    });

    // --- Budget ---
    document.getElementById('add-budget-btn')?.addEventListener('click', () => this.openBudgetModal());
    document.getElementById('save-budget-btn')?.addEventListener('click', () => this.saveBudget());
    document.getElementById('close-budget-modal')?.addEventListener('click', () => UI.closeModal('budget-modal'));
    document.getElementById('budget-modal')?.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) UI.closeModal('budget-modal');
    });

    // --- Confirm Modal Close ---
    document.getElementById('close-confirm-modal')?.addEventListener('click', () => UI.closeModal('confirm-modal'));

    // --- Export CSV ---
    document.getElementById('export-csv-btn')?.addEventListener('click', () => this.exportCSV());

    // --- Settings: Save Profile ---
    document.getElementById('save-profile-btn')?.addEventListener('click', () => {
      const name = document.getElementById('setting-name')?.value?.trim() || 'Mahasiswa';
      const avatar = document.querySelector('.avatar-opt.selected')?.dataset.emoji || '🎓';
      DB.updateSettings({ name, avatar });
      this.loadSettings();
      UI.toast('Profil disimpan! ✅', 'success');
    });

    // --- Settings: Avatar Picker ---
    document.getElementById('avatar-picker')?.addEventListener('click', (e) => {
      const opt = e.target.closest('.avatar-opt');
      if (opt) {
        document.querySelectorAll('.avatar-opt').forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
      }
    });

    // --- Settings: Dark Mode Toggle ---
    document.getElementById('dark-mode-toggle')?.addEventListener('change', (e) => {
      if (e.target.checked) {
        document.body.classList.add('dark-mode');
        document.body.classList.remove('light-mode');
        DB.updateSettings({ darkMode: true });
      } else {
        document.body.classList.remove('dark-mode');
        document.body.classList.add('light-mode');
        DB.updateSettings({ darkMode: false });
      }
      this.updateThemeIcon();
      setTimeout(() => this.renderCurrentPage(), 100);
    });

    // --- Settings: Clear Data ---
    document.getElementById('clear-data-btn')?.addEventListener('click', () => {
      UI.confirm('Hapus Semua Data', 'Semua transaksi dan anggaran akan dihapus secara permanen. Aksi ini tidak dapat dibatalkan!', () => {
        DB.clearAll();
        UI.toast('Semua data telah dihapus', 'error');
        this.loadSettings();
        this.renderCurrentPage();
      });
    });

    // --- Install PWA ---
    document.getElementById('install-btn')?.addEventListener('click', () => this.installPWA());

    // --- Notification Bell ---
    document.getElementById('notif-btn')?.addEventListener('click', () => {
      this.navigate('budget');
    });

    // --- Close modals on Escape ---
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        UI.closeModal('trx-modal');
        UI.closeModal('budget-modal');
        UI.closeModal('confirm-modal');
        this.closeSidebar();
      }
    });

    // --- Swipe to close sidebar ---
    let touchStartX = 0;
    document.addEventListener('touchstart', (e) => { touchStartX = e.touches[0].clientX; }, { passive: true });
    document.addEventListener('touchend', (e) => {
      const dx = e.changedTouches[0].clientX - touchStartX;
      if (dx < -60 && document.getElementById('sidebar')?.classList.contains('open')) {
        this.closeSidebar();
      }
    }, { passive: true });

    // --- Authentication ---
    document.getElementById('link-to-register')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.showAuth('register');
    });
    document.getElementById('link-to-login')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.showAuth('login');
    });

    document.getElementById('btn-do-login')?.addEventListener('click', () => {
      const u = document.getElementById('login-username').value.trim();
      const p = document.getElementById('login-password').value;
      if (!u || !p) return UI.toast('Harap isi semua field', 'error');

      const res = DB.loginUser(u, p);
      if (res.success) {
        UI.toast('Login Berhasil! 👋');
        this.checkSession();
      } else {
        UI.toast(res.message, 'error');
      }
    });

    document.getElementById('btn-do-register')?.addEventListener('click', () => {
      const n = document.getElementById('reg-name').value.trim();
      const u = document.getElementById('reg-username').value.trim();
      const p = document.getElementById('reg-password').value;

      if (!n || !u || !p) return UI.toast('Harap isi semua field', 'error');
      if (p.length < 6) return UI.toast('Password minimal 6 karakter', 'error');

      const res = DB.registerUser(n, u, p);
      if (res.success) {
        UI.toast('Akun berhasil dibuat! Silakan login.');
        this.showAuth('login');
      } else {
        UI.toast(res.message, 'error');
      }
    });

    document.getElementById('btn-logout')?.addEventListener('click', () => {
      UI.confirm('Keluar Aplikasi', 'Apakah kamu yakin ingin keluar?', () => {
        DB.logoutUser();
        window.location.reload(); // Hard reload to clear all states
      });
    });
  },
};

/* ===================================================
   BOOT
   =================================================== */
document.addEventListener('DOMContentLoaded', () => App.init());
