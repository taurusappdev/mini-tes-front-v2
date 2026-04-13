(() => {
  const $ = (id) => document.getElementById(id);

  function showError(msg) {
    const el = $("err");
    el.style.display = "block";
    el.textContent = msg;
  }

  function clearError() {
    const el = $("err");
    el.style.display = "none";
    el.textContent = "";
  }

  function setStatus(msg) {
    const el = $("status");
    if (el) el.textContent = msg || "";
  }

  function fmtDate(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return String(iso);
    return d.toLocaleString();
  }

  function renderRows(rows) {
    const tbody = $("tbody");
    tbody.innerHTML = "";

    if (!rows || !rows.length) {
      tbody.innerHTML = `<tr><td colspan="3" class="muted">Sin registros.</td></tr>`;
      return;
    }

    for (const r of rows) {
      const tr = document.createElement("tr");

      const td1 = document.createElement("td");
      td1.textContent = r.name || "";
      tr.appendChild(td1);

      const td2 = document.createElement("td");
      td2.textContent = fmtDate(r.createdAt);
      tr.appendChild(td2);

      const td3 = document.createElement("td");
      td3.textContent = fmtDate(r.updatedAt);
      tr.appendChild(td3);

      tbody.appendChild(tr);
    }
  }

  async function list() {
    const cfg = window.MINI_TES || {};
    const query = `
      query List($limit: Int) {
        listChecklists(limit: $limit) {
          id
          name
          createdAt
          updatedAt
        }
      }
    `;

    const data = await window.GQL.request({
      url: cfg.graphqlUrl,
      query,
      variables: { limit: 50 },
    });

    return data.listChecklists || [];
  }

  async function create(name) {
    const cfg = window.MINI_TES || {};
    const mutation = `
      mutation Create($name: String!) {
        createChecklist(name: $name) {
          id
          name
          createdAt
          updatedAt
        }
      }
    `;

    const data = await window.GQL.request({
      url: cfg.graphqlUrl,
      query: mutation,
      variables: { name },
    });

    return data.createChecklist;
  }

  async function refresh() {
    setStatus("Actualizando…");
    const rows = await list();
    renderRows(rows);
    setStatus("Listo.");
  }

  function init() {
    $("btnCreate")?.addEventListener("click", async () => {
      clearError();
      const name = String($("clName")?.value || "").trim();
      if (!name) return showError("Escribe un nombre para el checklist.");

      setStatus("Creando…");
      $("btnCreate").disabled = true;

      try {
        await create(name);
        $("clName").value = "";
        await refresh();
      } catch (e) {
        showError(String(e?.message || e));
      } finally {
        $("btnCreate").disabled = false;
        setStatus("");
      }
    });

    $("btnRefresh")?.addEventListener("click", () => {
      clearError();
      refresh().catch(e => showError(String(e?.message || e)));
    });

    refresh().catch(e => showError(String(e?.message || e)));
  }

  document.addEventListener("DOMContentLoaded", init);
})();
