<?php
// Renomme ce fichier en "notion-config.php" et place-le DE PRÉFÉRENCE
// un niveau au-dessus de public_html (ex. /home/uXXXXXXXX/notion-config.php),
// pour qu'il ne soit JAMAIS servi publiquement.
//
// Si tu le laisses à côté de submit.php, le .htaccess fourni en bloque l'accès.

return [
    // https://www.notion.so/my-integrations → Internal Integration Secret
    'NOTION_TOKEN'       => 'secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',

    // Base "📥 Réponses sondage encadreurs" (déjà créée).
    'NOTION_DATABASE_ID' => 'f096e056a9c6440e878915322eef8bd9',
];
