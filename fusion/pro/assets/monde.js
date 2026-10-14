// L'accueil « un QR · tous les mondes » · 10/10/2026
// Les onglets des métiers · un seul métier à la fois. Sans ce script tous les
// métiers restent déroulés l'un sous l'autre et les onglets sont des ancres ·
// la page se lit pareil, en plus long.
(() => {
  const nav = document.querySelector("[data-onglets]");
  if (nav) {
    const liens = [...nav.querySelectorAll("[data-onglet]")];
    const panneaux = [...document.querySelectorAll("[data-panneau]")];
    const montrer = (id, { defiler = false } = {}) => {
      if (!panneaux.some((p) => p.dataset.panneau === id)) return;
      for (const p of panneaux) p.toggleAttribute("data-replie", p.dataset.panneau !== id);
      for (const a of liens) {
        const oui = a.dataset.onglet === id;
        if (oui) a.setAttribute("aria-current", "true");
        else a.removeAttribute("aria-current");
        if (oui) nav.scrollTo({ left: a.offsetLeft - nav.clientWidth / 2 + a.clientWidth / 2, behavior: "smooth" });
      }
      if (defiler) {
        const haut = nav.getBoundingClientRect().top;
        // On ne remonte que si l'onglet est sorti de l'écran · sinon on reste où on est.
        if (haut < 0 || haut > innerHeight * 0.6) nav.scrollIntoView({ block: "start" });
      }
    };
    for (const a of liens) {
      a.addEventListener("click", (e) => {
        e.preventDefault();
        montrer(a.dataset.onglet, { defiler: true });
        history.replaceState(null, "", `#m-${a.dataset.onglet}`);
      });
    }
    // Un lien qui arrive sur #m-hotel ouvre l'hôtel.
    const depuis = location.hash.match(/^#m-(.+)$/);
    if (depuis) montrer(depuis[1]);
    // Une étiquette du héros (Restos · Hôtels…) ouvre l'onglet de son métier.
    addEventListener("hashchange", () => { const m = location.hash.match(/^#m-(.+)$/); if (m) montrer(m[1]); });
  }
  // La démonstration · l'étape qu'on lit choisit l'écran du téléphone collé.
  // Sans ce script chaque étape garde son propre téléphone.
  const demo = document.querySelector("[data-demo]");
  if (demo) {
    const pas = [...demo.querySelectorAll("[data-pas]")];
    const ecrans = [...demo.querySelectorAll(".m-demo-collant [data-ecran]")];
    demo.setAttribute("data-demo-vivant", "");
    let actif = -1;
    const choisir = () => {
      // La ligne de lecture · sous le téléphone collé sur téléphone, au milieu sur ordinateur.
      const ligne = innerHeight * (innerWidth >= 900 ? 0.55 : 0.78);
      let n = 0;
      pas.forEach((li, i) => { if (li.getBoundingClientRect().top < ligne) n = i; });
      if (n === actif) return;
      actif = n;
      pas.forEach((li, i) => { li.toggleAttribute("data-actif", i === n); li.toggleAttribute("data-passe", i < n); });
      ecrans.forEach((e) => e.toggleAttribute("data-actif", +e.dataset.ecran === n));
      // L'écran suivant se charge avant qu'on y arrive.
      ecrans[n + 1]?.querySelector("img")?.setAttribute("loading", "eager");
    };
    let attente = false;
    addEventListener("scroll", () => { if (!attente) { attente = true; requestAnimationFrame(() => { attente = false; choisir(); }); } }, { passive: true });
    addEventListener("resize", choisir);
    choisir();
  }
  // Une vidéo que le mode économie d'énergie d'iOS refuse reste sur son image
  // fixe · le premier toucher sur la page la réveille.
  const videos = [...document.querySelectorAll(".m-video")];
  if (videos.length) {
    const reveiller = () => videos.forEach((v) => v.paused && v.play().catch(() => {}));
    addEventListener("touchstart", reveiller, { once: true, passive: true });
  }
})();
