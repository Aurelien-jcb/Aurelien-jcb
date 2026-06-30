# Scraper prospects encadreurs (Google Places)

Construit une liste d'ateliers d'encadrement (nom, ville, téléphone, site,
note Google) → `prospects.csv`, importable dans la base Notion
**« 🎯 Prospects encadreurs »**.

## 1. Clé API Google
1. https://console.cloud.google.com → crée un projet.
2. Active **Places API (New)**.
3. Crée une clé API (Identifiants).
   - Facturation à activer, mais le quota gratuit mensuel couvre largement
     ce volume (~150-200 lieux = quelques € max, souvent 0).

## 2. Lancer
```bash
cd tools/prospects
GOOGLE_MAPS_API_KEY=ta_cle node scrape.mjs
# ou avec ta propre liste de villes (1 par ligne) :
GOOGLE_MAPS_API_KEY=ta_cle node scrape.mjs --villes villes.txt
```
Node 18+ requis (fetch natif). Aucune dépendance npm.

## 3. Résultat
`prospects.csv` avec colonnes : Atelier, Ville, Pays, Téléphone, Site web,
Note Google, Adresse, Google Maps, Statut (= "🔵 À contacter").

## 4. Import dans Notion
- Base « 🎯 Prospects encadreurs » → `•••` → **Merge with CSV** (ou nouvelle
  base via import). Mappe les colonnes (Atelier→titre, etc.).
- Les **emails ne sont pas fournis par Google** : ouvre les sites web listés
  pour récupérer les adresses de contact (étape rapide, ou 2e script si tu veux).

## Réglages
- `TERMES` et `VILLES_DEFAUT` en haut de `scrape.mjs` : ajuste la couverture.
- Le script dédoublonne sur nom+adresse et limite à 60 résultats/requête.
