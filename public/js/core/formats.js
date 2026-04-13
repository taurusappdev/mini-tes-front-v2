(() => {
  // 2 decimales “conservador” (evita ruido)
  function fmt2(v) {
    if (v === null || v === undefined || v === '') return '';
    const n = Number(v);
    return Number.isNaN(n) ? String(v) : n.toFixed(2);
  }

  function joinWarnings(arr) {
    if (!Array.isArray(arr)) return '';
    return arr.map(x => String(x)).join(' | ');
  }

  // Lee líneas "CODIGO,DEMANDA"
  function parseSkuDemandLines(text) {
    const lines = String(text || '')
      .split(/\r?\n/)
      .map(s => s.trim())
      .filter(Boolean);

    const items = [];
    const bad = [];

    for (const line of lines) {
      const parts = line.split(',').map(s => s.trim());
      if (parts.length < 2) { bad.push(line); continue; }

      const codigo = (parts[0] || '').toUpperCase();
      const demanda = parseInt(parts[1], 10);

      if (!codigo || Number.isNaN(demanda)) { bad.push(line); continue; }
      items.push({ codigo, demanda });
    }

    return { items, bad };
  }

  window.FMT = { fmt2, joinWarnings, parseSkuDemandLines };
})();
