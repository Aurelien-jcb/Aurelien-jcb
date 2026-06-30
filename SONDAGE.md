# Sondage encadreurs — validation terrain

Formulaire de validation pour le **SaaS Encadrement**. Remplace Typeform :
form custom Next.js → les réponses tombent directement dans la base Notion
**« 📥 Réponses sondage encadreurs »** (aucune limite de plan, tu possèdes la data).

Sert aussi de mini landing/waitlist réutilisable.

> ⚠️ Ce repo est ton **repo de profil GitHub**. Ne merge pas cette branche
> dans `main` (ça remplacerait ton README de profil). Pour la prod, copie ce
> dossier dans un repo dédié (ex. `sondage-encadreurs`) avant de déployer.

## Stack
- Next.js 14 (App Router, TypeScript)
- API Notion appelée en `fetch` (zéro dépendance SDK)
- CSS maison (pas de build Tailwind à gérer pour une page)

## Mise en route (5 min)

### 1. Créer l'integration Notion
1. https://www.notion.so/my-integrations → **New integration** (interne).
2. Copie l'**Internal Integration Secret** (`secret_…` ou `ntn_…`).
3. Ouvre la base **« 📥 Réponses sondage encadreurs »** dans Notion →
   menu `•••` → **Connexions** → ajoute ton integration.
   ⚠️ Sans cette étape, l'API renverra "object not found".

### 2. Variables d'environnement
```bash
cp .env.example .env.local
# puis renseigne NOTION_TOKEN ; NOTION_DATABASE_ID est déjà pré-rempli.
```

### 3. Lancer
```bash
npm install
npm run dev      # http://localhost:3000
```

## Déploiement (Vercel, gratuit)
1. Copie ce dossier dans un repo dédié, importe-le sur Vercel.
2. Ajoute `NOTION_TOKEN` et `NOTION_DATABASE_ID` dans
   **Settings → Environment Variables**.
3. Deploy → tu obtiens l'URL à coller dans tes mails de prospection.

## Mapping form ↔ Notion
| Champ form | Propriété Notion | Type |
|---|---|---|
| atelier | Atelier / Ville | titre |
| q1 | Q1 Notation commande | select |
| q1_logiciel | Q1 Logiciel — lequel/manque | texte |
| q2_calcul | Q2 Calcul devis | select |
| q2_hesitation | Q2 Hésitation client | select |
| q3_retrouver | Q3 Retrouver historique | select |
| q3_temps | Q3 Temps recherche | select |
| q4_galeres | Q4 Galères | multi-select |
| q5_prix | Q5 Prix /mois | select |
| email | Email | email |
| optin | Tenez-moi informé | checkbox |

> Les libellés d'options dans `app/page.tsx` doivent rester **identiques**
> aux options de la base Notion, sinon l'enregistrement échoue.
