// ===========================
// ASISTENTE INTELIGENTE (IA) - APPLE INTELLIGENCE STYLE (Laravel + GraphQL proxy)
// ===========================

(function () {
  // ---------- Helpers ----------
  function getCsrfToken() {
    const el = document.querySelector('meta[name="csrf-token"]');
    return el ? el.getAttribute('content') : '';
  }

  function getSessionId() {
    const key = 'atenea_session_id';
    let sid = localStorage.getItem(key);
    if (!sid) {
      // fallback simple (sin depender de crypto en browsers viejos)
      sid = 'web-' + Math.random().toString(36).slice(2) + '-' + Date.now();
      localStorage.setItem(key, sid);
    }
    return sid;
  }

  // ---------- KaTeX loader (tu lógica) ----------
  if (!document.getElementById('katexLib')) {
    const katexCSS = document.createElement('link');
    katexCSS.rel = 'stylesheet';
    katexCSS.href = 'https://cdn.jsdelivr.net/npm/katex@0.17.0/dist/katex.min.css';
    document.head.appendChild(katexCSS);

    const katexJS = document.createElement('script');
    katexJS.id = 'katexLib';
    katexJS.defer = true;
    katexJS.src = 'https://cdn.jsdelivr.net/npm/katex@0.17.0/dist/katex.min.js';
    document.head.appendChild(katexJS);

    const autoRender = document.createElement('script');
    autoRender.defer = true;
    autoRender.src = 'https://cdn.jsdelivr.net/npm/katex@0.17.0/dist/contrib/auto-render.min.js';
    document.head.appendChild(autoRender);
  }

  // ---------- Crear UI si no existe ----------
  if (!document.getElementById('asistenteBtn')) {
    const btn = document.createElement('button');
    btn.id = 'asistenteBtn';
    btn.innerHTML = '<span class="ai-label">AI</span>';
    document.body.appendChild(btn);
  }

  if (!document.getElementById('asistenteVentana')) {
    const w = document.createElement('div');
    w.id = 'asistenteVentana';
    w.innerHTML = `
      <div class="asistente-header">
        <span class="asistente-titulo">
          <i class="fas fa-brain" style="margin-right:8px;"></i>
          Atenea: AI Assistant
        </span>
        <button id="cerrarAsistente">×</button>
      </div>
      <div id="asistenteChat"></div>

      <div class="asistente-input-container">
        <input type="text" id="asistentePregunta" placeholder="Pregúntale a Atenea..." />
        <button id="asistenteVoz" title="Voz">
          <i class="fas fa-microphone"></i>
        </button>
        <button id="asistenteEnviar"><i class="fas fa-arrow-up"></i></button>
      </div>
    `;
    document.body.appendChild(w);
  }

  // ---------- Referencias globales ----------
  const asistenteBtn = document.getElementById('asistenteBtn');
  const asistenteVentana = document.getElementById('asistenteVentana');

  // ---------- Flags UI (efectos visuales) ----------
  // Si no quieres partículas azules al “Procesando…”, deja esto en false.
  const UI_FLAGS = {
    typingParticles: false,
  };

  let isAnimating = false;
  let isProcessing = false;
  let isClosing = false;
  let closingTimeout = null;
  let currentAnimEndHandler = null;

  // ==========================
  // VOZ (Realtime WebRTC) - Ruta A / B-light
  // ==========================
  let rt = { pc: null, dc: null, mic: null, audioEl: null, active: false };

  // ---------- Animación del botón ----------
  function iniciarAnimacionBoton(tipo = 'slow') {
    const duracion = tipo === 'fast' ? '4s' : '6s';
    const nombre = tipo === 'fast' ? 'apple-glow-fast' : 'apple-glow-slow';
    asistenteBtn.style.animation = `${nombre} ${duracion} ease-out infinite`;
  }

  function detenerAnimacionBoton() {
    asistenteBtn.style.animation = '';
  }

  function aplicarAnimacionMensaje(elemento, tipo = 'glow', duracion = 0.8) {
    if (tipo === 'glow') {
      elemento.style.animation = `apple-glow-slow ${duracion}s ease-out`;
      setTimeout(() => (elemento.style.animation = ''), duracion * 1000);
    }
  }

  // ---------- Abrir / Cerrar ----------
  function abrirVentana() {
    if (isAnimating || asistenteVentana.classList.contains('visible')) return;
    isAnimating = true;
    isClosing = false;

    asistenteVentana.style.display = 'flex';
    asistenteVentana.offsetHeight; // reflow
    iniciarAnimacionBoton('slow');
    asistenteVentana.classList.add('visible');

    const handleAnimEnd = (e) => {
      if (e.animationName === 'slideIn') {
        asistenteVentana.style.animation = 'apple-glow-slow 6s ease-out infinite';
        asistenteVentana.removeEventListener('animationend', handleAnimEnd);
        currentAnimEndHandler = null;
        const input = document.getElementById('asistentePregunta');
        if (input) input.focus();
        isAnimating = false;
      }
    };
    currentAnimEndHandler = handleAnimEnd;
    asistenteVentana.addEventListener('animationend', handleAnimEnd);
  }

  function completarCierre() {
    if (currentAnimEndHandler) {
      asistenteVentana.removeEventListener('animationend', currentAnimEndHandler);
      currentAnimEndHandler = null;
    }

    if (closingTimeout) {
      clearTimeout(closingTimeout);
      closingTimeout = null;
    }

    asistenteVentana.style.display = 'none';
    asistenteVentana.style.animation = '';
    isAnimating = false;
    isClosing = false;
  }

  function cerrarVentana() {
    if (!asistenteVentana.classList.contains('visible')) return;
    if (isAnimating || isClosing) return;
    isAnimating = true;
    isClosing = true;

    // ✅ MUY IMPORTANTE: cuelga si hay llamada activa (no dejes mic abierto)
    if (rt?.active) stopVoice();

    detenerAnimacionBoton();
    if (isProcessing) desactivarEfectosProcesamiento();

    asistenteVentana.style.animation =
      'slideOut 0.4s cubic-bezier(0.55, 0.06, 0.68, 0.19) forwards';
    asistenteVentana.classList.remove('visible');

    closingTimeout = setTimeout(() => completarCierre(), 500);

    const handleAnimEnd = () => {
      if (closingTimeout) {
        clearTimeout(closingTimeout);
        closingTimeout = null;
      }
      completarCierre();
    };

    asistenteVentana.addEventListener('animationend', handleAnimEnd);
    currentAnimEndHandler = handleAnimEnd;
  }

  // ---------- Efectos procesamiento ----------
  function actualizarAnimacionResplandor() {
    asistenteVentana.style.animation = isProcessing
      ? 'apple-glow-fast 4s ease-out infinite'
      : 'apple-glow-slow 6s ease-out infinite';
  }

  function activarEfectosProcesamiento() {
    isProcessing = true;
    document.body.classList.add('processing');
    asistenteBtn.classList.add('active');
    asistenteVentana.classList.add('active');
    actualizarAnimacionResplandor();
    iniciarAnimacionBoton('fast');
  }

  function desactivarEfectosProcesamiento() {
    isProcessing = false;
    document.body.classList.remove('processing');
    asistenteBtn.classList.remove('active');
    asistenteVentana.classList.remove('active');
    actualizarAnimacionResplandor();
    iniciarAnimacionBoton('slow');
  }

  // ---------- Ripple click ----------
  function crearEfectoClick() {
    const ripple = document.createElement('div');
    const rect = asistenteBtn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);

    ripple.style.cssText = `
      position:absolute;
      top:50%;
      left:50%;
      width:${size}px;
      height:${size}px;
      border-radius:50%;
      background: radial-gradient(circle, rgba(0, 122, 255, 0.3) 0%, transparent 70%);
      transform: translate(-50%, -50%) scale(0);
      animation: ripple-effect 0.6s ease-out forwards;
      pointer-events:none;
    `;
    asistenteBtn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  }

  // ---------- Mensajes ----------
  function crearParticulaIndividual(container) {
    const p = document.createElement('div');
    const size = 4 + Math.random() * 6;
    p.style.cssText = `
      position:absolute;
      width:${size}px;
      height:${size}px;
      border-radius:50%;
      left:${10 + Math.random() * 80}%;
      top:${20 + Math.random() * 60}%;
      background: rgba(90, 200, 250, ${0.25 + Math.random() * 0.35});
      animation: float-particle ${1.2 + Math.random()}s ease-in-out infinite;
      filter: blur(0.2px);
    `;
    container.appendChild(p);
    setTimeout(() => p.remove(), 2000);
  }

  function crearParticulasTyping(elemento) {
    const particulas = document.createElement('div');
    particulas.className = 'typing-particles';
    particulas.style.cssText = `
      position:absolute;
      top:0; left:0; right:0; bottom:0;
      pointer-events:none;
      overflow:hidden;
    `;
    elemento.appendChild(particulas);

    for (let i = 0; i < 3; i++) {
      setTimeout(() => crearParticulaIndividual(particulas), i * 200);
    }
  }

  function agregarMensaje(origen, texto, isTyping = false) {
    const chat = document.getElementById('asistenteChat');
    const msg = document.createElement('div');
    msg.className = `mensaje ${origen}${isTyping ? ' typing' : ''}`;

    if (isTyping) {
      msg.innerHTML = `<p>Procesando<span class="dots">...</span></p>`;
      if (UI_FLAGS.typingParticles) crearParticulasTyping(msg);
    } else {
      const html = window.marked ? window.marked.parse(texto) : texto;
      msg.innerHTML = `<div>${html}</div>`;
    }

    if (window.renderMathInElement) {
      window.renderMathInElement(msg, {
        delimiters: [
          { left: "$$", right: "$$", display: true },
          { left: "$", right: "$", display: false },
          { left: "\\[", right: "\\]", display: true },
          { left: "\\(", right: "\\)", display: false },
        ],
        throwOnError: false,
      });
    }

    msg.style.opacity = '0';
    msg.style.transform = 'translateY(20px) scale(0.9)';

    chat.appendChild(msg);

    requestAnimationFrame(() => {
      msg.style.transition = 'all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
      msg.style.opacity = '1';
      msg.style.transform = 'translateY(0) scale(1)';

      if (origen === 'asistente' && !isTyping) {
        setTimeout(() => aplicarAnimacionMensaje(msg, 'glow', 0.8), 200);
      }
    });

    chat.scrollTop = chat.scrollHeight;
    return msg;
  }

  function simularEscritura(elemento, texto) {
    return new Promise((resolve) => {
      elemento.classList.remove('typing');
      const particulas = elemento.querySelector('.typing-particles');
      if (particulas) particulas.remove();

      const p = elemento.querySelector('p') || elemento.querySelector('div') || elemento;
      const parsed = window.marked ? window.marked.parse(texto) : texto;

      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = parsed;
      const finalText = tempDiv.innerText || texto;

      p.textContent = '';
      elemento.style.animation = 'apple-glow-slow 6s ease-out infinite';

      const cursor = document.createElement('span');
      cursor.textContent = '|';
      cursor.style.cssText = `color:#007AFF; animation: cursor-blink 1s infinite; font-weight:normal;`;
      p.appendChild(cursor);

      let i = 0;
      const escribir = () => {
        if (i < finalText.length) {
          const ch = finalText.charAt(i);
          p.insertBefore(document.createTextNode(ch), cursor);
          i++;

          const delay = ['.', ',', '!', '?'].includes(ch)
            ? 20 + Math.random() * 20
            : 4 + Math.random() * 8;

          setTimeout(escribir, delay);
        } else {
          cursor.remove();
          elemento.innerHTML = `<div>${parsed}</div>`;
          elemento.style.animation = '';
          aplicarAnimacionMensaje(elemento, 'glow', 0.8);
          resolve();
        }
      };

      escribir();
    });
  }

  // ==========================
  // VOZ (Realtime WebRTC) - Ruta A / B-light
  // ==========================
  function setVoiceUi(active) {
    const b = document.getElementById('asistenteVoz');
    if (!b) return;
    b.classList.toggle('listening', !!active);
    const icon = b.querySelector('i');
    if (icon) icon.className = active ? 'fas fa-phone-slash' : 'fas fa-microphone';
    b.title = active ? 'Colgar' : 'Voz';
  }

  function waitForIceGatheringComplete(pc) {
    if (pc.iceGatheringState === "complete") return Promise.resolve();
    return new Promise((resolve) => {
      const onState = () => {
        if (pc.iceGatheringState === "complete") {
          pc.removeEventListener("icegatheringstatechange", onState);
          resolve();
        }
      };
      pc.addEventListener("icegatheringstatechange", onState);
    });
  }

  async function startVoice() {
    if (rt.active) return;

    const csrf = getCsrfToken();
    const session_id = getSessionId();

    let pc = null, dc = null, mic = null, audioEl = null;

    try {
      // 1) token efímero desde tu backend Laravel (GET) - con error explícito
      const r = await fetch('/admin/asistente/realtime-token', {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });

      const data = await r.json().catch(() => ({}));

      if (!r.ok || data.ok === false) {
        throw new Error(data.error || `Token error (${r.status})`);
      }

      const EPHEMERAL_KEY = data.client_secret;
      if (!EPHEMERAL_KEY) throw new Error("No se pudo obtener client_secret");

      // 2) WebRTC
      pc = new RTCPeerConnection({
        iceServers: [{ urls: ["stun:stun.l.google.com:19302"] }],
      });

      dc = pc.createDataChannel("oai-events");

      audioEl = document.createElement("audio");
      audioEl.autoplay = true;
      audioEl.style.display = "none";
      document.body.appendChild(audioEl);

      pc.ontrack = (e) => {
        audioEl.srcObject = e.streams[0];
        audioEl.play?.().catch(() => {});
      };

      mic = await navigator.mediaDevices.getUserMedia({ audio: true });
      mic.getTracks().forEach(track => pc.addTrack(track, mic));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // ✅ evita problemas intermitentes: espera candidatos ICE
      await waitForIceGatheringComplete(pc);

      // 3) Crear call en OpenAI con SDP (WebRTC)
      const realtimeModel = data.model || 'gpt-4o-realtime-preview';
      const sdpResp = await fetch(`https://api.openai.com/v1/realtime?model=${encodeURIComponent(realtimeModel)}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${EPHEMERAL_KEY}`,
          "Content-Type": "application/sdp",
        },
        body: pc.localDescription.sdp,
      });

      if (!sdpResp.ok) {
        const errText = await sdpResp.text().catch(() => "");
        throw new Error(errText || "Fallo al crear call realtime");
      }

      const answerSdp = await sdpResp.text();
      await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });

      // 4) Tool bridge: mini_tes_ask -> /admin/asistente (TU “cerebro” GraphQL/BD -> TS)
      dc.onmessage = async (ev) => {
        let msg;
        try { msg = JSON.parse(ev.data); } catch { return; }

        // Errores del server
        if (msg.type === "error") {
          console.error("Realtime error:", msg?.error || msg);
          return;
        }

        // Esperamos el cierre de respuesta
        if (msg.type !== "response.done") return;

        const outputs = msg.response?.output ?? [];
        for (const outItem of outputs) {
          if (outItem.type !== "function_call") continue;
          if (outItem.name !== "mini_tes_ask") continue;

          // args
          let args = {};
          try { args = JSON.parse(outItem.arguments || "{}"); } catch {}

          const pregunta = (args.pregunta || "").toString().trim();
          const safePregunta = pregunta || "(sin pregunta)";

          // 1) ejecuta tu tool contra tu backend (usa CSRF + session_id local)
          const toolResp = await fetch("/admin/asistente", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-CSRF-TOKEN": csrf,
              "Accept": "application/json"
            },
            body: JSON.stringify({ pregunta: safePregunta, session_id }),
          }).then(r => r.json()).catch(() => ({}));

          const respuesta =
            toolResp?.respuesta ||
            toolResp?.error ||
            "No pude obtener respuesta del backend.";

          // 2) responde a la tool (IMPORTANTE: mismo call_id)
          if (!dc || dc.readyState !== 'open') {
            console.error("DataChannel cerrado al intentar responder tool call");
            return;
          }

          try {
            dc.send(JSON.stringify({
              type: "conversation.item.create",
              item: {
                type: "function_call_output",
                call_id: outItem.call_id,
                output: JSON.stringify({ respuesta }),
              }
            }));
          } catch (e) {
            console.error("No se pudo enviar function_call_output:", e);
            return;
          }

          // 3) obliga al modelo a contestar (en voz)
          try {
            dc.send(JSON.stringify({ type: "response.create" }));
          } catch (e) {
            console.error("No se pudo enviar response.create:", e);
          }
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "failed" || pc.connectionState === "disconnected" || pc.connectionState === "closed") {
          stopVoice();
        }
      };

      rt = { pc, dc, mic, audioEl, active: true };
      setVoiceUi(true);

      // opcional:
      // agregarMensaje('asistente', '🎙️ Voz activada. Habla normal; puedes colgar con el botón.');
    } catch (e) {
      // cleanup local (si falló antes de setear rt)
      try { mic?.getTracks?.()?.forEach(t => t.stop()); } catch {}
      try { dc?.close?.(); } catch {}
      try { pc?.close?.(); } catch {}
      try { audioEl?.remove?.(); } catch {}
      setVoiceUi(false);
      throw e;
    }
  }

  function stopVoice() {
    if (!rt.active) return;

    // Cortar respuesta en curso (si aplica)
    try { rt.dc?.send(JSON.stringify({ type: "response.cancel" })); } catch {}

    try { rt.mic?.getTracks()?.forEach(t => t.stop()); } catch {}
    try { rt.dc?.close(); } catch {}
    try { rt.pc?.close(); } catch {}
    try { rt.audioEl?.remove(); } catch {}

    rt = { pc: null, dc: null, mic: null, audioEl: null, active: false };
    setVoiceUi(false);
  }

  // ---------- Enviar pregunta (Laravel POST /asistente -> GraphQL) ----------
  async function enviarPregunta() {
    const input = document.getElementById('asistentePregunta');
    const pregunta = (input.value || '').trim();
    if (!pregunta) return;

    agregarMensaje('usuario', pregunta);
    input.value = '';

    activarEfectosProcesamiento();
    const mensajeAsistente = agregarMensaje('asistente', '', true);

    try {
      const res = await fetch('/admin/asistente', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': getCsrfToken(),
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          pregunta,
          session_id: getSessionId(),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        const errMsg = data.error || 'Error al contactar el asistente';
        throw new Error(errMsg);
      }

      await simularEscritura(mensajeAsistente, data.respuesta || '(sin respuesta)');
    } catch (err) {
      await simularEscritura(mensajeAsistente, err.message || 'Error desconocido al procesar tu solicitud.');
      console.error(err);
    } finally {
      setTimeout(() => desactivarEfectosProcesamiento(), 400);
    }
  }

  // ---------- Listeners ----------
  asistenteBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    crearEfectoClick();

    if (asistenteVentana.classList.contains('visible')) cerrarVentana();
    else abrirVentana();
  });

  document.getElementById('cerrarAsistente').addEventListener('click', (e) => {
    e.stopPropagation();
    cerrarVentana();
  });

  document.addEventListener('click', (e) => {
    if (!asistenteVentana.contains(e.target) && !asistenteBtn.contains(e.target)) cerrarVentana();
  });

  document.getElementById('asistenteEnviar').addEventListener('click', () => enviarPregunta());

  // ✅ Listener VOZ (debajo de #asistenteEnviar)
  document.getElementById('asistenteVoz')?.addEventListener('click', async () => {
    try {
      if (rt.active) stopVoice();
      else await startVoice();
    } catch (e) {
      console.error(e);
      agregarMensaje('asistente', 'No pude iniciar voz. Revisa permisos de micrófono y HTTPS.');
      stopVoice();
    }
  });

  document.getElementById('asistentePregunta').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') enviarPregunta();
  });

  // ---------- CSS dinámico (tu bloque) ----------
  const style = document.createElement('style');
  style.textContent = `
    @keyframes ripple-effect {
      0% { transform: translate(-50%, -50%) scale(0); opacity: 0.8; }
      100% { transform: translate(-50%, -50%) scale(2); opacity: 0; }
    }
    @keyframes cursor-blink {
      0%, 50% { opacity: 1; }
      51%, 100% { opacity: 0; }
    }
    @keyframes float-particle {
      0%, 100% { transform: translateY(0px) scale(1); opacity: 0.3; }
      50% { transform: translateY(-10px) scale(1.2); opacity: 0.8; }
    }
    .dots { animation: typing-dots 1.5s infinite; }
    @keyframes typing-dots { 0%, 60% { opacity: 0.4; } 30% { opacity: 1; } }

    /* (mínimo) estado visual del botón de voz */
    #asistenteVoz.listening { filter: brightness(1.15); }
  `;
  document.head.appendChild(style);

  // ---------- Bienvenida ----------
  setTimeout(() => {
    const chat = document.getElementById('asistenteChat');
    if (chat && chat.children.length === 0) {
      agregarMensaje(
        'asistente',
        '¡Hola! Soy **Atenea**. Tu asistente de IA de Taurus.\n\n¿En qué puedo asistirte hoy?'
      );
    }
  }, 200);
})();