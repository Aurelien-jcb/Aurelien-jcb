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

    // --- Alerte à chaque réponse (OPTIONNEL) ---
    // Remplis SOIT WhatsApp, SOIT Telegram (ou les deux). Laisse vide = pas d'alerte.

    // WhatsApp via CallMeBot (gratuit) :
    //  1. Ajoute +34 644 51 95 23 à tes contacts.
    //  2. Envoie-lui "I allow callmebot to send me messages" sur WhatsApp.
    //  3. Tu reçois ta clé API → colle-la ci-dessous.
    'WHATSAPP_PHONE'     => '', // ton numéro international sans +, ex : 33612345678
    'WHATSAPP_APIKEY'    => '',

    // Telegram (gratuit, plus fiable) :
    //  1. @BotFather → /newbot → récupère le token.
    //  2. Écris un message à ton bot, puis ouvre
    //     https://api.telegram.org/bot<TOKEN>/getUpdates → repère "chat":{"id":...}
    'TELEGRAM_BOT_TOKEN' => '',
    'TELEGRAM_CHAT_ID'   => '',
];
