#!/usr/bin/env node
// Scrape des ateliers d'encadrement via Google Places API (Text Search New).
// Sortie : prospects.csv (importable dans la base Notion "🎯 Prospects encadreurs").
//
// Usage :
//   GOOGLE_MAPS_API_KEY=xxxx node scrape.mjs
//   GOOGLE_MAPS_API_KEY=xxxx node scrape.mjs --villes villes.txt   (1 ville par ligne)
//
// Pré-requis : activer "Places API (New)" sur https://console.cloud.google.com
// (facturation requise, mais quota gratuit mensuel large pour ce volume).

import { writeFileSync, readFileSync, existsSync } from "node:fs";

const API_KEY = process.env.GOOGLE_MAPS_API_KEY;
if (!API_KEY) {
  console.error("❌ Manque GOOGLE_MAPS_API_KEY dans l'environnement.");
  process.exit(1);
}

// Requêtes de recherche : variantes de métier × villes.
const TERMES = ["encadreur", "atelier d'encadrement", "encadrement sur mesure"];

// Villes par défaut : grandes villes FR + ta zone (Hauts-de-France).
// Remplace/complète via --villes villes.txt (1 ville par ligne).
const VILLES_DEFAUT = [
  "Paris", "Lyon", "Marseille", "Toulouse", "Bordeaux", "Lille", "Nantes",
  "Strasbourg", "Nice", "Rennes", "Montpellier", "Grenoble", "Rouen", "Reims",
  "Tours", "Dijon", "Angers", "Le Mans", "Clermont-Ferrand", "Caen", "Nancy",
  "Arras", "Lens", "Douai", "Valenciennes", "Dunkerque", "Amiens", "Béthune",
  "Cambrai", "Boulogne-sur-Mer", "Calais", "Saint-Quentin", "Compiègne",
  // francophonie (élargissement marché) :
  "Bruxelles", "Liège", "Genève", "Lausanne", "Montréal", "Québec",
];

const args = process.argv.slice(2);
let villes = VILLES_DEFAUT;
const vIdx = args.indexOf("--villes");
if (vIdx !== -1 && args[vIdx + 1] && existsSync(args[vIdx + 1])) {
  villes = readFileSync(args[vIdx + 1], "utf8")
    .split("\n").map((l) => l.trim()).filter(Boolean);
}

const FIELD_MASK = [
  "places.displayName",
  "places.formattedAddress",
  "places.nationalPhoneNumber",
  "places.websiteUri",
  "places.rating",
  "places.userRatingCount",
  "places.googleMapsUri",
  "nextPageToken",
].join(",");

const seen = new Map(); // clé = nom+adresse → dédup
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function searchText(query, pageToken) {
  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": API_KEY,
      "X-Goog-FieldMask": FIELD_MASK,
    },
    body: JSON.stringify({
      textQuery: query,
      languageCode: "fr",
      regionCode: "FR",
      ...(pageToken ? { pageToken } : {}),
    }),
  });
  if (!res.ok) {
    console.error(`  ⚠️  ${res.status} sur "${query}" : ${await res.text()}`);
    return { places: [] };
  }
  return res.json();
}

function ville(adresse) {
  // "12 rue X, 59000 Lille, France" → "Lille"
  const m = adresse?.match(/\b\d{4,5}\s+([^,]+)/);
  return m ? m[1].trim() : "";
}

function pays(adresse) {
  if (/Belgi|België/i.test(adresse)) return "🇧🇪 Belgique";
  if (/Suisse|Switzerland/i.test(adresse)) return "🇨🇭 Suisse";
  if (/Canada|Québec/i.test(adresse)) return "🇨🇦 Canada";
  return "🇫🇷 France";
}

function csvCell(v) {
  const s = (v ?? "").toString();
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

const run = async () => {
  for (const v of villes) {
    for (const t of TERMES) {
      const query = `${t} ${v}`;
      let token = undefined;
      let page = 0;
      do {
        const data = await searchText(query, token);
        for (const p of data.places ?? []) {
          const nom = p.displayName?.text ?? "";
          const adr = p.formattedAddress ?? "";
          const key = (nom + "|" + adr).toLowerCase();
          if (!nom || seen.has(key)) continue;
          seen.set(key, {
            atelier: nom,
            ville: ville(adr) || v,
            pays: pays(adr),
            telephone: p.nationalPhoneNumber ?? "",
            site: p.websiteUri ?? "",
            note: p.rating ? `${p.rating}★ (${p.userRatingCount ?? 0})` : "",
            adresse: adr,
            maps: p.googleMapsUri ?? "",
          });
        }
        token = data.nextPageToken;
        page++;
        if (token) await sleep(2000); // le token met ~1-2s à devenir valide
      } while (token && page < 3); // max 3 pages (60 résultats) / requête
      process.stdout.write(`  ${query} → total unique : ${seen.size}\r`);
      await sleep(200);
    }
  }

  const rows = [...seen.values()];
  const header = [
    "Atelier", "Ville", "Pays", "Téléphone", "Site web", "Note Google",
    "Adresse", "Google Maps", "Statut",
  ];
  const csv = [
    header.join(","),
    ...rows.map((r) =>
      [
        r.atelier, r.ville, r.pays, r.telephone, r.site, r.note,
        r.adresse, r.maps, "🔵 À contacter",
      ].map(csvCell).join(",")
    ),
  ].join("\n");

  writeFileSync("prospects.csv", csv, "utf8");
  console.log(`\n✅ ${rows.length} ateliers uniques → prospects.csv`);
  const sansSite = rows.filter((r) => !r.site).length;
  console.log(`   ${rows.length - sansSite} avec site web, ${sansSite} sans.`);
};

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
