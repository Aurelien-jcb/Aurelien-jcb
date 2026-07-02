#!/usr/bin/env node
// Scrape des ateliers d'encadrement via OpenStreetMap (API Overpass).
// 100% GRATUIT — aucune clé, aucune carte bancaire.
// Sortie : prospects-osm.csv (importable dans la base Notion "🎯 Prospects encadreurs").
//
// Usage :
//   node scrape-osm.mjs                 # France entière (défaut)
//   node scrape-osm.mjs FR BE CH        # plusieurs pays (codes ISO)
//
// Node 18+ requis (fetch natif). Aucune dépendance npm.
//
// Tags OSM ciblés :
//   shop=frame            (boutique d'encadrement)
//   craft=picture_framer  (artisan encadreur)

import { writeFileSync } from "node:fs";

const pays = process.argv.slice(2).length ? process.argv.slice(2) : ["FR"];
// Plusieurs miroirs Overpass : on essaie le suivant si l'un refuse/surcharge.
const ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
];

// Bounding-box (S, W, N, E) par pays : bien plus léger que la résolution
// d'une "area" nationale → évite les timeouts 504 côté Overpass.
const BBOX = {
  FR: [41.3, -5.2, 51.1, 9.6],   // France métropolitaine
  BE: [49.5, 2.5, 51.5, 6.4],
  CH: [45.8, 5.9, 47.8, 10.5],
  LU: [49.4, 5.7, 50.2, 6.5],
  CA: [45.0, -79.8, 53.0, -57.0], // Québec (francophone)
};

function requete(codePays) {
  const bb = BBOX[codePays];
  const zone = bb ? `(${bb.join(",")})` : "";
  return `
    [out:json][timeout:120];
    (
      nwr["shop"="frame"]${zone};
      nwr["craft"="picture_framer"]${zone};
    );
    out center tags;
  `;
}

const PAYS_LABEL = {
  FR: "🇫🇷 France", BE: "🇧🇪 Belgique", CH: "🇨🇭 Suisse",
  CA: "🇨🇦 Canada", LU: "🇱🇺 Luxembourg",
};

function csvCell(v) {
  const s = (v ?? "").toString();
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function pourPays(codePays) {
  const body = "data=" + encodeURIComponent(requete(codePays));
  let json = null;

  // 2 passes sur les miroirs : les 504 d'Overpass sont souvent passagers.
  for (let pass = 1; pass <= 2 && !json; pass++) {
    for (const endpoint of ENDPOINTS) {
      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Accept": "application/json",
            // Overpass exige un User-Agent identifiable, sinon il renvoie 406.
            "User-Agent": "atelier-encadrement-prospects/1.0 (script perso)",
          },
          body,
        });
        if (!res.ok) {
          console.error(`  ⚠️  ${endpoint} → ${res.status}, miroir suivant…`);
          continue;
        }
        json = await res.json();
        break;
      } catch (e) {
        console.error(`  ⚠️  ${endpoint} injoignable (${e.message}), miroir suivant…`);
      }
    }
    if (!json && pass === 1) {
      console.error("  ⏳ Tous les miroirs occupés, nouvelle tentative dans 8 s…");
      await sleep(8000);
    }
  }

  if (!json) {
    console.error(`  ❌ Aucun miroir Overpass n'a répondu pour ${codePays} (réessaie dans quelques minutes).`);
    return [];
  }

  return (json.elements ?? []).map((el) => {
    const t = el.tags ?? {};
    const ville = t["addr:city"] || t["addr:town"] || t["addr:village"] || "";
    const adresse = [
      t["addr:housenumber"], t["addr:street"], t["addr:postcode"], ville,
    ].filter(Boolean).join(" ");
    const lat = el.lat ?? el.center?.lat;
    const lon = el.lon ?? el.center?.lon;
    return {
      atelier: t.name || "(sans nom)",
      ville,
      pays: PAYS_LABEL[codePays] || codePays,
      telephone: t.phone || t["contact:phone"] || "",
      site: t.website || t["contact:website"] || "",
      email: t.email || t["contact:email"] || "",
      adresse,
      maps: lat && lon ? `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=18/${lat}/${lon}` : "",
    };
  });
}

const run = async () => {
  const seen = new Map();
  for (const p of pays) {
    process.stdout.write(`  Interrogation OSM pour ${p}…\n`);
    const rows = await pourPays(p);
    for (const r of rows) {
      const key = (r.atelier + "|" + r.adresse).toLowerCase();
      if (!seen.has(key)) seen.set(key, r);
    }
  }

  const rows = [...seen.values()];
  // Colonnes alignées EXACTEMENT sur la base Notion "🎯 Prospects encadreurs".
  // Le site web + l'adresse (utiles pour trouver l'email) vont dans "Notes".
  const header = ["Atelier", "Ville", "Pays", "Téléphone", "Email", "Statut", "Notes"];
  const csv = [
    header.join(","),
    ...rows.map((r) => {
      const notes = [
        r.site ? "Site : " + r.site : "",
        r.adresse ? "Adr. : " + r.adresse : "",
      ].filter(Boolean).join(" — ");
      return [r.atelier, r.ville, r.pays, r.telephone, r.email, "🔵 À contacter", notes]
        .map(csvCell).join(",");
    }),
  ].join("\n");

  writeFileSync("prospects-osm.csv", csv, "utf8");
  const avecSite = rows.filter((r) => r.site).length;
  const avecMail = rows.filter((r) => r.email).length;
  console.log(`\n✅ ${rows.length} ateliers → prospects-osm.csv`);
  console.log(`   ${avecSite} avec site web, ${avecMail} avec email, ` +
    `${rows.filter((r) => r.telephone).length} avec téléphone.`);
};

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
