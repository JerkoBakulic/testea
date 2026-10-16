// TESTEA — comportamiento común: menú móvil, cabecera y animaciones de entrada
(function () {
  const burger = document.getElementById("burger");
  if (burger) burger.addEventListener("click", () => document.body.classList.toggle("open"));
  document.querySelectorAll("#mmenu a").forEach(a => a.addEventListener("click", () => document.body.classList.remove("open")));
  const nav = document.getElementById("nav");
  if (nav) { const f = () => nav.classList.toggle("solid", scrollY > 20); addEventListener("scroll", f, { passive: true }); f(); }
  const els = document.querySelectorAll(".rv");
  if (!("IntersectionObserver" in window)) { els.forEach(e => e.classList.add("in")); return; }
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: .12 });
  els.forEach((el, i) => { el.style.transitionDelay = (i % 4) * 70 + "ms"; io.observe(el); });
})();
