/* LA VITRINE · LA DEMANDE DE RAPPEL PART EN BASE · 04/10/2026

   Le formulaire « Demander une démo » ouvrait un mailto. Dans le navigateur
   intégré d'Instagram (d'où vient le patron démarché en DM) aucune messagerie
   ne s'ouvre, et la demande se perd sans que personne le sache. Ce fichier
   l'envoie à `latable_vitrine_demande` (migration 20261004120000) et montre
   « C'est noté · on vous rappelle ». Si l'appel échoue (réseau, plafond,
   migration absente), il rend la main à vitrine.js, qui ouvre le mailto comme
   avant · une demande n'est jamais perdue.

   ── LES 3 LIGNES À AJOUTER À CHAQUE PAGE DE LA VITRINE ──────────────────
   1 · dans le <head>, sous la ligne de vitrine.js (l'ordre n'importe pas) ·
         <script defer src="/latable-demo/fusion/pro/assets/demande.js"></script>
   2 · dans le <head>, pour gagner l'aller retour TLS au premier envoi ·
         <link rel="preconnect" href="https://sjuabpikziehmtillkrt.supabase.co" crossorigin>
   3 · facultatif · dans le <form>, avant le bouton, si on veut savoir QUAND
       rappeler (le serveur l'accepte, le briefing l'affiche) ·
         <div class="champ"><label for="f-moment">Quand vous rappeler</label><select id="f-moment" name="moment"><option value="">Quand vous voulez</option><option>Le matin</option><option>Entre midi et deux</option><option>L'après midi</option><option>Après le service du soir</option></select></div>

   Rien d'autre · le champ piège, la mention « Pour vous rappeler · jamais de
   pub » et l'écran « C'est noté » sont posés par ce fichier. Sans JavaScript
   la page reste celle d'aujourd'hui (le mailto), et la note « le bouton ouvre
   votre messagerie » y reste vraie · ce fichier ne la masque que quand il
   prend le relais.

   🔴 AVANT DE BRANCHER · `scripts/vitrine/verifier.mjs` remplit le formulaire
   de l'accueil (« Chez Témoin ») et clique « Demander une démo ». Avec ce
   fichier chargé, ce clic ÉCRIRAIT UNE DEMANDE EN PRODUCTION et ne poserait
   plus `data-dernier`. Le vérificateur doit d'abord couper l'appel ·
     await page.route("**\/rest/v1/rpc/latable_vitrine_demande", (r) => r.abort());
   C'est d'ailleurs la bonne épreuve · elle prouve que le repli mailto marche.

   Comment il passe devant vitrine.js sans le modifier · il écoute `submit` en
   CAPTURE sur le document, donc avant tout écouteur posé sur le formulaire,
   et arrête l'événement. Pour le repli il marque le formulaire et le soumet
   de nouveau · cette fois il le laisse passer, et vitrine.js fait le reste. */
(() => {
  const API = "https://sjuabpikziehmtillkrt.supabase.co";
  // La clé PUBLIABLE · la même que les cartes des lieux (public/carte/*). Elle
  // n'ouvre que ce que les fonctions autorisent, la table n'est pas lisible.
  const CLE = "sb_publishable_v1-HPRSWRUPVSKgA-pixfw_bj4q3Gvk";
  const DELAI = 8000; // au-delà, le wifi du patron ne répondra pas · repli
  const PIEGE = "site_web";

  const formulaires = () => document.querySelectorAll("form[data-formulaire]");
  /* 05/10 · LES MOTS VIENNENT DE LA PAGE · le formulaire porte ses libellés
     (`data-libelles`, posés par construire.mjs depuis le fichier de contenu de
     son marché · français sur /pro/, anglais sur /us/). Un formulaire sans
     libellés n'est pas pris en charge · vitrine.js garde la main, le mailto
     part comme avant, et aucune phrase d'une autre langue ne s'affiche. */
  const mots = (f) => { try { return JSON.parse(f.dataset.libelles || "null"); } catch { return null; } };
  const lien = (href, texte, externe) => {
    const a = document.createElement("a");
    a.href = href;
    a.textContent = texte;
    if (externe) { a.target = "_blank"; a.rel = "noopener"; }
    return a;
  };

  /* Le champ piège · hors de l'écran, hors du clavier, hors des lecteurs
     d'écran. Un humain ne le remplit jamais, un robot remplit tout. */
  const poserPiege = (f, M) => {
    if (f.elements[PIEGE]) return;
    const boite = document.createElement("div");
    boite.setAttribute("aria-hidden", "true");
    boite.style.cssText = "position:absolute;left:-10000px;top:auto;width:1px;height:1px;overflow:hidden";
    const etiquette = document.createElement("label");
    etiquette.textContent = M.piege;
    etiquette.insertAdjacentHTML("beforeend", `<input type="text" name="${PIEGE}" tabindex="-1" autocomplete="off">`);
    boite.appendChild(etiquette);
    f.appendChild(boite);
  };

  /* La mention sous le bouton · elle remplace la note du mailto, qui
     deviendrait fausse. */
  const poserMention = (f, M) => {
    if (f.querySelector("[data-demande-mention]")) return;
    f.querySelectorAll(".note:not([data-envoye])").forEach((n) => { n.hidden = true; n.dataset.demandeMasquee = ""; });
    const p = document.createElement("p");
    p.className = "note";
    p.dataset.demandeMention = "";
    p.append(`${M.mention} · `, lien(M.confidentialiteLien, M.confidentialite));
    const bouton = f.querySelector("button[type=submit]");
    (bouton ? bouton.after(p) : f.appendChild(p));
  };

  const valeur = (f, n) => (f.elements[n]?.value || "").trim();

  const montrerNote = (f) => {
    f.querySelectorAll("[data-demande-masquee]").forEach((n) => { n.hidden = false; delete n.dataset.demandeMasquee; });
    f.querySelector("[data-demande-mention]")?.remove();
  };

  /* L'écran « C'est noté » · les champs s'effacent, la phrase prend leur place. */
  const ecranOk = (f, M) => {
    // `hidden` ne suffit pas · la feuille de la vitrine pose `display: grid`
    // sur `.champ`, et une règle d'auteur bat l'attribut. Le style en ligne tranche.
    [...f.children].forEach((c) => { if (!c.matches("[data-demande-ok]")) { c.hidden = true; c.style.display = "none"; } });
    const ok = document.createElement("div");
    ok.dataset.demandeOk = "";
    ok.setAttribute("role", "status");
    ok.tabIndex = -1;
    ok.style.cssText = "display:grid;gap:12px;text-align:center;padding:12px 0";
    const titre = document.createElement("p");
    titre.className = "h3";
    titre.style.margin = "0";
    titre.textContent = M.ok;
    const question = document.createElement("p");
    question.className = "note";
    question.append(`${M.question} · `, lien(M.whatsapp, "WhatsApp", true));
    ok.append(titre, question);
    f.appendChild(ok);
    ok.focus({ preventScroll: true });
    ok.scrollIntoView({ block: "center", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  };

  /* Rendre la main à vitrine.js · il ouvre le mailto et pose `data-dernier`. */
  const repli = (f) => {
    montrerNote(f);
    f.dataset.demandeRepli = "1";
    if (typeof f.requestSubmit === "function") f.requestSubmit();
    else f.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  };

  const envoyer = async (f) => {
    const tables = Number(valeur(f, "tables"));
    const corps = {
      p_etablissement: valeur(f, "etablissement"),
      p_type: valeur(f, "type") || null,
      p_telephone: valeur(f, "telephone") || null,
      p_email: valeur(f, "email") || null,
      p_page: location.pathname.slice(0, 200),
      p_moment: valeur(f, "moment") || null,
      p_tables: Number.isInteger(tables) && tables >= 1 && tables <= 500 ? tables : null,
      p_user_agent: navigator.userAgent.slice(0, 160),
      p_piege: valeur(f, PIEGE) || null,
    };
    const arret = new AbortController();
    const minuterie = setTimeout(() => arret.abort(), DELAI);
    try {
      const r = await fetch(`${API}/rest/v1/rpc/latable_vitrine_demande`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: CLE, Authorization: `Bearer ${CLE}` },
        body: JSON.stringify(corps),
        signal: arret.signal,
      });
      const j = await r.json().catch(() => null);
      return r.ok && j && j.ok === true;
    } catch {
      return false;
    } finally {
      clearTimeout(minuterie);
    }
  };

  document.addEventListener("submit", async (e) => {
    const f = e.target;
    if (!(f instanceof HTMLFormElement) || !f.matches("[data-formulaire]")) return;
    // Le repli · on laisse passer, vitrine.js ouvre la messagerie.
    if (f.dataset.demandeRepli === "1") { delete f.dataset.demandeRepli; return; }
    const M = mots(f);
    if (!M) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    if (f.dataset.demandeEnCours === "1") return;
    if (!f.reportValidity()) return;
    const bouton = f.querySelector("button[type=submit]");
    const libelle = bouton?.textContent;
    f.dataset.demandeEnCours = "1";
    if (bouton) { bouton.disabled = true; bouton.textContent = M.envoi; }
    const ok = await envoyer(f);
    delete f.dataset.demandeEnCours;
    if (bouton) { bouton.disabled = false; bouton.textContent = libelle; }
    if (ok) ecranOk(f, M);
    else repli(f);
  }, true);

  const preparer = () => formulaires().forEach((f) => {
    const M = mots(f);
    if (!M) return;
    poserPiege(f, M);
    poserMention(f, M);
  });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", preparer);
  else preparer();
})();
