// LE RÉCIT · la démo au défilement de l'accueil · un vrai iPhone fixe, le lieu tourne autour de lui
// Porté depuis docs/mondes/latable/demo/ le 14/10 · toutes les classes et les identifiants portent le préfixe r-

// les traversées · { de: étape de départ (0 = 01), src } · le scroll les lit image par image
window.FILMS = [
  { de: 1, src: "/latable-demo/fusion/pro/assets/recit/film/t1.mp4" },
  { de: 2, src: "/latable-demo/fusion/pro/assets/recit/film/t2.mp4" },
  { de: 3, src: "/latable-demo/fusion/pro/assets/recit/film/t3.mp4" }
];


(function(){
  var N = 5, REPOS = .6;                              // une étape · repos de 0 à .6 · passage de .6 à 1
  var DECOR = [0,0,1,2,3];
  // un ou deux vrais écrans par étape · le second se pousse au milieu du repos
  var ECRAN = [[0],[1,3],[2],[2,3],[2]];   // 04 · le jeu s'efface devant le vrai ticket qui passe à « c'est prêt »
  // deux chapitres · le rail montre celui où l'on est
  var CHAP = [{ de: 0, noms: ["il scanne","il commande","la table joue","sa commande arrive","il laisse un avis"] }];
  // la lumière que chaque écran jette sur la scène
  var LUEUR = ["255,236,214","255,255,255","255,244,246","255,255,255","255,226,190"];
  window.FILMS = (window.FILMS || []).concat(window.FILMS_METIERS || []);
  var mq = matchMedia("(prefers-reduced-motion: reduce)"), calme = mq.matches;
  if (mq.addEventListener) mq.addEventListener("change", function(e){ calme = e.matches; });
  var econome = !!(navigator.connection && navigator.connection.saveData);
  var $ = function(i){ return document.getElementById(i); };
  var piste = $("r-piste"), scene = $("r-scene"), decor = $("r-decor"), tel = $("r-tel"), reflet = $("r-reflet"), feuille = $("r-feuille"), ombre = $("r-ombre"), ticketPret = $("r-pret");
  var imgs = [].slice.call(decor.querySelectorAll("img")), ecrans = [].slice.call(document.querySelectorAll("#r-ecrans .r-e"));
  var pas = [].slice.call(document.querySelectorAll(".r-pas")).map(function(el){ var l = [].slice.call(el.querySelectorAll(".r-l>span"));
    // chaque mot devient une pièce · le titre se monte derrière son cache, la phrase s'écrit
    var mots = function(boite, cls){ var t = boite.textContent.trim().split(/\s+/); boite.innerHTML = t.map(function(m){ return '<span class="' + cls + '">' + m + '</span>'; }).join(" "); return [].slice.call(boite.children); };
    var w = []; l.forEach(function(sp){ w = w.concat(mots(sp, "r-w")); });
    var pp = el.querySelector("p"), pw = pp ? mots(pp, "r-pw") : [];
    return { el: el, l: l, w: w, pw: pw, n: el.querySelector(".r-n"), p: el.querySelector("p") }; });
  var vifs = [].slice.call(document.querySelectorAll(".r-vif"));
  var boutons = [], ligne = $("r-ligne"), cpt = $("r-cpt"), sur = $("r-sur"), zonesBoite = $("r-zones");
  var fiches = vifs.map(function(el){ return el.querySelector("[data-2]"); });
  var racine = piste;   // la lueur ne vit que dans la piste · la page autour garde ses couleurs

  function ajuster(){
    [].slice.call(document.querySelectorAll(".r-pas h2, .r-o-txt h1")).forEach(function(t){
      t.style.fontSize = ""; var w = t.clientWidth, plus = 0;
      [].slice.call(t.children).forEach(function(l){ plus = Math.max(plus, l.scrollWidth); });
      if (plus > w) t.style.fontSize = (parseFloat(getComputedStyle(t).fontSize) * w / plus * .98) + "px";
    });
  }
  // SURPUISSANT tient toujours sur une ligne · il remplit la largeur sans la dépasser
  function ajusterFoudre(){ var f = document.getElementById("r-foudre"); if (!f) return; var m = f.firstElementChild;
    f.style.fontSize = ""; var w = f.clientWidth, l = m.scrollWidth; if (l > w * .98) f.style.fontSize = (parseFloat(getComputedStyle(f).fontSize) * w * .98 / l) + "px"; dispatchEvent(new Event("foudre")); }
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(ajusterFoudre); addEventListener("resize", ajusterFoudre);
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(ajuster); addEventListener("resize", ajuster);
  var et = $("r-etoiles"); for (var s = 0; s < 5; s++) et.insertAdjacentHTML("beforeend", '<svg viewBox="0 0 24 24"><path d="M12 2l3 6.3 6.9.9-5 4.8 1.2 6.9L12 17.6 5.9 20.9l1.2-6.9-5-4.800 6.900-.900z"/></svg>');
  var etoiles = [].slice.call(et.children);
  setTimeout(function(){ scene.removeAttribute("data-entree"); }, 1800);

  // les films · créés quand on approche, jamais tous à l'ouverture
  var films = {};
  function film(k){
    if (films[k] || calme || econome) return;
    var f = (window.FILMS || []).filter(function(x){ return x.de === k; })[0]; if (!f) return;
    var v = document.createElement("video"); v.muted = true; v.playsInline = true; v.preload = "auto"; v.tabIndex = -1; v.setAttribute("aria-hidden","true"); v.src = f.src;
    decor.appendChild(v); films[k] = v;
  }
  var pret = function(v){ return v && v.readyState >= 2 && v.duration > 0; };

  var lisse = function(a,b,x){ var t = Math.min(1, Math.max(0,(x-a)/(b-a))); return t*t*(3-2*t); };
  var max = 1, debut = 0, cible = 0, pos = 0, avant = 0;
  // la piste commence après l'ouverture · le scroll ne compte qu'à partir du moment où la scène se colle
  function lire(){ cible = Math.max(0, Math.min(1, (scrollY - debut) / max)); }
  function mesurer(){ debut = piste.getBoundingClientRect().top + scrollY - parseFloat(getComputedStyle(scene).top); max = Math.max(1, piste.offsetHeight - scene.offsetHeight); lire(); }
  addEventListener("scroll", lire, { passive:true }); addEventListener("resize", mesurer); mesurer();
  var aller = function(k, u){ scrollTo({ top: debut + ((k + u) / N) * max, behavior: calme ? "auto" : "smooth" }); };
  var chapVu = -1;
  function chapitre(c){
    chapVu = c; var ch = CHAP[c]; ligne.innerHTML = "";
    boutons = ch.noms.map(function(nom, k){
      var b = document.createElement("button"); b.type = "button"; b.setAttribute("aria-label", "Étape " + (k + 1) + ", " + nom);
      b.addEventListener("click", function(){ aller(ch.de + k, .25); }); ligne.appendChild(b); return b;
    });
    sur.textContent = "/ 0" + ch.noms.length;
  }
  chapitre(0);
  // le sommaire de l'ordinateur · les deux chapitres côte à côte, chaque ligne mène à son étape
  var sommaire = $("r-sommaire"), lignes = [];
  [["Votre client", 0]].forEach(function(t){
    var col = document.createElement("div"); col.innerHTML = "<h3>" + t[0] + "</h3>"; var ch = CHAP[t[1]];
    ch.noms.forEach(function(nom, k){ var b = document.createElement("button"); b.type = "button";
      b.innerHTML = "<b>0" + (k + 1) + "</b>" + nom.charAt(0).toUpperCase() + nom.slice(1);
      b.addEventListener("click", function(){ aller(ch.de + k, .25); }); col.appendChild(b); lignes[ch.de + k] = b; });
    sommaire.appendChild(col);
  });
  // la caméra · d'une étape à l'autre le téléphone avance, recule ou se décale, et le décor glisse
  // [échelle du téléphone, décalage en % de la largeur, glissement du décor en %]
  var CAM = [[1,0,0],[.9,6,-1.2],[1.05,-3,1.2],[.92,-4,-1],[1,0,1]];
  var telZone = document.querySelector(".r-tel-zone");
  // une page métier du site peut ouvrir la démo sur son chapitre · /pro/demo/#hotel
  // les anciens liens vers un métier · /pro/demo/#hotel · mènent maintenant à la scène des secteurs
  if (/^#(metiers|hotel|chauffeur|coworking|loisirs|mariage)$/.test(location.hash)) addEventListener("load", function(){ var c = $("r-secteurs"); if (c) c.scrollIntoView(); });
  // les jeux qui sortent du téléphone · [jeu, x, y, rotation] en % de la boîte du téléphone
  var OBJETS = {};   // les jeux vivent dans la carte de l'étape 03 · rien ne flotte sur les photos
  var boiteObj = $("r-objets"), objets = {};
  Object.keys(OBJETS).forEach(function(k){ objets[k] = OBJETS[k].map(function(o){
    var im = document.createElement("img"); im.src = "jeux/" + o[0] + ".webp"; im.alt = ""; im.loading = "lazy"; im.decoding = "async";
    im.style.left = o[1] + "%"; im.style.top = o[2] + "%"; boiteObj.appendChild(im); return { el: im, r: o[3] };
  }); });
  var metiers = [].slice.call(document.querySelectorAll("#r-metiers button"));
  metiers.forEach(function(b, k){ b.addEventListener("click", function(){ aller(6 + k, .25); }); });

  // plus de calage automatique au repos du doigt · sur iPhone il se battait avec l'élan du défilement
  // (le repos d'une étape couvre 60 % de sa course · on s'y arrête sans aide)
  addEventListener("touchend", function(){
    for (var k in films) (function(v){ if (!v._ok){ var p = v.play(); if (p) p.then(function(){ v.pause(); v._ok = 1; }).catch(function(){}); } })(films[k]);
  }, { passive:true });

  // la démo se joue · à l'étape 03 le visiteur vote sur le vrai écran et la table le compte
  var zones = [].slice.call(document.querySelectorAll(".r-zone-v")), vote = null, jVu = null;
  zones.forEach(function(z){ z.addEventListener("click", function(){ vote = z.dataset.c; zones.forEach(function(y){ y.toggleAttribute("data-pris", y === z); }); $("r-consigne").textContent = "Votre vote est compté"; }); });
  var eVu = -1, lVu = -1, mVu = null;
  function image(t){
    requestAnimationFrame(image);
    var dt = Math.min(64, (t - avant) || 16); avant = t;
    pos += (cible - pos) * (calme ? 1 : 1 - Math.exp(-dt / 95));      // amorti indépendant de la cadence
    if (Math.abs(cible - pos) < .00002) pos = cible;
    var x = pos * N, i = Math.min(N-1, Math.floor(x)), u = x - i, dernier = i === N-1;
    var suiv = Math.min(N-1, i+1), p = dernier ? 0 : lisse(REPOS, 1, u), bouge = DECOR[i] !== DECOR[suiv];
    film(i); film(i + 1);

    // le décor · image de repos, puis le film, puis l'image de repos suivante (qui est sa dernière image)
    var v = films[i], ok = bouge && pret(v);
    if (ok){ var d = v.duration, tt = Math.min(d - .05, lisse(REPOS + .02, .98, u) * d); if (Math.abs(v.currentTime - tt) > .012) { try { v.currentTime = tt; } catch(e){} } }
    var oFilm = ok ? lisse(REPOS, REPOS + .03, u) * (1 - lisse(.975, .995, u)) : 0;
    for (var k in films) films[k].style.opacity = (+k === i) ? oFilm : 0;
    imgs.forEach(function(im, k){
      var o = 0;
      if (k === DECOR[i]) o = bouge ? (ok ? 1 - lisse(REPOS + .03, REPOS + .05, u) : 1 - p) : 1;
      if (bouge && k === DECOR[suiv]) o = ok ? lisse(.97, .99, u) : p;
      im.style.opacity = o;
    });
    // le décor respire à peine au repos · jamais plus de 1,03 · il est revenu à 1 avant le raccord
    var souffle = Math.sin(Math.min(1, u / REPOS) * Math.PI);
    decor.style.transform = calme ? "none" : "translateX(" + (CAM[i][2] * souffle) + "%) scale(" + (1 + souffle * .025) + ")";
    if (!calme){
      var gros = innerWidth >= 900, ca = CAM[i], cb = CAM[suiv], sc = ca[0] + (cb[0] - ca[0]) * p, dx = ca[1] + (cb[1] - ca[1]) * p;
      if (!gros){ sc = 1 + Math.min(0, sc - 1) * .6; dx *= .4; }     // sur téléphone la caméra recule seulement · jamais sur le titre
      telZone.style.transform = "translateX(" + dx + "%) scale(" + sc + ")";
    }

    // l'écran · il se pousse vers le haut comme une vraie navigation, net à toutes les images
    var E = ECRAN[i], e1 = E[0], e2 = E[E.length - 1], eb = ECRAN[suiv][0];
    var pi = e1 === e2 ? 0 : lisse(.3, .42, u), pe = (dernier || e2 === eb) ? 0 : lisse(.72, .9, u);
    ecrans.forEach(function(im, k){
      var y = 101;
      if (pe > 0){ if (k === e2) y = -pe * 101; else if (k === eb) y = (1 - pe) * 101; }
      else if (e1 === e2) y = (k === e1) ? 0 : 101;
      else if (k === e1) y = -pi * 101; else if (k === e2) y = (1 - pi) * 101;
      im.style.transform = "translateY(" + y + "%)";
    });
    zonesBoite.style.opacity = i === 2 ? 1 - lisse(.72, .8, u) : 0;
    var e = (dernier ? 0 : lisse(.72, .9, u)) > .5 ? suiv : i;
    if (e !== lVu){ lVu = e; racine.style.setProperty("--lueur", LUEUR[e]); scene.toggleAttribute("data-clair", e === 10); }
    // la dernière étape · la carte d'avis monte dans l'écran comme une vraie feuille
    var fin = i === 4 ? lisse(.04, .22, u) : 0;   // la carte d'avis monte au début de 05 et reste jusqu'au bout
    ticketPret.style.opacity = i === 3 ? lisse(.43, .48, u) : 0;
    var buzz = (!calme && i === 3) ? Math.sin(t / 14) * 3.2 * lisse(.44, .46, u) * (1 - lisse(.54, .58, u)) : 0;
    feuille.style.transform = "translateY(" + ((1 - fin) * 120) + "%)"; ombre.style.opacity = fin * .2;

    // le téléphone · il garde sa place · il tourne à peine pendant un passage
    var onde = Math.sin(p * Math.PI), large = innerWidth >= 900;
    tel.style.transform = calme ? "none" : "translateX(" + buzz + "px) rotateY(" + ((large ? -7 : -10) + onde * 13) + "deg) rotateX(" + (2 - onde * 3) + "deg) translateY(" + (onde * -8) + "px)";
    reflet.style.setProperty("--rx", (-40 + (u < REPOS ? u / REPOS * 30 : 30 + p * 70)) + "%");

    // les textes · ils sortent avant le film · le suivant se compose mot par mot pendant que le film arrive et finit sur l'image de repos
    pas.forEach(function(q, k){
      var c = k === 0 ? 1 : Math.min(1, Math.max(0, (x - (k - .2)) / .35));
      var s = k === N - 1 ? 0 : lisse(k + .5, k + .62, x);
      var W = q.w.length, P = q.pw.length;
      q.w.forEach(function(m, j){ var a = j / W * .55; m.style.transform = "translateY(" + ((1 - lisse(a, a + .3, c)) * 135) + "%)"; });
      q.pw.forEach(function(m, j){ var a = .5 + j / P * .35; m.style.opacity = lisse(a, a + .15, c); });
      q.l.forEach(function(sp){ sp.style.transform = "translateY(" + (-135 * s) + "%)"; });
      q.n.style.opacity = lisse(0, .2, c) * (1 - s); if (q.p) q.p.style.opacity = 1 - s;
      q.el.setAttribute("aria-hidden", c * (1 - s) < .5);
    });

    // l'interface qui sort du téléphone · pilotée par le scroll
    var a = lisse(.1, .5, u);
    vifs.forEach(function(el, k){
      var o = (k === i) ? lisse(.14, .26, u) * (dernier ? 1 : 1 - lisse(.5, .64, u)) : 0;
      if (k === 0 && i === 0) o = 1 - lisse(.5, .64, u);
      el.style.opacity = o; el.style.transform = "translateY(" + ((1 - o) * 14) + "px)";
      if (fiches[k]){ var o2 = k === i ? lisse(.3, .42, u) : 0; fiches[k].style.opacity = o2; fiches[k].style.transform = "translateY(" + ((1 - o2) * 10) + "px)"; }
    });
    Object.keys(objets).forEach(function(k){ k = +k; objets[k].forEach(function(o, j){
      var v = k === i ? lisse(.1 + j * .035, .2 + j * .035, u) * (dernier ? 1 : 1 - lisse(.5, .6, u)) : 0;
      o.el.style.opacity = v;
      if (v > 0 || o.vu){ o.vu = v > 0; var flot = calme ? 0 : Math.sin(t / 900 + j * 1.7) * 4;
        o.el.style.transform = "translateY(" + ((1 - v) * 24 + flot) + "px) rotate(" + o.r + "deg) scale(" + (.6 + v * .4) + ")"; }
    }); });
    var choisit = i === 5 && u > .1 && u < REPOS;
    if (choisit !== mVu){ mVu = choisit; metiers.forEach(function(b){ b.style.pointerEvents = choisit ? "auto" : "none"; b.tabIndex = choisit ? 0 : -1; }); }
    if (i === 1){ $("r-cj").removeAttribute("data-on"); $("r-cc").setAttribute("data-on", ""); }
    var joue = i === 2 && u < REPOS;
    if (joue !== jVu){ jVu = joue; zones.forEach(function(z){ z.style.pointerEvents = joue ? "auto" : "none"; z.tabIndex = joue ? 0 : -1; }); }
    if (i === 2){ var vo = Math.round(a * 3) + (vote === "o"), vn = Math.round(a) + (vote === "n"); $("r-vo").style.setProperty("--v", vo / 5); $("r-vn").style.setProperty("--v", vn / 5); $("r-no").textContent = vo; $("r-nn").textContent = vn; }
    if (i === 3){ $("r-cloche").style.setProperty("--r", (calme ? 0 : Math.sin(a * Math.PI * 5) * 16 * (1 - a)) + "deg"); }
    if (i === 4){ var n = lisse(.12, .6, u) * 5; etoiles.forEach(function(sv, k){ sv.toggleAttribute("data-on", n >= k + .5); }); $("r-note").textContent = n.toFixed(1).replace(".", ","); }

    // le rail
    var c = 0, ch = CHAP[0];
    if (c !== chapVu){ chapitre(c); eVu = -1; }
    ligne.style.setProperty("--p", Math.max(0, Math.min(1, (pos * N - ch.de) / ch.noms.length)));
    if (e !== eVu){ lignes.forEach(function(b, k){ k === e ? b.setAttribute("aria-current", "step") : b.removeAttribute("aria-current"); }); }
    if (e !== eVu){ eVu = e; cpt.textContent = "0" + (e - ch.de + 1); boutons.forEach(function(b, k){ k === e - ch.de ? b.setAttribute("aria-current","step") : b.removeAttribute("aria-current"); }); }
  }
  requestAnimationFrame(image);
})();


// la scène des secteurs · les cartes montent quand on arrive · SURPUISSANT se charge au défilement puis grésille pour de bon
(function(){
  var sec = document.getElementById("r-secteurs"), mot = document.getElementById("r-foudre"); if (!sec || !mot) return;
  var calme = matchMedia("(prefers-reduced-motion: reduce)").matches;
  new IntersectionObserver(function(es, o){ es.forEach(function(e){ if (e.isIntersecting){ sec.setAttribute("data-vu", ""); o.disconnect(); } }); }, { threshold: .12 }).observe(sec);

  // le carrousel · la flèche avance d'une carte et disparaît au bout
  var rail = document.getElementById("r-sec-rail"), suiv = document.getElementById("r-sec-suiv");
  if (rail && suiv){
    suiv.addEventListener("click", function(){ var c = rail.querySelector(".r-secteur"); rail.scrollBy({ left: c.offsetWidth + 14, behavior: calme ? "auto" : "smooth" }); });
    var bout = function(){ suiv.toggleAttribute("data-fin", rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 8); };
    rail.addEventListener("scroll", bout, { passive: true }); bout();
  }

  var boite = mot.querySelector(".r-foudre-mot"), txt = boite.textContent;
  boite.innerHTML = txt.split("").map(function(c){ return '<span class="r-lt" aria-hidden="true">' + c + '</span>'; }).join("");
  var lettres = [].slice.call(boite.children), L = lettres.length;
  if (calme){ lettres.forEach(function(l){ l.setAttribute("data-on", ""); }); return; }

  var cv = mot.querySelector("canvas"), cx = cv.getContext("2d"), vu = false, charge = 0, plein = false, allumees = 0, dernier = 0, eclairs = [], centres = [];
  function taille(){ var r = cv.getBoundingClientRect(), d = Math.min(2, devicePixelRatio || 1); cv.width = r.width * d; cv.height = r.height * d; cx.setTransform(d, 0, 0, d, 0, 0);
    centres = lettres.map(function(l){ var b = l.getBoundingClientRect(); return { x: b.left - r.left + b.width / 2, g: b.left - r.left, d: b.right - r.left, h: b.top - r.top + b.height * .18, b: b.bottom - r.top - b.height * .12, m: b.top - r.top + b.height * .55 }; }); }
  addEventListener("resize", taille); addEventListener("foudre", taille);
  new IntersectionObserver(function(es){ vu = es[0].isIntersecting; if (vu){ taille(); requestAnimationFrame(tour); } }).observe(mot);

  // la charge suit le défilement · le mot entre en bas de l'écran éteint, il est plein quand il passe le premier tiers
  function lire(){ if (plein) return; var r = mot.getBoundingClientRect(), H = innerHeight;
    charge = Math.max(0, Math.min(1, (H * .92 - r.top) / (H * .55)));
    var n = Math.round(charge * L);
    if (n !== allumees){ lettres.forEach(function(l, k){ l.toggleAttribute("data-on", k < n); }); allumees = n; }
    if (charge >= 1){ plein = true; mot.setAttribute("data-plein", ""); flash(); } }
  addEventListener("scroll", lire, { passive: true }); lire();

  function flash(){ mot.setAttribute("data-flash", ""); setTimeout(function(){ mot.removeAttribute("data-flash"); }, 90); }
  // un éclair · ligne brisée par déplacement du milieu, plus ou moins nerveuse
  function arc(x1, y1, x2, y2, ecart, prof){
    var pts = [[x1, y1], [x2, y2]];
    for (var n = 0; n < (prof || 6); n++){ var nv = [pts[0]]; for (var k = 1; k < pts.length; k++){ var a = pts[k-1], b = pts[k];
      nv.push([(a[0]+b[0])/2 + (Math.random()-.5) * ecart * .35, (a[1]+b[1])/2 + (Math.random()-.5) * ecart]); nv.push(b); } pts = nv; ecart *= .55; }
    return pts;
  }
  function trace(pts, l, a){
    cx.beginPath(); cx.moveTo(pts[0][0], pts[0][1]); for (var k = 1; k < pts.length; k++) cx.lineTo(pts[k][0], pts[k][1]);
    cx.shadowBlur = 18; cx.strokeStyle = "rgba(255,45,111," + (a * .5) + ")"; cx.lineWidth = l * 6; cx.stroke();
    cx.shadowBlur = 8; cx.strokeStyle = "rgba(255,170,205," + (a * .8) + ")"; cx.lineWidth = l * 2.2; cx.stroke();
    cx.shadowBlur = 0; cx.strokeStyle = "rgba(255,255,255," + a + ")"; cx.lineWidth = l * .9; cx.stroke();
  }
  function etincelle(x, y, a){ var g = cx.createRadialGradient(x, y, 0, x, y, 26); g.addColorStop(0, "rgba(255,255,255," + a + ")"); g.addColorStop(.25, "rgba(255,120,170," + a * .7 + ")"); g.addColorStop(1, "rgba(255,45,111,0)"); cx.fillStyle = g; cx.beginPath(); cx.arc(x, y, 26, 0, 7); cx.fill(); }
  function tour(t){
    if (!vu) return; requestAnimationFrame(tour);
    var W = cv.clientWidth, H = cv.clientHeight; if (!centres.length) return;
    cx.clearRect(0, 0, W, H); cx.lineJoin = "round"; cx.shadowColor = "#ff2d6f";
    if (!plein){
      // pendant la charge · un arc court du début du mot jusqu'au front, et une étincelle au front
      if (allumees > 0){ var f = centres[allumees - 1], x0 = centres[0].g, y0 = centres[0].m;
        var fx = f.d + 4, fy = f.m + (Math.random() - .5) * f.m * .3;
        trace(arc(x0, y0, fx, fy, H * .35, 7), 1.3, .95);
        if (Math.random() < .6) trace(arc(x0, y0 + (Math.random() - .5) * 20, fx, fy, H * .5, 6), .7, .55);
        etincelle(fx, fy, .9);
        lettres.forEach(function(l, k){ l.toggleAttribute("data-vibre", k === allumees - 1 && Math.random() < .5); });
      }
      return;
    }
    // le mot est plein · il grésille pour de bon · des arcs sautent d'une lettre à l'autre, un grand éclair de temps en temps
    if (t - dernier > 90 + Math.random() * 160){ dernier = t;
      var a = Math.floor(Math.random() * L), b = Math.min(L - 1, a + 1 + Math.floor(Math.random() * 3)), haut = Math.random() < .5, A = centres[a], B = centres[b];
      eclairs.push({ p: arc(A.x, haut ? A.h : A.b, B.x, haut ? B.h : B.b, H * .25, 5), v: 1, l: .8 + Math.random() * .7 });
      if (Math.random() < .12){ eclairs.push({ p: arc(centres[0].g - 6, centres[0].m, centres[L-1].d + 6, centres[L-1].m, H * .6, 7), v: 1, l: 1.5 }); flash(); }
      var lv = lettres[Math.floor(Math.random() * L)]; lv.setAttribute("data-vibre", ""); setTimeout(function(){ lv.removeAttribute("data-vibre"); }, 80);
    }
    eclairs = eclairs.filter(function(e){ e.v -= .07; if (e.v <= 0) return false; trace(e.p, e.l, e.v * (Math.random() < .15 ? .35 : 1)); return true; });
  }
})();
