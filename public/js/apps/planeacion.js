(() => {
  const $ = (id) => document.getElementById(id);

  function showError(msg) {
    const el = $('err');
    el.style.display = 'block';
    el.textContent = msg;
  }

  function clearError() {
    const el = $('err');
    el.style.display = 'none';
    el.textContent = '';
  }

  function setLoading(isLoading, msg = '') {
    $('btnRun').disabled = isLoading;
    $('status').textContent = msg;
  }

  function render(result) {
    $('outCard').style.display = 'block';

    // warnings generales
    const warnings = result?.warnings || [];
    const wb = $('warningsBlock');
    const wl = $('warnings');
    wl.innerHTML = '';

    if (warnings.length) {
      wb.style.display = 'block';
      for (const w of warnings) {
        const li = document.createElement('li');
        li.textContent = String(w);
        wl.appendChild(li);
      }
    } else {
      wb.style.display = 'none';
    }

    // tabla
    const rows = result?.asignaciones || [];
    const tbody = $('tbody');
    tbody.innerHTML = '';

    for (const r of rows) {
      const tr = document.createElement('tr');

      const td = (txt) => {
        const x = document.createElement('td');
        x.textContent = txt ?? '';
        return x;
      };

      tr.appendChild(td(r.codigo ?? ''));
      tr.appendChild(td(r.demanda ?? ''));
      tr.appendChild(td(r.maquina ?? ''));
      tr.appendChild(td(window.FMT.fmt2(r.tc)));
      tr.appendChild(td(window.FMT.fmt2(r.scrap)));
      tr.appendChild(td(window.FMT.fmt2(r.score)));
      tr.appendChild(td(r.molde ?? ''));
      tr.appendChild(td(r.fuenteTc ?? ''));
      tr.appendChild(td(window.FMT.joinWarnings(r.warnings)));

      tbody.appendChild(tr);
    }
  }

  async function runPlanificadorV1(items) {
    const cfg = window.MINI_TES || {};
    const url = cfg.graphqlUrl;

    const mutation = `
      mutation RunPlanificadorV1($input: RunPlanificadorV1Input!) {
        runPlanificadorV1(input: $input) {
          warnings
          asignaciones {
            codigo
            demanda
            molde
            maquina
            tc
            scrap
            score
            fuenteTc
            warnings
          }
        }
      }
    `;

    const minEl = document.getElementById('minMuestras');
    const minMuestras = minEl ? parseInt(minEl.value, 10) : NaN;

    // Construimos el input base
    const inputBase = { items };

    // Intento 1: con minMuestras (solo si es número válido)
    const inputConMin = (!Number.isNaN(minMuestras))
      ? { ...inputBase, minMuestras }
      : inputBase;

    async function call(input) {
      const data = await window.GQL.request({
        url,
        query: mutation,
        variables: { input },
      });
      const out = data?.runPlanificadorV1;
      if (!out) throw new Error('No llegó data.runPlanificadorV1. Revisa firma/campos del schema.');
      return out;
    }

    try {
      return await call(inputConMin);
    } catch (e) {
      const msg = String(e?.message || e);

      // Fallback automático si el schema no soporta minMuestras
      const noSoportaMin =
        msg.includes('minMuestras') &&
        (msg.includes('not defined') || msg.includes('Unknown field') || msg.includes('Cannot query'));

      if (noSoportaMin && inputConMin !== inputBase) {
        // Reintenta sin minMuestras
        return await call(inputBase);
      }
      throw e;
    }
  }


  function init() {
    const cfg = window.MINI_TES || {};
    if ($('gqlUrl')) $('gqlUrl').textContent = cfg.graphqlUrl || '(no configurado)';

    const btn = $('btnRun');
    if (!btn) return;

    btn.addEventListener('click', async () => {
      clearError();
      $('outCard').style.display = 'none';

      const { items, bad } = window.FMT.parseSkuDemandLines($('input').value);

      if (!items.length) {
        showError('No hay líneas válidas. Usa formato: CODIGO,DEMANDA');
        return;
      }
      if (bad.length) {
        showError('Estas líneas no se pudieron leer (corrígelas):\n- ' + bad.join('\n- '));
        return;
      }

      setLoading(true, 'Ejecutando…');

      try {
        const result = await runPlanificadorV1(items);
        render(result);
        setLoading(false, 'Listo.');
      } catch (e) {
        setLoading(false, 'Error.');
        showError(String(e?.message || e));
      }
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
