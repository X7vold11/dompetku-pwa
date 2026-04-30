/* =====================================================
   DompetKu - UI Renderer
   ===================================================== */

const CATEGORIES = {
  pengeluaran: [
    { name: 'Makan', emoji: '🍜' },
    { name: 'Transport', emoji: '🚌' },
    { name: 'Belanja', emoji: '🛍️' },
    { name: 'Hiburan', emoji: '🎮' },
    { name: 'Kesehatan', emoji: '💊' },
    { name: 'Pendidikan', emoji: '📚' },
    { name: 'Kos/Sewa', emoji: '🏠' },
    { name: 'Lainnya', emoji: '📦' },
  ],
  pemasukan: [
    { name: 'Beasiswa', emoji: '🏆' },
    { name: 'Freelance', emoji: '💻' },
    { name: 'Transfer', emoji: '💸' },
    { name: 'Hadiah', emoji: '🎁' },
    { name: 'Gaji', emoji: '💰' },
    { name: 'Investasi', emoji: '📈' },
    { name: 'Jual Barang', emoji: '🏷️' },
    { name: 'Lainnya', emoji: '✨' },
  ],
};

const UI = {

  /* ---- Format Currency ---- */
  formatRp(amount) {
    return 'Rp ' + Number(amount).toLocaleString('id-ID');
  },

  /* ---- Format Input Amount ---- */
  formatAmountInput(value) {
    // Remove non-numeric characters except decimal point
    const num = value.replace(/[^\d]/g, '');
    // Format with thousand separators
    return num.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  },

  /* ---- Parse Formatted Amount ---- */
  parseFormattedAmount(formatted) {
    // Remove thousand separators and convert to number
    return parseFloat(formatted.replace(/\./g, '')) || 0;
  },

  /* ---- Format Date ---- */
  formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  },

  /* ---- Animate Counter ---- */
  animateCounter(el, targetVal, prefix = 'Rp ') {
    if (!el) return;
    const duration = 800;
    const start = performance.now();
    const startVal = 0;
    const update = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startVal + (targetVal - startVal) * ease);
      el.textContent = prefix + current.toLocaleString('id-ID');
      if (progress < 1) requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
  },

  /* ---- Render Category Grid ---- */
  renderCategoryGrid(containerId, type, selectedName = null) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const cats = CATEGORIES[type] || CATEGORIES.pengeluaran;
    container.innerHTML = cats.map(cat => `
      <div class="cat-item ${selectedName === cat.name ? 'selected' : ''}"
           data-name="${cat.name}" data-emoji="${cat.emoji}">
        <span class="cat-emoji">${cat.emoji}</span>
        <span class="cat-name">${cat.name}</span>
      </div>
    `).join('');

    container.querySelectorAll('.cat-item').forEach(item => {
      item.addEventListener('click', () => {
        container.querySelectorAll('.cat-item').forEach(i => i.classList.remove('selected'));
        item.classList.add('selected');
      });
    });
  },

  /* ---- Get Selected Category ---- */
  getSelectedCategory(containerId) {
    const el = document.querySelector(`#${containerId} .cat-item.selected`);
    if (!el) return null;
    return { name: el.dataset.name, emoji: el.dataset.emoji };
  },

  /* ---- Render Transaction Item ---- */
  renderTrxItem(trx, onDelete) {
    const div = document.createElement('div');
    div.className = 'trx-item';
    div.innerHTML = `
      <div class="trx-emoji">${trx.emoji}</div>
      <div class="trx-info">
        <div class="trx-cat">${trx.category}</div>
        <div class="trx-desc">${trx.description || trx.type === 'pemasukan' ? (trx.description || 'Pemasukan') : (trx.description || 'Pengeluaran')}</div>
      </div>
      <div class="trx-right">
        <span class="trx-amount ${trx.type}">
          ${trx.type === 'pemasukan' ? '+' : '-'}${this.formatRp(trx.amount)}
        </span>
        <div class="trx-date">${this.formatDate(trx.date)}</div>
      </div>
      <button class="trx-delete" data-id="${trx.id}" aria-label="Hapus">
        <i data-lucide="trash-2"></i>
      </button>
    `;
    div.querySelector('.trx-delete').addEventListener('click', (e) => {
      e.stopPropagation();
      onDelete(trx.id);
    });
    return div;
  },

  /* ---- Render Transaction List ---- */
  renderTransactionList(containerId, transactions, onDelete) {
    const container = document.getElementById(containerId);
    if (!container) return;
    if (!transactions || transactions.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i data-lucide="inbox"></i>
          <p>Belum ada transaksi</p>
          <small>Tap tombol + untuk tambah transaksi</small>
        </div>`;
      lucide.createIcons();
      return;
    }
    container.innerHTML = '';
    transactions.forEach(trx => {
      container.appendChild(this.renderTrxItem(trx, onDelete));
    });
    lucide.createIcons();
  },

  /* ---- Render Budget List ---- */
  renderBudgetList(containerId, budgets, transactions, onDelete) {
    const container = document.getElementById(containerId);
    if (!container) return;
    if (!budgets || budgets.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i data-lucide="target"></i>
          <p>Belum ada anggaran</p>
          <small>Tap "Set Anggaran" untuk mulai mengatur</small>
        </div>`;
      lucide.createIcons();
      return;
    }

    const now = new Date();
    const monthTrx = transactions.filter(t => {
      const d = new Date(t.date);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && t.type === 'pengeluaran';
    });
    const grouped = DB.groupByCategory(monthTrx);

    container.innerHTML = budgets.map(b => {
      const spent = grouped[b.category] ? grouped[b.category].total : 0;
      const pct = Math.min((spent / b.amount) * 100, 100);
      const isOver = spent > b.amount;
      const isWarn = pct >= 80 && !isOver;
      const fillClass = isOver ? 'over' : isWarn ? 'warning' : 'safe';
      const emoji = CATEGORIES.pengeluaran.find(c => c.name === b.category)?.emoji ||
                    CATEGORIES.pemasukan.find(c => c.name === b.category)?.emoji || '📦';

      return `
        <div class="budget-item">
          <div class="budget-item-header">
            <div class="budget-cat-info">
              <div class="budget-emoji">${emoji}</div>
              <div>
                <div class="budget-cat-name">${b.category}</div>
                <div class="budget-amounts">${this.formatRp(spent)} / ${this.formatRp(b.amount)}</div>
              </div>
            </div>
            <div class="budget-right">
              <span class="budget-pct ${isOver ? 'over' : 'safe'}">${Math.round((spent/b.amount)*100)}%</span>
              <button class="budget-del" data-cat="${b.category}" aria-label="Hapus">
                <i data-lucide="trash-2"></i>
              </button>
            </div>
          </div>
          <div class="progress-bar">
            <div class="progress-fill ${fillClass}" style="width:${pct}%"></div>
          </div>
          ${isOver ? `<p style="font-size:0.75rem;color:var(--expense);margin-top:6px;">⚠️ Melebihi anggaran sebesar ${this.formatRp(spent - b.amount)}</p>` : ''}
        </div>`;
    }).join('');

    container.querySelectorAll('.budget-del').forEach(btn => {
      btn.addEventListener('click', () => onDelete(btn.dataset.cat));
    });
    lucide.createIcons();
  },

  /* ---- Render Budget Snapshot (Dashboard) ---- */
  renderBudgetSnapshot(containerId, budgets, transactions) {
    const container = document.getElementById(containerId);
    if (!container) return;
    if (!budgets || budgets.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i data-lucide="target"></i>
          <p>Belum ada anggaran</p>
          <small>Set anggaran di menu Anggaran</small>
        </div>`;
      lucide.createIcons();
      return;
    }

    const now = new Date();
    const monthTrx = transactions.filter(t => {
      const d = new Date(t.date);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && t.type === 'pengeluaran';
    });
    const grouped = DB.groupByCategory(monthTrx);

    // Show top 3 budgets
    container.innerHTML = budgets.slice(0, 3).map(b => {
      const spent = grouped[b.category] ? grouped[b.category].total : 0;
      const pct = Math.min((spent / b.amount) * 100, 100);
      const isOver = spent > b.amount;
      const isWarn = pct >= 80 && !isOver;
      const fillClass = isOver ? 'over' : isWarn ? 'warning' : 'safe';
      const emoji = CATEGORIES.pengeluaran.find(c => c.name === b.category)?.emoji || '📦';

      return `
        <div class="budget-snap-item">
          <div class="budget-snap-header">
            <span class="budget-snap-cat">${emoji} ${b.category}</span>
            <span class="budget-snap-pct" style="color:${isOver ? 'var(--expense)' : 'var(--income)'}">${Math.round((spent/b.amount)*100)}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill ${fillClass}" style="width:${pct}%"></div>
          </div>
        </div>`;
    }).join('');
  },

  /* ---- Render Donut Chart ---- */
  renderDonut(transactions) {
    const expenses = transactions.filter(t => t.type === 'pengeluaran');
    const grouped = DB.groupByCategory(expenses);
    const entries = Object.entries(grouped);

    const legendEl = document.getElementById('chart-legend');
    const emptyEl = document.getElementById('chart-empty');
    const chartWrap = document.querySelector('.chart-container');

    if (entries.length === 0) {
      if (chartWrap) chartWrap.style.display = 'none';
      if (emptyEl) emptyEl.style.display = 'block';
      return;
    }
    if (chartWrap) chartWrap.style.display = 'flex';
    if (emptyEl) emptyEl.style.display = 'none';

    const total = entries.reduce((a, [, v]) => a + v.total, 0);
    const data = entries.map(([name, val]) => ({ name, value: val.total, emoji: val.emoji }));

    Charts.drawDonut('donut-chart', data);

    if (legendEl) {
      legendEl.innerHTML = data.slice(0, 5).map((d, i) => `
        <div class="legend-item">
          <div class="legend-dot" style="background:${Charts.COLORS[i % Charts.COLORS.length]}"></div>
          <span class="legend-name">${d.emoji} ${d.name}</span>
          <span class="legend-pct">${Math.round((d.value / total) * 100)}%</span>
        </div>`).join('');
    }
  },

  /* ---- Render Category Breakdown (Reports) ---- */
  renderCategoryBreakdown(containerId, transactions) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const expenses = transactions.filter(t => t.type === 'pengeluaran');
    const grouped = DB.groupByCategory(expenses);
    const entries = Object.entries(grouped).sort((a, b) => b[1].total - a[1].total);
    const maxVal = entries.length ? entries[0][1].total : 1;

    if (entries.length === 0) {
      container.innerHTML = `<div class="empty-state"><i data-lucide="bar-chart-2"></i><p>Belum ada data pengeluaran</p></div>`;
      lucide.createIcons();
      return;
    }

    container.innerHTML = entries.map(([name, val]) => {
      const pct = (val.total / maxVal) * 100;
      return `
        <div class="cat-breakdown-item">
          <div class="cat-bd-left">
            <span class="cat-bd-emoji">${val.emoji || '📦'}</span>
            <span class="cat-bd-name">${name}</span>
          </div>
          <div class="cat-bd-bar-wrap">
            <div class="cat-bd-bar" style="width:${pct}%"></div>
          </div>
          <span class="cat-bd-amount">${this.formatRp(val.total)}</span>
        </div>`;
    }).join('');
  },

  /* ---- Toast Notification ---- */
  toast(message, type = 'success') {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = message;
    el.className = `toast ${type} show`;
    clearTimeout(el._timer);
    el._timer = setTimeout(() => el.classList.remove('show'), 2800);
  },

  /* ---- Show/Hide Modal ---- */
  openModal(id) {
    const el = document.getElementById(id);
    if (el) {
      el.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  },
  closeModal(id) {
    const el = document.getElementById(id);
    if (el) {
      el.classList.remove('active');
      document.body.style.overflow = '';
    }
  },

  /* ---- Confirm Dialog ---- */
  confirm(title, message, onOk) {
    document.getElementById('confirm-title').textContent = title;
    document.getElementById('confirm-message').textContent = message;
    this.openModal('confirm-modal');
    const okBtn = document.getElementById('confirm-ok');
    const cancelBtn = document.getElementById('confirm-cancel');
    const cleanup = () => {
      this.closeModal('confirm-modal');
      okBtn.replaceWith(okBtn.cloneNode(true));
      cancelBtn.replaceWith(cancelBtn.cloneNode(true));
    };
    document.getElementById('confirm-ok').addEventListener('click', () => { cleanup(); onOk(); }, { once: true });
    document.getElementById('confirm-cancel').addEventListener('click', cleanup, { once: true });
  },
};
