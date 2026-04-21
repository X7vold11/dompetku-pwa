/* =====================================================
   DompetKu - Canvas Chart Renderer
   ===================================================== */

const Charts = {

  COLORS: [
    '#7C3AED', '#2563EB', '#10B981', '#F59E0B',
    '#EF4444', '#EC4899', '#06B6D4', '#84CC16',
  ],

  /* ---- Donut Chart ---- */
  drawDonut(canvasId, data) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const total = data.reduce((a, d) => a + d.value, 0);
    if (total === 0) return;

    const cx = W / 2, cy = H / 2;
    const outerR = Math.min(cx, cy) - 8;
    const innerR = outerR * 0.58;
    let startAngle = -Math.PI / 2;

    data.forEach((seg, i) => {
      const slice = (seg.value / total) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, outerR, startAngle, startAngle + slice);
      ctx.closePath();
      ctx.fillStyle = this.COLORS[i % this.COLORS.length];
      ctx.fill();
      startAngle += slice;
    });

    // Hole
    ctx.beginPath();
    ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
    const isDark = document.body.classList.contains('dark-mode');
    ctx.fillStyle = isDark ? '#161625' : '#ffffff';
    ctx.fill();

    // Center text
    ctx.fillStyle = isDark ? '#F1F5F9' : '#1E293B';
    ctx.font = `bold 13px Inter, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(data.length + ' kategori', cx, cy);
  },

  /* ---- Bar Chart ---- */
  drawBar(canvasId, data) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const isDark = document.body.classList.contains('dark-mode');

    // Resize canvas properly
    const parent = canvas.parentElement;
    const W = parent ? parent.clientWidth || 320 : 320;
    const H = 200;
    canvas.width = W;
    canvas.height = H;
    ctx.clearRect(0, 0, W, H);

    const PAD_L = 10, PAD_R = 10, PAD_T = 16, PAD_B = 32;
    const chartW = W - PAD_L - PAD_R;
    const chartH = H - PAD_T - PAD_B;

    const maxVal = Math.max(...data.map(d => Math.max(d.income, d.expense)), 1);
    const barGroupW = chartW / data.length;
    const barW = Math.min(barGroupW * 0.28, 18);
    const gap = barW * 0.5;

    const textColor = isDark ? '#64748B' : '#94A3B8';
    const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';

    // Grid lines
    for (let i = 0; i <= 4; i++) {
      const y = PAD_T + (chartH / 4) * i;
      ctx.beginPath();
      ctx.strokeStyle = gridColor;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.moveTo(PAD_L, y);
      ctx.lineTo(W - PAD_R, y);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    data.forEach((d, i) => {
      const groupX = PAD_L + i * barGroupW + barGroupW / 2;

      // Income bar
      const incH = (d.income / maxVal) * chartH;
      const incX = groupX - barW - gap / 2;
      const incY = PAD_T + chartH - incH;
      const rInc = Math.min(barW / 2, 6);
      this._roundRect(ctx, incX, incY, barW, incH, rInc, '#10B981');

      // Expense bar
      const expH = (d.expense / maxVal) * chartH;
      const expX = groupX + gap / 2;
      const expY = PAD_T + chartH - expH;
      const rExp = Math.min(barW / 2, 6);
      this._roundRect(ctx, expX, expY, barW, expH, rExp, '#EF4444');

      // Label
      ctx.fillStyle = textColor;
      ctx.font = `500 10px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(d.label, groupX, H - 8);
    });

    // Legend
    ctx.font = `600 10px Inter, sans-serif`;
    ctx.fillStyle = '#10B981';
    ctx.fillRect(PAD_L, PAD_T - 12, 10, 6);
    ctx.fillStyle = textColor;
    ctx.textAlign = 'left';
    ctx.fillText('Pemasukan', PAD_L + 14, PAD_T - 7);

    ctx.fillStyle = '#EF4444';
    ctx.fillRect(PAD_L + 85, PAD_T - 12, 10, 6);
    ctx.fillStyle = textColor;
    ctx.fillText('Pengeluaran', PAD_L + 99, PAD_T - 7);
  },

  _roundRect(ctx, x, y, w, h, r, color) {
    if (h <= 0) return;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x, y + h);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  },
};
