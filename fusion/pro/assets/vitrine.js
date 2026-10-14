/* LA VITRINE LATABLE · le comportement · 04/10/2026
   Règle qui commande tout · la page est COMPLÈTE sans ce fichier. Rien n'est
   caché par défaut dans le HTML ou le CSS · ce script n'ajoute que des
   trajets (GSAP, hébergé dans /latable-demo/fusion/pro/assets/lib) et de petits états. Si GSAP ne
   charge pas, le calculateur, la séquence et le formulaire marchent quand
   même · seuls les trajets disparaissent. */
(() => {
  const html = document.documentElement;
  html.classList.remove("sans-js");
  html.classList.add("avec-js");

  /* 05/10 · LA LANGUE ET LA DEVISE SE LISENT SUR LA PAGE · `lang` dit comment
     écrire un nombre, `data-devise` (posé seulement là où le symbole fait
     partie du nombre · « $39 ») dit lequel. En France le « € HT » vit dans la
     phrase et le nombre s'écrit nu, avec deux décimales (« 29,99 »). Ce que
     ce fichier écrit vient de la page (`data-libelles`, posé par
     construire.mjs depuis le fichier de contenu du marché) · seul le bouton
     « Copier » des articles garde ses mots ici, le blog n'existe qu'en français. */
  const locale = html.lang || "fr-FR";
  const devise = html.dataset.devise || null;
  const chiffres = (n, { arrondi = false } = {}) => {
    const v = arrondi ? Math.round(n) : n;
    const entier = Number.isInteger(v);
    return v.toLocaleString(locale, devise
      ? { style: "currency", currency: devise, minimumFractionDigits: entier ? 0 : 2, maximumFractionDigits: 2 }
      // 07/10 · un entier s'écrit sans centimes, comme montant() d'offre.js ·
      // « 59 » et « 149 » (la grille du pivot), jamais « 59,00 ».
      : { minimumFractionDigits: entier ? 0 : 2, maximumFractionDigits: 2 });
  };
  const libelles = (el) => { try { return JSON.parse(el?.dataset.libelles || "null"); } catch { return null; } };
  const remplir = (modele, valeurs) => String(modele).replace(/\{(\w+)\}/g, (m, k) => (k in valeurs ? valeurs[k] : m));

  const reduit = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const souris = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const lire = (cle) => { try { return localStorage.getItem(cle); } catch { return null; } };
  const ecrire = (cle, v) => { try { localStorage.setItem(cle, v); } catch { /* navigation privée */ } };

  /* ── L'en-tête marque son bord une fois la page défilée ─────────────── */
  const tete = document.querySelector(".tete");
  const surDefile = () => tete && tete.classList.toggle("est-defile", scrollY > 8);
  addEventListener("scroll", surDefile, { passive: true });
  surDefile();

  /* Le menu mobile se referme quand on suit un de ses liens (ancres). */
  document.querySelectorAll(".menu-panneau a, .sous-menu-liste a").forEach((a) =>
    a.addEventListener("click", () => a.closest("details")?.removeAttribute("open")),
  );
  document.addEventListener("click", (e) => {
    document.querySelectorAll(".sous-menu[open]").forEach((d) => { if (!d.contains(e.target)) d.removeAttribute("open"); });
  });

  /* ── La barre basse · après le héros, jamais par-dessus le formulaire ─ */
  const barre = document.querySelector(".barre-basse");
  const heros = document.querySelector(".heros");
  const contact = document.querySelector("#contact");
  if (barre && heros && "IntersectionObserver" in window) {
    let horsHeros = false;
    let surContact = false;
    const maj = () => barre.classList.toggle("est-visible", horsHeros && !surContact);
    new IntersectionObserver(([e]) => { horsHeros = !e.isIntersecting; maj(); }).observe(heros);
    if (contact) new IntersectionObserver(([e]) => { surContact = e.isIntersecting; maj(); }, { rootMargin: "0px 0px -20% 0px" }).observe(contact);
  }

  /* ── L'écran scindé (08/10) · une moitié touchée couvre l'écran, puis on
        va sur sa page ──────────────────────────────────────────────────────
        08/10 au soir · la page s'ouvrait dans un cadre en superposition, sous
        une barre « COMMANDER · Fermer ». Rayan · « très mal fait » · deux
        en-têtes empilés (la barre au-dessus de la vraie nav du site), une page
        entière coincée dans un iframe. La moitié s'étend toujours sur tout
        l'écran (le geste reste), puis on NAVIGUE · une vraie page, une seule
        nav, et le retour du navigateur ramène à l'accueil. Un clic du milieu,
        Cmd ou Ctrl ouvrent un onglet comme n'importe quel lien. */
  const scindeEl = document.querySelector("[data-scinde]");
  if (scindeEl && "HTMLDialogElement" in window) {
    let volet = null;
    const ouvrir = (a) => {
      if (!volet) {
        volet = document.createElement("dialog");
        volet.className = "volet";
        volet.innerHTML = '<div class="volet-surface"></div>';
        volet.addEventListener("cancel", (e) => e.preventDefault());
        document.body.appendChild(volet);
      }
      if (volet.open) return;
      const r = a.getBoundingClientRect();
      const surface = volet.querySelector(".volet-surface");
      const fond = a.querySelector(".moitie-fond");
      surface.style.backgroundImage = fond ? `url("${fond.currentSrc || fond.src}")` : "";
      volet.style.setProperty("--h", `${Math.max(0, r.top)}px`);
      volet.style.setProperty("--g", `${Math.max(0, r.left)}px`);
      volet.style.setProperty("--d", `${Math.max(0, innerWidth - r.right)}px`);
      volet.style.setProperty("--b", `${Math.max(0, innerHeight - r.bottom)}px`);
      volet.classList.remove("est-plein");
      volet.showModal();
      if (reduit) { location.assign(a.href); return; }
      surface.getBoundingClientRect();
      requestAnimationFrame(() => volet.classList.add("est-plein"));
      setTimeout(() => location.assign(a.href), 480);
    };
    // Le retour du navigateur peut rendre l'accueil depuis le cache · le volet
    // y serait encore ouvert, plein écran, sans rien dessous.
    addEventListener("pageshow", () => { if (volet && volet.open) { volet.close(); volet.classList.remove("est-plein"); } });
    scindeEl.querySelectorAll("a.moitie").forEach((a) => a.addEventListener("click", (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      ouvrir(a);
    }));
  }

  /* ── Les vidéos jouent quand on les voit, se taisent sinon ──────────── */
  const videos = [...document.querySelectorAll("video[data-auto]")];
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entrees) => {
      for (const e of entrees) {
        const v = e.target;
        if (e.isIntersecting) {
          if (v.preload !== "auto") v.preload = "auto";
          if (!reduit) v.play().catch(() => {});
        } else v.pause();
      }
    }, { rootMargin: "200px 0px" });
    videos.forEach((v) => io.observe(v));
  }

  /* ── Le héros animé · l'image fixe d'abord, la boucle par-dessus ────────
        Sans JS, en mouvement réduit ou en mode économie d'énergie iOS (qui
        refuse la lecture), l'image fixe reste et se comprend seule. La boucle
        ne se charge que si on la voit · 16:9 sur ordinateur, 4:5 en dessous. */
  /* 05/10 · une SUITE de boucles (data-suite · b,t,h) · deux <video> qui se
     relaient en fondu · la suivante ne se charge qu'une fois la première
     lancée, pour ne rien voler au premier affichage. Une seule boucle · elle
     tourne en `loop` comme avant. L'étiquette (figcaption) dit le lieu. */
  document.querySelectorAll("[data-motion]").forEach((m) => {
    const vids = [...m.querySelectorAll("video")];
    if (!vids.length || reduit || !("IntersectionObserver" in window)) return;
    const ids = (m.dataset.suite || "").split(",").filter(Boolean);
    const lieux = (m.dataset.lieux || "").split("|");
    const etiquette = m.querySelector(".motion-lieu");
    const bureau = matchMedia("(min-width: 900px)");
    const url = (id) => `${m.dataset.base}heros-${id}-${bureau.matches ? "169" : "45"}.mp4`;
    const seule = ids.length < 2 || vids.length < 2;
    let i = 0, vue = false, actif = vids[0], attente = vids[1] || null;
    const charge = (v, id) => { const u = url(id); if (v.dataset.src !== u) { v.dataset.src = u; v.src = u; } };
    actif.loop = seule;
    actif.classList.add("est-actif");
    const prepare = () => { if (!seule) charge(attente, ids[(i + 1) % ids.length]); };
    const lance = () => {
      charge(actif, ids[i]);
      if (vue) actif.play().catch(() => {});
    };
    vids.forEach((v) => {
      // ⚠️ la suivante se charge APRÈS le fondu (.45 s) · changer la source du
      // lecteur sortant pendant qu'il s'efface ferait voir l'image fixe dessous.
      v.addEventListener("playing", () => { m.classList.add("est-anime"); if (v === actif) setTimeout(() => { if (v === actif) prepare(); }, 700); });
      v.addEventListener("ended", () => {
        if (seule || v !== actif) return;
        i = (i + 1) % ids.length;
        [actif, attente] = [attente, actif];
        charge(actif, ids[i]);
        actif.currentTime = 0;
        actif.play().catch(() => {});
        actif.classList.add("est-actif");
        attente.classList.remove("est-actif");
        if (etiquette && lieux[i]) etiquette.textContent = lieux[i];
      });
    });
    if (bureau.addEventListener) bureau.addEventListener("change", () => { charge(actif, ids[i]); prepare(); if (vue) actif.play().catch(() => {}); });
    new IntersectionObserver(([e]) => { vue = e.isIntersecting; if (vue) lance(); else actif.pause(); }).observe(m);
  });

  /* ── Le logo du pied · joué UNE fois quand on arrive en bas, puis posé ──
        Sans JS ou en mouvement réduit, le poster montre le logo final. Avec
        JS on retire le poster pour partir de la bulle vide, sans flash. */
  document.querySelectorAll("video[data-une-fois]").forEach((v) => {
    if (reduit || !("IntersectionObserver" in window)) return;
    v.removeAttribute("poster");
    const charge = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      charge.disconnect();
      v.preload = "auto";
      v.load();
    }, { rootMargin: "600px 0px" });
    const joue = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      joue.disconnect();
      v.play().catch(() => {});
    }, { threshold: 0.7 });
    charge.observe(v);
    joue.observe(v);
  });

  /* ── La séquence en quatre temps · l'écran suit le texte lu ─────────── */
  document.querySelectorAll("[data-sequence]").forEach((seq) => {
    const pas = [...seq.querySelectorAll(".seq-pas")];
    const ecrans = [...seq.querySelectorAll(".seq-ecrans > *")];
    const frise = [...seq.querySelectorAll(".seq-frise span")];
    const activer = (i) => {
      pas.forEach((p, k) => p.classList.toggle("est-actif", k === i));
      ecrans.forEach((p, k) => p.classList.toggle("est-actif", k === i));
      frise.forEach((p, k) => p.classList.toggle("est-actif", k === i));
    };
    activer(0);
    if (!("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver((entrees) => {
      for (const e of entrees) if (e.isIntersecting) activer(pas.indexOf(e.target));
    }, { rootMargin: "-48% 0px -48% 0px" });
    pas.forEach((p) => io.observe(p));
  });

  /* ── Le grand prix compte de 0 à sa valeur · une fois, à l'écran ────────
     Le HTML porte la valeur finale · on ne fait que l'amener. La boîte est
     figée à la largeur finale avant de compter (rien ne bouge autour), le
     nombre garde l'écriture de la page à chaque image (« 12,34 » en France,
     « $12 » aux États-Unis · un dollar rond compte en dollars ronds).
     Mouvement réduit · rien ne bouge. */
  const compteurs = [...document.querySelectorAll("[data-compteur]")];
  if (compteurs.length && !reduit && "IntersectionObserver" in window) {
    const fr = (n, cible) => chiffres(n, { arrondi: Boolean(devise) && Number.isInteger(cible) });
    const compter = (el) => {
      // La valeur finale du HTML, gardée AVANT la mise à zéro (relire le
      // texte ici rendait « 0,00 » · le banc l'a vu, pas l'œil).
      const final = el.dataset.final;
      const cible = Number(el.dataset.compteur);
      const t0 = performance.now();
      const duree = 1200;
      const pas = (t) => {
        const k = Math.min(1, (t - t0) / duree);
        const e = 1 - Math.pow(1 - k, 3);
        el.textContent = k < 1 ? fr(cible * e, cible) : final;
        if (k < 1) requestAnimationFrame(pas);
      };
      requestAnimationFrame(pas);
    };
    const io = new IntersectionObserver((entrees) => {
      for (const e of entrees) {
        if (!e.isIntersecting) continue;
        io.unobserve(e.target);
        compter(e.target);
      }
    }, { threshold: 0.4 });
    // La largeur se mesure en Anton, pas dans la police de secours.
    const poser = () => compteurs.forEach((el) => {
      // La largeur finale, réservée · posée AVANT le premier chiffre.
      el.dataset.final = el.textContent;
      el.style.width = `${Math.ceil(el.getBoundingClientRect().width)}px`;
      el.classList.add("compte");
      // Sous la ligne de flottaison, il attend à 0 · au-dessus, il compte tout de suite.
      if (el.getBoundingClientRect().top > innerHeight) el.textContent = fr(0, Number(el.dataset.compteur));
      io.observe(el);
    });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(poser);
    else poser();
  }

  /* ── Le calculateur · tout le prix vient des attributs posés par le
        générateur, qui les lit dans src/lib/offre.js ────────────────── */
  const euros = (n) => chiffres(n);
  const tween = (el, cible) => {
    const depart = Number(el.dataset.valeur || cible);
    el.dataset.valeur = cible;
    if (reduit || depart === cible) { el.textContent = euros(cible); return; }
    const t0 = performance.now();
    const duree = 520;
    const pas = (t) => {
      const k = Math.min(1, (t - t0) / duree);
      const e = 1 - Math.pow(2, -10 * k);
      el.textContent = euros(depart + (cible - depart) * (k === 1 ? 1 : e));
      if (k < 1) requestAnimationFrame(pas);
    };
    requestAnimationFrame(pas);
  };
  document.querySelectorAll("[data-calcul]").forEach((c) => {
    let mensuel = Number(c.dataset.mensuel);
    const qr = Number(c.dataset.qr);
    let installation = Number(c.dataset.installation);
    // 07/10 · un seuil vide veut dire « jamais offerte » (la mise en place
    // avec la carte) · Infinity garde la comparaison d'en dessous juste.
    let seuil = c.dataset.seuil === "" ? Infinity : Number(c.dataset.seuil);
    // 07/10 · les formules (France) · chacune son mensuel, sa mise en place,
    // son seuil · lus dans l'attribut que le générateur tire d'offre.js.
    let formules = null;
    try { formules = c.dataset.formules ? JSON.parse(c.dataset.formules) : null; } catch (e) { formules = null; }
    const min = 1;
    const max = 120;
    const champ = c.querySelector("[data-tables]");
    const curseur = c.querySelector("[data-curseur]");
    const sortie = (nom) => c.querySelector(`[data-sortie="${nom}"]`);
    const installationOfferte = sortie("installation-offerte");
    const installationMontant = sortie("installation-montant");
    const reste = sortie("reste-seuil");
    const mots = libelles(c);
    const calculer = (n) => {
      n = Math.max(min, Math.min(max, Math.round(Number(n) || min)));
      champ.value = n;
      if (curseur) curseur.value = Math.min(Number(curseur.max), n);
      const centimesQr = Math.round(n * qr * 100);
      const centimesInst = n >= seuil ? 0 : Math.round(installation * 100);
      const premier = (Math.round(mensuel * 100) + centimesQr + centimesInst) / 100;
      tween(sortie("qr"), centimesQr / 100);
      tween(sortie("premier"), premier);
      sortie("qr-nombre").textContent = n;
      const offerte = n >= seuil;
      installationOfferte.hidden = !offerte;
      installationMontant.hidden = offerte;
      if (reste && mots) {
        reste.textContent = seuil === Infinity && mots.sansSeuil ? mots.sansSeuil : offerte ? mots.offerte : remplir(mots.seuil, { seuil });
      }
      if (formules) {
        tween(sortie("mensuel"), mensuel);
        tween(sortie("installation"), installation);
        const ensuite = sortie("ensuite");
        if (ensuite) ensuite.textContent = euros(mensuel) + " € HT";
      }
      ecrire("lv-tables", String(n));
      document.querySelectorAll("[data-form-tables]").forEach((i) => (i.value = n));
    };
    champ.addEventListener("input", () => calculer(champ.value));
    champ.addEventListener("change", () => calculer(champ.value));
    curseur?.addEventListener("input", () => calculer(curseur.value));
    c.querySelector("[data-moins]")?.addEventListener("click", () => calculer(Number(champ.value) - 1));
    c.querySelector("[data-plus]")?.addEventListener("click", () => calculer(Number(champ.value) + 1));
    if (formules) {
      c.querySelectorAll("[data-formule]").forEach((r) => {
        r.addEventListener("change", () => {
          const f = formules[r.value];
          if (!r.checked || !f) return;
          mensuel = Number(f.mensuel);
          installation = Number(f.installation);
          seuil = f.seuil == null ? Infinity : Number(f.seuil);
          calculer(champ.value);
        });
      });
      // Un retour arrière peut rendre une autre case cochée que celle du HTML.
      c.querySelector("[data-formule]:checked")?.dispatchEvent(new Event("change"));
    }
    const memo = Number(lire("lv-tables"));
    if (memo >= min && memo <= max) calculer(memo);
  });

  /* ── Le formulaire · il ouvre la messagerie avec le message prêt, au
        format que relève scripts/prospection/lead.mjs ─────────────────── */
  document.querySelectorAll("[data-formulaire]").forEach((f) => {
    const tables = f.querySelector("[data-form-tables]");
    if (tables && !tables.value) tables.value = lire("lv-tables") || "";
    f.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!f.reportValidity()) return;
      const v = (n) => (f.elements[n]?.value || "").trim();
      // Les libellés du message viennent de la page · en France ils sont relus
      // par scripts/prospection/lead.mjs, ils ne se retouchent pas sans lui.
      const mots = libelles(f) || { objet: "{etablissement}", lignes: ["{etablissement}", "{telephone}", "{email}", "{page}"], momentLibre: "" };
      const valeurs = {
        etablissement: v("etablissement"), type: v("type"), tables: v("tables"), telephone: v("telephone"),
        email: v("email"), moment: v("moment") || mots.momentLibre, page: location.pathname,
      };
      const corps = mots.lignes.map((l) => remplir(l, valeurs)).join("\r\n");
      const objet = remplir(mots.objet, valeurs);
      const lien = `mailto:${f.dataset.formulaire}?subject=${encodeURIComponent(objet)}&body=${encodeURIComponent(corps)}`;
      f.dataset.dernier = lien; // relu par scripts/vitrine/verifier.mjs
      location.href = lien;
      const ok = f.querySelector("[data-envoye]");
      if (ok) ok.hidden = false;
    });
  });

  /* Le sommaire d'un article · ouvert sur bureau, replié sur téléphone (il
     est ouvert dans le HTML pour rester lisible sans JS). */
  if (innerWidth < 1080) document.querySelectorAll(".article-sommaire details[open]").forEach((d) => d.removeAttribute("open"));

  /* ── Les modèles à copier des articles ─────────────────────────────── */
  document.querySelectorAll("[data-copier]").forEach((b) => b.addEventListener("click", async () => {
    const texte = b.closest(".modele")?.querySelector("textarea")?.value || "";
    try { await navigator.clipboard.writeText(texte); b.textContent = "Copié"; } catch { b.textContent = "Sélectionnez le texte"; }
    setTimeout(() => (b.textContent = "Copier"), 2200);
  }));

  /* ── Le mouvement · seulement si GSAP est là et que personne n'a demandé
        moins de mouvement. Quatre moments, pas plus · les titres, les
        images qui s'ouvrent, les téléphones en deux couches, les noms des
        jeux. Rien n'est caché qui soit déjà visible au chargement. ─── */
  const mouvement = () => {
    const { gsap, ScrollTrigger } = window;
    if (!gsap || !ScrollTrigger || reduit) return;
    gsap.registerPlugin(ScrollTrigger);
    // Une fiche de formule qui s'ouvre ou se ferme range ou rend des sections
    // entières · les déclencheurs doivent recompter leurs positions.
    addEventListener("hashchange", () => requestAnimationFrame(() => ScrollTrigger.refresh()));

    /* Le défilement lissé · pour une SOURIS seulement. Sur un écran tactile
       le doigt a déjà son inertie native · Lenis n'y est même pas chargé. */
    const lisser = () => {
      if (!window.Lenis) return;
      const lenis = new window.Lenis({ lerp: 0.14, wheelMultiplier: 1 });
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
      // 08/10 · `data-vue` · une ancre qui CHANGE DE VUE (les fiches des
      // formules, tarifs) · elle doit poser le hash pour que `:target`
      // bascule. Lenis la laisse au navigateur.
      document.querySelectorAll('a[href^="#"]:not([data-vue])').forEach((a) =>
        a.addEventListener("click", (e) => {
          const cible = document.querySelector(a.getAttribute("href"));
          if (!cible) return;
          e.preventDefault();
          lenis.scrollTo(cible, { offset: -80 });
        }),
      );
    };
    const srcLenis = document.querySelector("script[data-lenis]")?.dataset.lenis;
    if (souris && srcLenis) {
      const sc = document.createElement("script");
      sc.src = srcLenis;
      sc.onload = lisser;
      document.head.appendChild(sc);
    }

    const sousLaLigne = (el) => el.getBoundingClientRect().top > innerHeight * 0.92;

    /* Les titres · découpés en lignes réelles, chaque ligne monte de son
       propre masque. Le HTML d'origine est rendu à la fin · un titre ne
       reste jamais découpé quand la fenêtre change de taille. */
    const decouper = (h) => {
      const origine = h.innerHTML;
      const mots = [];
      h.childNodes.forEach((n) => {
        const accent = n.nodeType === 1 && n.tagName === "EM";
        const texte = n.textContent;
        if (n.nodeType === 1 && n.tagName === "BR") { mots.push({ br: true }); return; }
        texte.split(/[ \t\n\r]+/).filter(Boolean).forEach((m) => mots.push({ m, accent }));
      });
      h.innerHTML = mots.map((x) => (x.br ? "<br>" : `<span class="mot">${x.accent ? `<em>${x.m}</em>` : x.m}</span>`)).join(" ");
      const lignes = [];
      let haut = null;
      h.querySelectorAll(".mot").forEach((s) => {
        if (s.offsetTop !== haut) { lignes.push([]); haut = s.offsetTop; }
        lignes[lignes.length - 1].push(s.innerHTML);
      });
      h.innerHTML = lignes.map((l) => `<span class="ligne"><span>${l.join(" ")}</span></span>`).join("");
      return origine;
    };
    /* SplitText (GSAP 3.15) découpe en lignes RÉELLES et pose un masque par
       ligne · `revert()` rend le HTML d'origine à la fin. Sans lui, le
       découpage maison d'avant prend le relais. */
    const ST = window.SplitText;
    if (ST) gsap.registerPlugin(ST);
    document.querySelectorAll("[data-revele]").forEach((h) => {
      if (!sousLaLigne(h)) return;
      if (ST) {
        const decoupe = ST.create(h, { type: "lines", mask: "lines", linesClass: "ligne-st" });
        gsap.from(decoupe.lines, {
          yPercent: 108, duration: 1.05, ease: "expo.out", stagger: 0.09,
          scrollTrigger: { trigger: h, start: "top 88%", once: true },
          onComplete: () => decoupe.revert(),
        });
        return;
      }
      const origine = decouper(h);
      gsap.from(h.querySelectorAll(".ligne > span"), {
        yPercent: 108, duration: 1.05, ease: "expo.out", stagger: 0.09,
        scrollTrigger: { trigger: h, start: "top 88%", once: true },
        onComplete: () => { h.innerHTML = origine; },
      });
    });

    /* Les images s'ouvrent · un rideau qui se lève, une fois. */
    document.querySelectorAll("[data-ouvre]").forEach((el) => {
      if (!sousLaLigne(el)) return;
      gsap.fromTo(el,
        { clipPath: "inset(14% 10% 14% 10% round 28px)" },
        { clipPath: "inset(0% 0% 0% 0% round 22px)", duration: 1.3, ease: "expo.out", clearProps: "clipPath",
          scrollTrigger: { trigger: el, start: "top 86%", once: true } });
      const img = el.querySelector("img, video");
      if (img) gsap.fromTo(img, { scale: 1.12 }, { scale: 1, duration: 1.6, ease: "expo.out", clearProps: "transform", scrollTrigger: { trigger: el, start: "top 86%", once: true } });
    });

    /* Les téléphones en deux couches · l'avant va plus vite que l'arrière. */
    document.querySelectorAll("[data-parallaxe]").forEach((el) => {
      const v = Number(el.dataset.parallaxe) || 0;
      gsap.fromTo(el, { y: v * 0.5 }, {
        y: -v, ease: "none",
        scrollTrigger: { trigger: el.closest("section") || el, start: "top bottom", end: "bottom top", scrub: 0.6 },
      });
    });

    /* La carte qui défile DANS le téléphone, au rythme de la page. */
    document.querySelectorAll(".ecran--long").forEach((ecran) => {
      const img = ecran.querySelector("img");
      const course = () => Math.max(0, img.offsetHeight - ecran.offsetHeight) * 0.55;
      gsap.to(img, {
        y: () => -course(), ease: "none",
        scrollTrigger: { trigger: ecran.closest("section"), start: "top top", end: "bottom top", scrub: 0.8, invalidateOnRefresh: true },
      });
    });

    /* Les noms des jeux glissent en sens contraires. */
    document.querySelectorAll(".noms-rang").forEach((r, i) => {
      const sens = i % 2 ? 1 : -1;
      gsap.fromTo(r, { xPercent: sens > 0 ? -18 : 0 }, {
        xPercent: sens > 0 ? 0 : -18, ease: "none",
        scrollTrigger: { trigger: r.parentElement, start: "top bottom", end: "bottom top", scrub: 0.5 },
      });
    });

    addEventListener("load", () => ScrollTrigger.refresh());
  };

  if (document.fonts && document.fonts.ready) document.fonts.ready.then(mouvement);
  else mouvement();
})();

/* ── Le rail des formules (tarifs) · 08/10 ────────────────────────────────
   Sur téléphone · la phare est ouverte d'office (au centre du rail), les
   pastilles sautent d'un panneau à l'autre et disent lequel est à l'écran.
   Sans JS le rail se fait quand même au doigt · il s'ouvre simplement sur le
   premier panneau. Sur ordinateur le rail n'est pas défilant · rien à faire. */
(() => {
  const rail = document.querySelector("[data-rail]");
  if (!rail) return;
  const onglets = [...document.querySelectorAll("[data-panneau]")];
  const panneau = (id) => document.getElementById(`p-${id}`);
  const defile = () => rail.scrollWidth > rail.clientWidth + 4;
  const viser = (el, comment) => rail.scrollTo({ left: el.offsetLeft - (rail.clientWidth - el.offsetWidth) / 2, behavior: comment });
  const marquer = () => {
    if (!defile()) return;
    const centre = rail.scrollLeft + rail.clientWidth / 2;
    let proche = null, ecart = Infinity;
    for (const o of onglets) {
      const p = panneau(o.dataset.panneau);
      const d = Math.abs(p.offsetLeft + p.offsetWidth / 2 - centre);
      if (d < ecart) { ecart = d; proche = o; }
    }
    for (const o of onglets) o.setAttribute("aria-current", String(o === proche));
  };
  const phare = panneau(rail.dataset.phare);
  if (phare && defile()) viser(phare, "instant");
  let file = 0;
  rail.addEventListener("scroll", () => { cancelAnimationFrame(file); file = requestAnimationFrame(marquer); }, { passive: true });
  const reduit = matchMedia("(prefers-reduced-motion: reduce)").matches;
  for (const o of onglets) {
    o.addEventListener("click", (e) => {
      if (!defile()) return;
      e.preventDefault();
      viser(panneau(o.dataset.panneau), reduit ? "instant" : "smooth");
    });
  }
})();
