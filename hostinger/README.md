# Version Hostinger (mutualisé) — statique + PHP

Le même sondage, sans Node ni build. À déployer sur ton hébergement mutualisé
Hostinger en quelques minutes. Les réponses arrivent dans la base Notion
**« 📥 Réponses sondage encadreurs »**.

## Fichiers
- `index.html` — le formulaire (HTML/CSS/JS, aucune dépendance)
- `submit.php` — reçoit le form et écrit dans Notion (token côté serveur)
- `notion-config.sample.php` — modèle de config (token + database id)
- `.htaccess` — bloque l'accès direct à `notion-config.php`

## Déploiement (5 min)

1. **Crée l'integration Notion**
   - https://www.notion.so/my-integrations → New integration (interne) → copie le secret.
   - Ouvre la base Notion → `•••` → **Connexions** → ajoute l'integration.
     ⚠️ Sans ça, l'API renvoie "object not found".

2. **Configure le token**
   - Copie `notion-config.sample.php` en `notion-config.php`, mets ton token.
   - **Recommandé** : place `notion-config.php` un niveau **au-dessus** de
     `public_html` (ex. `/home/uXXXXXXXX/notion-config.php`). `submit.php` le
     cherche automatiquement à `../notion-config.php`.
   - Sinon, laisse-le à côté de `submit.php` : le `.htaccess` en bloque l'accès.

3. **Upload**
   - Via hPanel → Gestionnaire de fichiers (ou FTP), dépose `index.html`,
     `submit.php` et `.htaccess` dans `public_html/` (ou un sous-dossier
     `public_html/sondage/`).

4. **Teste**
   - Ouvre ton URL (ex. `https://ton-domaine.fr/sondage/`), remplis, envoie.
   - Une ligne doit apparaître dans la base Notion. C'est l'URL à coller
     dans tes mails de prospection.

> Alternative env vars : si tu préfères, définis `NOTION_TOKEN` et
> `NOTION_DATABASE_ID` en variables d'environnement PHP — `submit.php` les
> lit en priorité avant le fichier de config.

> Les libellés d'options dans `index.html` doivent rester **identiques** aux
> options de la base Notion, sinon l'enregistrement échoue.
