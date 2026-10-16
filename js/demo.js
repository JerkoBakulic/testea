/* TESTEA — prototipo interactivo.
   Los resultados se calculan con un modelo simulado a partir de las decisiones del usuario
   (texto, llamado a la acción, visual y audiencia). No se publica nada en Meta. */
(function () {
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const clp = n => "$" + Math.round(n).toLocaleString("es-CL");
  const pct = n => n.toFixed(1).replace(".", ",") + "%";
  const k = n => n >= 1000 ? (n / 1000).toFixed(1).replace(".", ",") + "K" : String(Math.round(n));
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  /* ---------- Datos ---------- */
  const PLANS = {
    gratis: { name: "Gratis", credits: 5, desc: "Marcas TESTEA, campañas acotadas, KPI esenciales y trivias.", em: "🌱" },
    pro: { name: "Pro", credits: 30, desc: "Marca propia, historial A/B y análisis completo.", em: "⚡" },
    empresa: { name: "Empresa", credits: 100, desc: "Bolsa compartida, varios usuarios y aprobaciones.", em: "🏢" }
  };
  const BRANDS = {
    nexo: { name: "Nexo Academy", em: "🎓", cat: "Educación · Conversión", desc: "Programa online para jóvenes que buscan habilidades digitales.",
      objective: "Generar inscripciones", obj: "conversion", audience: "Jóvenes de 20 a 28 años", budget: 15000, primary: "cpa",
      words: ["empleo", "laboral", "trabajo", "oportunidad", "carrera", "certific", "sueldo"], goodCta: ["Inscríbete"],
      color: "linear-gradient(135deg,#7a5cf0,#ef5a7a)", art: "💻", base: { ctr: 2.3, conv: 3.6 },
      copy: "Aprende marketing digital con clases flexibles y a tu ritmo." },
    brava: { name: "Brava Move", em: "👟", cat: "Retail · Tráfico", desc: "Zapatillas urbanas para una audiencia activa y digital.",
      objective: "Llevar visitas a la tienda online", obj: "trafico", audience: "Personas de 18 a 35 años, urbanas", budget: 12000, primary: "cpc",
      words: ["comod", "envío", "descuento", "estilo", "liviana", "gratis", "nueva"], goodCta: ["Comprar", "Más información"],
      color: "linear-gradient(135deg,#23a07c,#ffd84a)", art: "👟", base: { ctr: 1.8, conv: 1.6 },
      copy: "Nueva colección de zapatillas urbanas. Descúbrela." },
    senda: { name: "Senda Café", em: "☕", cat: "Suscripción · Captación", desc: "Café de especialidad por suscripción mensual.",
      objective: "Captar suscriptores (leads)", obj: "captacion", audience: "Adultos de 25 a 45 años, amantes del café", budget: 10000, primary: "cpl",
      words: ["fresco", "origen", "mes", "ahorra", "primer", "casa", "tostado"], goodCta: ["Suscríbete", "Regístrate"],
      color: "linear-gradient(135deg,#8a5a3c,#f3b6cc)", art: "☕", base: { ctr: 2.0, conv: 5.2 },
      copy: "Café de especialidad todos los meses en tu casa." },
    propia: { name: "Mi propia marca", em: "✨", cat: "Disponible en Pro", desc: "Conecta tu marca, audiencia y propuesta de valor.",
      objective: "Generar conversiones", obj: "conversion", audience: "", budget: 20000, primary: "cpa",
      words: [], goodCta: ["Comprar", "Inscríbete", "Suscríbete"], color: "linear-gradient(135deg,#24135f,#7a5cf0)", art: "✨", base: { ctr: 2.1, conv: 3.2 },
      copy: "" }
  };
  const KPIS = {
    alcance: { n: "Alcance", d: "Personas únicas que vieron el anuncio" },
    impresiones: { n: "Impresiones", d: "Veces que se mostró" },
    likes: { n: "Me gusta", d: "Reacciones al anuncio" },
    seguidores: { n: "Seguidores", d: "Nuevos seguidores" },
    ctr: { n: "CTR", d: "% de clics sobre impresiones" },
    cpc: { n: "CPC", d: "Costo por clic" },
    conv: { n: "Tasa de conversión", d: "% de clics que convierten" },
    cpa: { n: "CPA", d: "Costo por adquisición" },
    cpl: { n: "CPL", d: "Costo por lead" },
    frecuencia: { n: "Frecuencia", d: "Veces que cada persona lo vio" }
  };
  const RELEV = {
    conversion: { good: ["conv", "cpa", "ctr"], ctx: ["cpc", "alcance", "frecuencia"], bad: ["likes", "seguidores", "impresiones", "cpl"] },
    trafico: { good: ["ctr", "cpc", "alcance"], ctx: ["frecuencia", "conv", "impresiones"], bad: ["likes", "seguidores", "cpa", "cpl"] },
    captacion: { good: ["cpl", "conv", "ctr"], ctx: ["cpc", "alcance", "frecuencia"], bad: ["likes", "seguidores", "impresiones", "cpa"] }
  };
  const CTAS = ["Más información", "Inscríbete", "Comprar", "Suscríbete", "Regístrate"];
  const VISUALS = { persona: "Persona usando el producto", producto: "Foto del producto", grafico: "Gráfico con texto" };
  const AUDS = { amplia: "Amplia", intereses: "Por intereses", similar: "Público similar" };
  const VARS = { mensaje: "Mensaje", cta: "Llamado a la acción", visual: "Visual", audiencia: "Audiencia" };
  const STEPS = ["Cuenta", "Marca", "Brief y KPI", "Anuncio", "Resultados", "Hipótesis", "Test A/B", "Comparación", "Aprendizaje"];

  /* ---------- Estado (créditos e historial persisten en este navegador) ---------- */
  const store = {
    get() { try { return JSON.parse(localStorage.getItem("testea-demo") || "{}"); } catch (e) { return {}; } },
    set(v) { try { localStorage.setItem("testea-demo", JSON.stringify(v)); } catch (e) { } }
  };
  const saved = store.get();
  const S = {
    step: 1, maxStep: 1, plan: saved.plan || null, credits: saved.credits ?? 0, history: saved.history || [],
    brand: null, own: {}, kpis: [], kpiChecked: false,
    A: null, B: null, mA: null, mB: null, variable: null, hyp: "", next: null, saved: false
  };
  const persist = () => store.set({ plan: S.plan, credits: S.credits, history: S.history });
  const brand = () => {
    const b = BRANDS[S.brand];
    if (S.brand !== "propia") return b;
    const words = (S.own.value || "").toLowerCase().split(/[^a-záéíóúñ]+/).filter(w => w.length > 4).map(w => w.slice(0, 6));
    return { ...b, name: S.own.name || b.name, desc: S.own.product, audience: S.own.audience, words, copy: S.own.value || "" };
  };

  /* ---------- Modelo de simulación ---------- */
  function rng(seedStr) { let h = 1779033703 ^ seedStr.length; for (let i = 0; i < seedStr.length; i++) { h = Math.imul(h ^ seedStr.charCodeAt(i), 3432918353); h = h << 13 | h >>> 19; } return () => { h = Math.imul(h ^ h >>> 16, 2246822507); h = Math.imul(h ^ h >>> 13, 3266489909); return ((h ^= h >>> 16) >>> 0) / 4294967296; }; }
  function simulate(ad, tag) {
    const b = brand(); const r = rng([S.brand, ad.copy, ad.cta, ad.visual, ad.aud, tag].join("|"));
    const noise = () => 0.93 + r() * 0.14;
    const text = ad.copy.toLowerCase();
    const hits = Math.min(2, b.words.filter(w => text.includes(w)).length);
    const words = ad.copy.trim().split(/\s+/).length;
    let ctr = b.base.ctr, conv = b.base.conv, reach = 11000 + r() * 3000, freq = 1.35;
    ctr *= 1 + 0.2 * hits; conv *= 1 + 0.18 * hits;
    if (words <= 14) ctr *= 1.08; else if (words > 28) ctr *= 0.88;
    if (/\?|!|\d/.test(ad.copy)) ctr *= 1.05;
    if (b.goodCta.includes(ad.cta)) conv *= 1.28; else if (ad.cta === "Más información") { ctr *= 1.06; conv *= 0.92; } else conv *= 0.85;
    if (ad.visual === "persona") ctr *= 1.16; else if (ad.visual === "producto") conv *= 1.1; else { ctr *= 0.94; conv *= 1.02; }
    if (ad.aud === "amplia") { reach *= 1.3; conv *= 0.82; ctr *= 0.95; } else if (ad.aud === "intereses") conv *= 1.14; else { reach *= 0.82; conv *= 1.24; ctr *= 1.04; }
    ctr *= noise(); conv *= noise();
    const imp = reach * freq, clicks = imp * ctr / 100, convs = Math.max(1, clicks * conv / 100), spend = b.budget;
    const likes = imp * (ad.visual === "persona" ? 0.016 : 0.011) * noise();
    return { alcance: reach, impresiones: imp, frecuencia: freq, likes, seguidores: likes * 0.07, clicks, ctr, cpc: spend / clicks, conv, convs, cpa: spend / convs, cpl: spend / convs };
  }
  const fmt = (key, m) => ({ alcance: k(m.alcance), impresiones: k(m.impresiones), frecuencia: m.frecuencia.toFixed(2).replace(".", ","), likes: k(m.likes), seguidores: k(m.seguidores),
    ctr: pct(m.ctr), cpc: clp(m.cpc), conv: pct(m.conv), cpa: clp(m.cpa), cpl: clp(m.cpl) })[key];
  const lowerIsBetter = key => ["cpc", "cpa", "cpl"].includes(key);

  /* ---------- Navegación ---------- */
  function renderStepper() {
    $("#stepper").innerHTML = STEPS.map((s, i) => `<li class="${i + 1 === S.step ? "on" : i + 1 < S.maxStep || i + 1 < S.step ? "done" : ""}"><i>${i + 1 < S.step ? "✓" : i + 1}</i><span>${s}</span></li>`).join("");
    $("#planName").textContent = S.plan ? "Plan " + PLANS[S.plan].name : "Sin plan";
    $("#planBrand").textContent = S.brand ? brand().name : "—";
  }
  function setCredits(n) { S.credits = n; $("#creditN").textContent = n; const c = $("#credits"); c.classList.remove("bump"); void c.offsetWidth; c.classList.add("bump"); persist(); }
  function go(n) {
    S.step = n; S.maxStep = Math.max(S.maxStep, n);
    $$(".view").forEach(v => v.classList.toggle("on", +v.dataset.step === n));
    $$(".err").forEach(e => e.classList.remove("on"));
    renderStepper(); ENTER[n] && ENTER[n]();
    scrollTo({ top: 0, behavior: "smooth" });
  }
  const fail = n => { const e = $(`[data-err="${n}"]`); e.classList.add("on"); e.scrollIntoView({ behavior: "smooth", block: "center" }); return false; };
  const CHECK = {
    1: () => S.plan || fail(1),
    2: () => { if (!S.brand) return fail(2); if (S.brand === "propia") { ["Name", "Product", "Audience", "Value"].forEach(f => S.own[f.toLowerCase()] = $("#ob" + f).value.trim()); if (!S.own.name || !S.own.product || !S.own.value) return fail(2); } return true; },
    3: () => (S.kpis.length === 3 && S.kpiChecked) || fail(3),
    6: () => { S.hyp = $("#hypText").value.trim(); return (S.variable && /^si\b/i.test(S.hyp) && /(aument|disminu|mejor|reduc|sub|baj)/i.test(S.hyp) && S.hyp.length > 25) || fail(6); }
  };
  $$("[data-next]").forEach(b => b.addEventListener("click", () => { const from = S.step; if (CHECK[from] && !CHECK[from]()) return; go(+b.dataset.next); }));
  $$("[data-prev]").forEach(b => b.addEventListener("click", () => go(+b.dataset.prev)));

  /* ---------- Componentes ---------- */
  const seg = (el, opts, val, onPick, disabled = []) => {
    el.innerHTML = Object.entries(opts).map(([k, v]) => `<button type="button" data-k="${k}" class="${k === val ? "on" : ""}" ${disabled.includes(k) ? "disabled" : ""}>${v}</button>`).join("");
    el.onclick = e => { const b = e.target.closest("button"); if (!b || b.disabled) return; el.querySelectorAll("button").forEach(x => x.classList.toggle("on", x === b)); onPick(b.dataset.k); };
  };
  const ctaOpts = Object.fromEntries(CTAS.map(c => [c, c]));
  function post(ad) {
    const b = brand();
    const art = ad.visual === "persona" ? "🙋" : ad.visual === "producto" ? b.art : "📊";
    return `<div class="hd"><i>${b.em}</i><div><b>${esc(b.name)}</b><small>Publicidad · ${AUDS[ad.aud]}</small></div></div>
      <div class="img" style="background:${b.color}">${art}<span>${esc(ad.copy.split(/[.!?]/)[0].slice(0, 60))}</span></div>
      <div class="cta"><span>${esc(b.name.toLowerCase().replace(/\s+/g, ""))}.cl</span><em>${esc(ad.cta)}</em></div>
      <div class="tx"><b>${esc(b.name)}</b> ${esc(ad.copy)}</div>`;
  }

  /* ---------- Pasos ---------- */
  const ENTER = {};
  ENTER[1] = () => {
    $("#plans").innerHTML = Object.entries(PLANS).map(([key, p]) => `<button class="choice ${S.plan === key ? "sel" : ""}" data-k="${key}"><span class="em">${p.em}</span><small>Plan</small><b>${p.name}</b><span>${p.desc}</span><div class="cr">${p.credits} <em>créditos${key === "empresa" ? " compartidos" : " / mes"}</em></div></button>`).join("");
    $("#plans").onclick = e => { const c = e.target.closest(".choice"); if (!c) return;
      if (S.plan !== c.dataset.k) { S.plan = c.dataset.k; setCredits(PLANS[S.plan].credits); }
      $$("#plans .choice").forEach(x => x.classList.toggle("sel", x === c)); renderStepper(); };
  };
  ENTER[2] = () => {
    const free = S.plan === "gratis";
    $("#brands").innerHTML = Object.entries(BRANDS).map(([key, b]) => { const lock = key === "propia" && free;
      return `<button class="choice ${S.brand === key ? "sel" : ""} ${lock ? "lock" : ""}" data-k="${key}" ${lock ? 'title="Disponible en Pro y Empresa"' : ""}><span class="em">${lock ? "🔒" : b.em}</span><small>${b.cat}</small><b>${b.name}</b><span>${b.desc}</span></button>`; }).join("");
    $("#ownBrand").style.display = S.brand === "propia" ? "block" : "none";
    $("#brands").onclick = e => { const c = e.target.closest(".choice"); if (!c || c.classList.contains("lock")) return;
      if (S.brand !== c.dataset.k) { S.brand = c.dataset.k; S.kpis = []; S.kpiChecked = false; S.A = null; }
      $$("#brands .choice").forEach(x => x.classList.toggle("sel", x === c));
      $("#ownBrand").style.display = S.brand === "propia" ? "block" : "none"; renderStepper(); };
  };
  ENTER[3] = () => {
    const b = brand();
    $("#brief").innerHTML = [["Marca", b.name], ["Objetivo", b.objective], ["Audiencia", b.audience || "Definida por ti"], ["Presupuesto Meta", clp(b.budget) + " controlados"]]
      .map(([t, d]) => `<div><dt>${t}</dt><dd>${esc(d)}</dd></div>`).join("");
    const draw = () => {
      const rel = RELEV[b.obj];
      $("#kpis").innerHTML = Object.entries(KPIS).map(([key, x]) => {
        const sel = S.kpis.includes(key);
        let cls = sel ? "sel" : "", v = "";
        if (S.kpiChecked && sel) { if (rel.good.includes(key)) { cls = "good"; v = "Útil para el objetivo"; } else if (rel.ctx.includes(key)) { cls = "ctx"; v = "Contexto, no decide"; } else { cls = "bad"; v = "Métrica de vanidad"; } }
        return `<button class="kpi ${cls}" data-k="${key}"><b>${x.n}</b><span>${x.d}</span><span class="v">${v}</span></button>`;
      }).join("");
      $("#kpiCount").textContent = S.kpis.length + "/3";
      if (S.kpiChecked) {
        const good = S.kpis.filter(x => rel.good.includes(x)).length;
        $("#kpiScore").innerHTML = good === 3 ? "🎯 ¡Perfecto! Los 3 miden directamente el objetivo." :
          `${good}/3 útiles. Para “${esc(b.objective.toLowerCase())}”, los KPI que deciden son: <b>${rel.good.map(x => KPIS[x].n).join(", ")}</b>.`;
      } else $("#kpiScore").textContent = "";
    };
    $("#kpis").onclick = e => { const c = e.target.closest(".kpi"); if (!c) return; const key = c.dataset.k;
      S.kpiChecked = false;
      if (S.kpis.includes(key)) S.kpis = S.kpis.filter(x => x !== key); else if (S.kpis.length < 3) S.kpis.push(key);
      draw(); };
    $("#checkKpi").onclick = () => { if (S.kpis.length !== 3) return fail(3); S.kpiChecked = true; draw(); };
    draw();
  };
  ENTER[4] = () => {
    const b = brand();
    if (!S.A) S.A = { copy: b.copy, cta: "Más información", visual: "producto", aud: "amplia" };
    const ta = $("#aCopy"); ta.value = S.A.copy;
    const refresh = () => $("#aPreview").innerHTML = post(S.A);
    ta.oninput = () => { S.A.copy = ta.value; refresh(); };
    seg($("#aCta"), ctaOpts, S.A.cta, v => { S.A.cta = v; refresh(); });
    seg($("#aVisual"), VISUALS, S.A.visual, v => { S.A.visual = v; refresh(); });
    seg($("#aAud"), AUDS, S.A.aud, v => { S.A.aud = v; refresh(); }, S.plan === "gratis" ? ["similar"] : []);
    $("#publishA").textContent = S.plan === "empresa" ? "Enviar a aprobación · 1 crédito" : "Publicar en Meta · 1 crédito";
    refresh();
  };
  function spend(btn, approval, then) {
    if (S.credits < 1) { alertCredits(btn); return; }
    const run = () => { setCredits(S.credits - 1); then(); };
    if (S.plan === "empresa") { btn.disabled = true; approval.classList.add("on"); setTimeout(() => { approval.innerHTML = "✓ Aprobado por la coordinadora del equipo (demo)"; setTimeout(() => { btn.disabled = false; approval.classList.remove("on"); approval.innerHTML = '<span class="sp"></span><span>Enviado a aprobación del líder de equipo…</span>'; run(); }, 700); }, 1300); }
    else run();
  }
  function alertCredits(btn) {
    const e = document.createElement("div"); e.className = "err on";
    e.innerHTML = "Te quedaste sin créditos. En el producto real podrías esperar al próximo mes o pasar a Pro. <a href='#' style='text-decoration:underline'>Recargar créditos de la demo</a>";
    btn.closest("section").appendChild(e);
    e.querySelector("a").onclick = ev => { ev.preventDefault(); setCredits(PLANS[S.plan].credits); e.remove(); };
  }
  function animateLaunch(bar, msg, msgs, done) {
    let i = 0; bar.style.width = "0";
    const t = setInterval(() => { i++; bar.style.width = Math.min(100, i * 9) + "%"; if (msgs[Math.floor(i / 4)]) msg.textContent = msgs[Math.floor(i / 4)]; if (i >= 12) { clearInterval(t); setTimeout(done, 250); } }, 160);
  }
  $("#publishA").onclick = () => {
    if (S.A.copy.trim().length < 20) return fail(4);
    spend($("#publishA"), $("#approvalA"), () => { S.mA = simulate(S.A, "A"); S.B = null; S.mB = null; go(5); });
  };
  ENTER[5] = () => {
    if (!S.mA) return go(4);
    const shown = $("#resA").style.display === "block" && $("#resA").dataset.for === JSON.stringify(S.A);
    if (shown) return;
    $("#launch").style.display = "block"; $("#resA").style.display = "none";
    animateLaunch($("#launchBar"), $("#launchMsg"), ["Publicando en Instagram y Facebook…", "Entregando a la audiencia…", "Recogiendo métricas…"], () => {
      $("#launch").style.display = "none"; $("#resA").style.display = "block"; $("#resA").dataset.for = JSON.stringify(S.A); drawResultsA();
    });
  };
  function drawResultsA() {
    const b = brand(), m = S.mA, rel = RELEV[b.obj];
    const order = [...S.kpis, ...["alcance", "likes", "ctr", "conv", b.primary, "cpc", "seguidores", "impresiones"].filter(x => !S.kpis.includes(x))].filter((x, i, a) => a.indexOf(x) === i).slice(0, 8);
    $("#metsA").innerHTML = order.map(key => { const cls = rel.good.includes(key) ? "useful" : rel.bad.includes(key) ? "vanity" : "context";
      const lbl = cls === "useful" ? "Útil" : cls === "vanity" ? "Vanidad" : "Contexto";
      return `<div class="met ${cls}" style="${S.kpis.includes(key) ? "outline:3px solid var(--violet);outline-offset:-3px" : ""}"><em>${lbl}</em><span>${KPIS[key].n}</span><strong>${fmt(key, m)}</strong></div>`; }).join("");
    const max = m.impresiones;
    $("#funnelA").innerHTML = [["Impresiones", m.impresiones], ["Clics", m.clicks], [b.obj === "captacion" ? "Leads" : b.obj === "trafico" ? "Compras" : "Inscripciones", m.convs]]
      .map(([n, v]) => `<div><span>${n}</span><span class="t"><i style="width:${Math.max(2, Math.sqrt(v / max) * 100)}%"></i></span><span>${k(v)}</span></div>`).join("");
    const ctrOk = m.ctr >= 2.2, convOk = m.conv >= (b.obj === "trafico" ? 1.8 : 4);
    let diag, tip;
    if (ctrOk && !convOk) { diag = "Tu anuncio atrae clics, pero pocos terminan convirtiendo."; tip = "El problema probablemente está después del clic: el llamado a la acción, la oferta o la coherencia entre el anuncio y lo que la persona encuentra."; S.diag = "conv"; }
    else if (!ctrOk && convOk) { diag = "Quienes hacen clic convierten bien, pero muy pocas personas hacen clic."; tip = "El mensaje o el visual no están captando la atención. Prueba un mensaje que destaque un beneficio concreto o un visual más humano."; S.diag = "ctr"; }
    else if (!ctrOk && !convOk) { diag = "Tanto el CTR como la conversión están bajo lo esperado."; tip = "Antes de cambiar todo, prioriza el mensaje: es la variable que más afecta a ambos indicadores. Cambia una sola cosa a la vez."; S.diag = "both"; }
    else { diag = "Buen punto de partida: el anuncio atrae y convierte."; tip = "Ahora el desafío es optimizar el costo. Prueba una audiencia más precisa o un llamado a la acción más directo."; S.diag = "ok"; }
    const vain = S.kpis.filter(x => rel.bad.includes(x));
    $("#readA").innerHTML = `<p><b>${diag}</b> ${tip}</p><ul>
      <li>CTR ${pct(m.ctr)} · conversión ${pct(m.conv)} · ${KPIS[b.primary].n} ${fmt(b.primary, m)}.</li>
      <li>${Math.round(m.likes)} “me gusta” suenan bien, pero no dicen si se cumplió el objetivo: <b>${b.objective.toLowerCase()}</b>.</li>
      ${vain.length ? `<li>Elegiste ${vain.map(x => KPIS[x].n).join(" y ")} como KPI: aquí aparecen marcados como métricas de vanidad.</li>` : ""}</ul>`;
  }
  ENTER[6] = () => {
    const b = brand();
    const suggestion = { conv: "cta", ctr: "mensaje", both: "mensaje", ok: "audiencia" }[S.diag] || "mensaje";
    const draw = () => {
      const kpi = b.obj === "trafico" ? "el CTR" : b.obj === "captacion" ? "la tasa de conversión" : "la conversión";
      const what = { mensaje: "el mensaje y destaco <em>un beneficio concreto</em>", cta: "el llamado a la acción por <em>uno más directo</em>", visual: "el visual por <em>una persona usando el producto</em>", audiencia: "la audiencia por <em>una más precisa</em>" }[S.variable || suggestion];
      $("#hypTpl").innerHTML = `Si cambio ${what}, entonces aumentará ${kpi}${b.primary !== "cpc" ? " y bajará el " + KPIS[b.primary].n : ""}.`;
    };
    seg($("#variable"), VARS, S.variable, v => { S.variable = v; draw(); });
    $("#hypText").value = S.hyp;
    $("#sugg").innerHTML = `<b>Sugerencia de TESTEA:</b> según tus resultados, la variable con más potencial es <b>${VARS[suggestion]}</b>. Puedes elegir otra: lo importante es cambiar solo una.`;
    draw();
  };
  ENTER[7] = () => {
    if (!S.B || S.B._var !== S.variable) S.B = { ...S.A, _var: S.variable };
    $("#varLabel").textContent = VARS[S.variable];
    $$("#bForm [data-var]").forEach(l => { const on = l.dataset.var === S.variable; l.classList.toggle("locked", !on); l.querySelector(".lk").style.display = on ? "none" : "inline"; });
    const ta = $("#bCopy"); ta.value = S.B.copy; ta.disabled = S.variable !== "mensaje";
    const refresh = () => { $("#pvA").innerHTML = post(S.A); $("#pvB").innerHTML = post(S.B); };
    ta.oninput = () => { S.B.copy = ta.value; refresh(); };
    const dis = (key, opts) => S.variable === key ? (S.plan === "gratis" && key === "audiencia" ? ["similar"] : []) : Object.keys(opts);
    seg($("#bCta"), ctaOpts, S.B.cta, v => { S.B.cta = v; refresh(); }, dis("cta", ctaOpts));
    seg($("#bVisual"), VISUALS, S.B.visual, v => { S.B.visual = v; refresh(); }, dis("visual", VISUALS));
    seg($("#bAud"), AUDS, S.B.aud, v => { S.B.aud = v; refresh(); }, dis("audiencia", AUDS));
    $("#runAB").textContent = S.plan === "empresa" ? "Enviar test a aprobación · 1 crédito" : "Lanzar test A/B · 1 crédito";
    refresh();
  };
  $("#runAB").onclick = () => {
    const key = { mensaje: "copy", cta: "cta", visual: "visual", audiencia: "aud" }[S.variable];
    if (String(S.B[key]).trim() === String(S.A[key]).trim() || (key === "copy" && S.B.copy.trim().length < 20)) return fail(7);
    spend($("#runAB"), $("#approvalB"), () => { S.mB = simulate(S.B, "B"); S.mA2 = simulate(S.A, "A2"); S.saved = false; go(8); });
  };
  ENTER[8] = () => {
    if (!S.mB) return go(7);
    const sig = JSON.stringify(S.B);
    if ($("#resB").dataset.for === sig) return;
    $("#launchB").style.display = "block"; $("#resB").style.display = "none";
    animateLaunch($("#launchBarB"), $("#launchMsgB"), ["Repartiendo el presupuesto entre A y B…", "Midiendo ambas versiones…", "Comparando resultados…"], () => {
      $("#launchB").style.display = "none"; $("#resB").style.display = "block"; $("#resB").dataset.for = sig; drawCompare();
    });
  };
  function drawCompare() {
    const b = brand(), A = S.mA2, B = S.mB;
    const keys = ["ctr", "conv", b.primary];
    $("#cmp").innerHTML = keys.map(key => {
      const a = A[key], bb = B[key], mx = Math.max(a, bb) * 1.1, better = lowerIsBetter(key) ? bb < a : bb > a;
      const d = (bb - a) / a * 100;
      return `<div class="c"><span>${KPIS[key].n}</span>
        <div class="row"><i class="ta">A</i><span class="track"><b style="width:${a / mx * 100}%;background:var(--coral)"></b></span><span>${fmt(key, A)}</span></div>
        <div class="row"><i class="tb">B</i><span class="track"><b style="width:${bb / mx * 100}%;background:var(--mintd)"></b></span><span>${fmt(key, B)}</span></div>
        <span class="delta ${better ? "up" : "down"}">${d > 0 ? "+" : ""}${d.toFixed(0)}% ${better ? "mejor" : "peor"}</span></div>`;
    }).join("");
    const p = b.primary, dp = (B[p] - A[p]) / A[p] * 100 * (lowerIsBetter(p) ? -1 : 1);
    S.result = dp > 6 ? "win" : dp < -6 ? "lose" : "tie"; S.delta = dp;
    const what = VARS[S.variable].toLowerCase();
    const next = { mensaje: "cta", cta: "visual", visual: "audiencia", audiencia: "mensaje" }[S.variable];
    S.next = S.next || next;
    $("#verdict").className = "verdict " + S.result;
    $("#verdict").innerHTML = S.result === "win"
      ? `<span class="big">🎉</span><div><h4>Hipótesis respaldada</h4><p>Al cambiar ${what}, la versión B mejoró el ${KPIS[p].n} en ${Math.abs(dp).toFixed(0)}%. Como solo cambiaste una variable, puedes atribuirle esa mejora con más confianza. <b>Siguiente prueba sugerida:</b> mantener la B y probar ${VARS[next].toLowerCase()}.</p></div>`
      : S.result === "lose"
      ? `<span class="big">🔎</span><div><h4>Hipótesis no respaldada</h4><p>La versión B empeoró el ${KPIS[p].n} en ${Math.abs(dp).toFixed(0)}%. ¡También es aprendizaje! Ya sabes que ese cambio de ${what} no conecta con esta audiencia. <b>Siguiente prueba sugerida:</b> volver a la A y probar ${VARS[next].toLowerCase()}.</p></div>`
      : `<span class="big">⚖️</span><div><h4>Resultado no concluyente</h4><p>La diferencia en ${KPIS[p].n} (${dp.toFixed(0)}%) es demasiado pequeña para decidir con este presupuesto. Podrías repetir con más alcance o probar un cambio más marcado en ${what}.</p></div>`;
    drawTrivia();
  }
  const TRIVIA = {
    conv: { q: "Tu anuncio tiene buen CTR pero baja conversión. ¿Qué indica principalmente?", o: ["El anuncio no se está mostrando a suficientes personas", "Algo después del clic no cumple la expectativa (oferta, CTA o página)", "Hay que subir el presupuesto"], a: 1, e: "Exacto: si las personas hacen clic, el anuncio funciona. La fuga ocurre después: revisa la coherencia entre la promesa del anuncio y lo que encuentran." },
    ctr: { q: "Pocas personas hacen clic, pero quienes lo hacen convierten bien. ¿Qué probarías primero?", o: ["El mensaje o el visual del anuncio", "La página de destino", "Eliminar el llamado a la acción"], a: 0, e: "Correcto: el problema está antes del clic. El mensaje y el visual son los que captan (o no) la atención." },
    both: { q: "¿Por qué conviene cambiar una sola variable en un test A/B?", o: ["Porque Meta no permite cambiar más de una", "Para saber qué cambio causó la diferencia en el resultado", "Porque así se gasta menos presupuesto"], a: 1, e: "Así es: si cambias varias cosas a la vez, no sabrás cuál produjo la mejora o el empeoramiento." },
    ok: { q: "¿Cuál de estas es una métrica de vanidad para un objetivo de conversión?", o: ["CPA", "Tasa de conversión", "Cantidad de “me gusta”"], a: 2, e: "Correcto: los “me gusta” se ven bien, pero no indican si se cumplió el objetivo comercial." }
  };
  function drawTrivia() {
    const t = TRIVIA[S.diag] || TRIVIA.both;
    $("#trivia").innerHTML = `<h4>🧠 Trivia rápida · aprende de lo que acabas de vivir</h4><p style="font-weight:700;color:var(--ink);margin-bottom:12px">${t.q}</p>
      <div class="opts">${t.o.map((o, i) => `<button data-i="${i}">${o}</button>`).join("")}</div><div class="fb"></div>`;
    $("#trivia .opts").onclick = e => { const btn = e.target.closest("button"); if (!btn) return; const i = +btn.dataset.i;
      $$("#trivia .opts button").forEach((x, j) => { x.disabled = true; if (j === t.a) x.classList.add("ok"); else if (j === i) x.classList.add("no"); });
      const fb = $("#trivia .fb"); fb.classList.add("on"); fb.textContent = (i === t.a ? "✓ " : "No exactamente. ") + t.e; S.trivia = i === t.a; };
  }
  ENTER[9] = () => {
    const b = brand();
    const res = { win: "Hipótesis respaldada", lose: "Hipótesis no respaldada", tie: "No concluyente" }[S.result];
    $("#report").innerHTML = [["Marca", b.name], ["Variable probada", VARS[S.variable]], ["Hipótesis", S.hyp], ["Resultado", `${res} (${S.delta > 0 ? "+" : ""}${S.delta.toFixed(0)}% en ${KPIS[b.primary].n})`],
      ["KPI elegidos", S.kpis.map(x => KPIS[x].n).join(", ")], ["Saldo de la cuenta", `${S.credits} créditos disponibles`]].map(([t, d]) => `<div><dt>${t}</dt><dd>${esc(d)}</dd></div>`).join("");
    const opts = Object.fromEntries(Object.entries(VARS).filter(([k]) => k !== S.variable));
    seg($("#nextVar"), opts, S.next, v => S.next = v);
    $("#doneMsg").classList.toggle("on", S.saved);
  };
  $("#save").onclick = () => {
    if (S.saved) return;
    const b = brand();
    S.history.unshift({ brand: b.name, variable: VARS[S.variable], result: S.result, delta: Math.round(S.delta), kpi: KPIS[b.primary].n, next: VARS[S.next], date: new Date().toLocaleDateString("es-CL") });
    S.history = S.history.slice(0, 20); S.saved = true; persist(); drawHistory(); $("#doneMsg").classList.add("on");
  };
  $("#again").onclick = () => {
    Object.assign(S, { brand: null, own: {}, kpis: [], kpiChecked: false, A: null, B: null, mA: null, mB: null, variable: null, hyp: "", next: null, saved: false });
    $("#resA").dataset.for = ""; $("#resB").dataset.for = ""; S.maxStep = 2; go(2);
  };
  function drawHistory() {
    const icon = { win: "🎉", lose: "🔎", tie: "⚖️" };
    $("#histList").innerHTML = S.history.length ? S.history.map(h => `<li><b>${icon[h.result]} ${esc(h.brand)} · ${esc(h.variable)}</b>${h.delta > 0 ? "+" : ""}${h.delta}% en ${esc(h.kpi)} · próximo: ${esc(h.next)}<br><small style="color:var(--mute)">${h.date}</small></li>`).join("")
      : `<li class="empty">Aún no hay experimentos. Completa una prueba A/B y guarda tu primer aprendizaje.</li>`;
  }

  /* ---------- Inicio ---------- */
  const qp = new URLSearchParams(location.search).get("plan");
  if (qp && PLANS[qp] && S.plan !== qp) { S.plan = qp; S.credits = PLANS[qp].credits; persist(); }
  $("#creditN").textContent = S.credits;
  drawHistory();
  go(1);
})();
