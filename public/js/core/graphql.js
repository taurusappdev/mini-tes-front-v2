(() => {
  function pickFirstErrorMessage(errors) {
    if (!Array.isArray(errors) || !errors.length) return null;
    return errors.map(e => e?.message).filter(Boolean).join(" | ") || "GraphQL error";
  }

  async function request({ url, query, variables = {}, headers = {} }) {
    if (!url) throw new Error("GraphQL URL no configurada.");

    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        ...headers,
      },
      body: JSON.stringify({ query, variables }),
    });

    let json;
    try {
      json = await resp.json();
    } catch {
      throw new Error(`Respuesta no-JSON (HTTP ${resp.status}).`);
    }

    if (!resp.ok) {
      throw new Error(`HTTP ${resp.status}: ${JSON.stringify(json, null, 2)}`);
    }

    const gqlMsg = pickFirstErrorMessage(json.errors);
    if (gqlMsg) {
      throw new Error(`GraphQL errors: ${gqlMsg}`);
    }

    return json.data;
  }

  window.GQL = { request };
})();
