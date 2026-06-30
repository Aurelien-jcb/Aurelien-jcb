<?php
// Endpoint de réception du sondage encadreurs → écrit dans Notion.
// Hébergement mutualisé Hostinger (PHP). Aucun build, aucun Node.

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Méthode non autorisée']);
    exit;
}

// --- Config ---
// notion-config.php peut être :
//   1. dans le MÊME dossier que ce fichier (protégé par le .htaccess fourni), OU
//   2. un niveau au-dessus (idéal : hors de public_html).
// Les variables d'environnement PHP, si définies, ont la priorité.
$token = getenv('NOTION_TOKEN') ?: '';
$databaseId = getenv('NOTION_DATABASE_ID') ?: '';

foreach ([__DIR__ . '/notion-config.php', __DIR__ . '/../notion-config.php'] as $configPath) {
    if ((!$token || !$databaseId) && file_exists($configPath)) {
        $cfg = require $configPath;
        if (!$token) {
            $token = $cfg['NOTION_TOKEN'] ?? '';
        }
        if (!$databaseId) {
            $databaseId = $cfg['NOTION_DATABASE_ID'] ?? '';
        }
    }
}
if (!$databaseId) {
    $databaseId = 'f096e056a9c6440e878915322eef8bd9';
}
if (!$token) {
    http_response_code(500);
    echo json_encode(['error' => 'Config manquante : NOTION_TOKEN']);
    exit;
}

// --- Corps de la requête ---
$body = json_decode(file_get_contents('php://input'), true);
if (!is_array($body)) {
    http_response_code(400);
    echo json_encode(['error' => 'JSON invalide']);
    exit;
}

// Les valeurs DOIVENT correspondre exactement aux options de la base Notion.
$selectFields = [
    'q1'            => 'Q1 Notation commande',
    'q2_calcul'     => 'Q2 Calcul devis',
    'q2_hesitation' => 'Q2 Hésitation client',
    'q3_retrouver'  => 'Q3 Retrouver historique',
    'q3_temps'      => 'Q3 Temps recherche',
    'q5_prix'       => 'Q5 Prix /mois',
];

$title = isset($body['atelier']) ? trim((string) $body['atelier']) : '';
if ($title === '') {
    $title = 'Réponse anonyme — ' . date('d/m/Y');
}

$properties = [
    'Atelier / Ville' => ['title' => [['text' => ['content' => mb_substr($title, 0, 200)]]]],
];

foreach ($selectFields as $field => $prop) {
    if (!empty($body[$field]) && is_string($body[$field])) {
        $properties[$prop] = ['select' => ['name' => $body[$field]]];
    }
}

if (!empty($body['q4_galeres']) && is_array($body['q4_galeres'])) {
    $opts = [];
    foreach ($body['q4_galeres'] as $g) {
        if (is_string($g) && $g !== '') {
            $opts[] = ['name' => $g];
        }
    }
    if ($opts) {
        $properties['Q4 Galères'] = ['multi_select' => $opts];
    }
}

if (!empty($body['q1_logiciel'])) {
    $properties['Q1 Logiciel — lequel/manque'] = [
        'rich_text' => [['text' => ['content' => mb_substr(trim((string) $body['q1_logiciel']), 0, 2000)]]],
    ];
}

if (!empty($body['email'])) {
    $properties['Email'] = ['email' => trim((string) $body['email'])];
}

$properties['Tenez-moi informé'] = ['checkbox' => !empty($body['optin'])];

$payload = json_encode([
    'parent'     => ['database_id' => $databaseId],
    'properties' => $properties,
], JSON_UNESCAPED_UNICODE);

// --- Appel API Notion ---
$ch = curl_init('https://api.notion.com/v1/pages');
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => $payload,
    CURLOPT_HTTPHEADER     => [
        'Authorization: Bearer ' . $token,
        'Content-Type: application/json',
        'Notion-Version: 2022-06-28',
    ],
    CURLOPT_TIMEOUT        => 15,
]);
$resp = curl_exec($ch);
$code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($code < 200 || $code >= 300) {
    error_log('Notion API error ' . $code . ': ' . $resp);
    http_response_code(502);
    echo json_encode(['error' => "Échec de l'enregistrement"]);
    exit;
}

// Réponse immédiate au visiteur, puis on envoie l'alerte en arrière-plan.
echo json_encode(['ok' => true]);
if (function_exists('fastcgi_finish_request')) {
    fastcgi_finish_request();
}

// --- Alerte (WhatsApp / Telegram) ---
$cfg = $cfg ?? [];
notifierNouvelleReponse($body, $cfg);

function notifierNouvelleReponse(array $body, array $cfg): void
{
    $lignes = ['📥 Nouvelle réponse — sondage encadreurs'];
    $atelier = trim((string) ($body['atelier'] ?? ''));
    if ($atelier !== '') {
        $lignes[] = '🏠 ' . $atelier;
    }
    if (!empty($body['q5_prix'])) {
        $lignes[] = '💶 Prix : ' . $body['q5_prix'];
    }
    if (!empty($body['q1'])) {
        $lignes[] = '📝 Notation : ' . $body['q1'];
    }
    if (!empty($body['q4_galeres']) && is_array($body['q4_galeres'])) {
        $lignes[] = '⚠️ Galères : ' . implode(', ', $body['q4_galeres']);
    }
    if (!empty($body['email'])) {
        $lignes[] = '✉️ ' . $body['email'] . (!empty($body['optin']) ? ' (veut un suivi)' : '');
    }
    $message = implode("\n", $lignes);

    // WhatsApp via CallMeBot (gratuit) — https://www.callmebot.com/blog/free-api-whatsapp-messages/
    $waPhone  = getenv('WHATSAPP_PHONE')  ?: ($cfg['WHATSAPP_PHONE']  ?? '');
    $waApiKey = getenv('WHATSAPP_APIKEY') ?: ($cfg['WHATSAPP_APIKEY'] ?? '');
    if ($waPhone && $waApiKey) {
        $url = 'https://api.callmebot.com/whatsapp.php?phone=' . rawurlencode($waPhone)
            . '&text=' . rawurlencode($message)
            . '&apikey=' . rawurlencode($waApiKey);
        envoyerGet($url);
    }

    // Telegram (gratuit, robuste) — bot via @BotFather + chat_id
    $tgToken = getenv('TELEGRAM_BOT_TOKEN') ?: ($cfg['TELEGRAM_BOT_TOKEN'] ?? '');
    $tgChat  = getenv('TELEGRAM_CHAT_ID')   ?: ($cfg['TELEGRAM_CHAT_ID']   ?? '');
    if ($tgToken && $tgChat) {
        $url = 'https://api.telegram.org/bot' . $tgToken . '/sendMessage?chat_id=' . rawurlencode($tgChat)
            . '&text=' . rawurlencode($message);
        envoyerGet($url);
    }
}

function envoyerGet(string $url): void
{
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 12,
    ]);
    if (curl_exec($ch) === false) {
        error_log('Alerte échouée : ' . curl_error($ch));
    }
    curl_close($ch);
}
