<?php
/*
 * Saytdagi buyurtmani Telegram botga yuboradi.
 *
 * Sozlash: order-config.example.php faylini order-config.php nomi bilan nusxalang
 * va ichiga bot tokeni hamda chat_id ni yozing. order-config.php GitHub'ga
 * yuklanmaydi (.gitignore), uni faqat hostingga qo'ying.
 *
 * PHP 7.0 va undan yangi versiyalarda ishlaydi.
 */

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');

function respond($status, $data)
{
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Allow: POST');
    respond(405, array('ok' => false, 'error' => 'method_not_allowed'));
}

$configFile = __DIR__ . '/order-config.php';
if (!is_file($configFile)) {
    respond(503, array('ok' => false, 'error' => 'not_configured'));
}
$config = require $configFile;
$token = isset($config['telegram_bot_token']) ? trim($config['telegram_bot_token']) : '';
$chatIds = isset($config['telegram_chat_ids']) ? (array) $config['telegram_chat_ids'] : array();
if ($token === '' || count($chatIds) === 0) {
    respond(503, array('ok' => false, 'error' => 'not_configured'));
}

// So'rov hajmi cheklangan: oddiy buyurtma 20 KB dan kichik bo'ladi
$raw = file_get_contents('php://input', false, null, 0, 20000);
$input = json_decode($raw, true);
if (!is_array($input)) {
    respond(400, array('ok' => false, 'error' => 'bad_request'));
}

// Botlar uchun tuzoq maydon to'ldirilgan bo'lsa, jim qabul qilgandek javob beramiz
if (!empty($input['website'])) {
    respond(200, array('ok' => true));
}

function field($input, $key, $max)
{
    $v = isset($input[$key]) && is_string($input[$key]) ? trim($input[$key]) : '';
    // Boshqaruv belgilarini olib tashlash (yangi qatordan tashqari)
    $v = preg_replace('/[\x00-\x09\x0B-\x1F\x7F]/u', '', $v);
    if ($v === null) {
        return '';
    }
    return function_exists('mb_substr') ? mb_substr($v, 0, $max, 'UTF-8') : substr($v, 0, $max);
}

$name = field($input, 'name', 80);
$phoneDigits = preg_replace('/\D/', '', field($input, 'phone', 20));
$text = field($input, 'text', 3500);
$items = isset($input['items']) && is_array($input['items']) ? $input['items'] : array();

if ($name === '' || !preg_match('/^998\d{9}$/', $phoneDigits) || $text === '' || count($items) === 0 || count($items) > 200) {
    respond(422, array('ok' => false, 'error' => 'invalid'));
}

// Bir IP'dan 10 daqiqada 5 tadan ko'p buyurtma qabul qilinmaydi
$ip = isset($_SERVER['REMOTE_ADDR']) ? $_SERVER['REMOTE_ADDR'] : 'unknown';
$rateFile = rtrim(sys_get_temp_dir(), '/\\') . '/asama_orders_' . md5($ip . __DIR__);
$now = time();
$recent = array();
if (is_file($rateFile)) {
    $saved = json_decode((string) @file_get_contents($rateFile), true);
    if (is_array($saved)) {
        foreach ($saved as $ts) {
            if (is_int($ts) && $ts > $now - 600) {
                $recent[] = $ts;
            }
        }
    }
}
if (count($recent) >= 5) {
    respond(429, array('ok' => false, 'error' => 'too_many_requests'));
}
$recent[] = $now;
@file_put_contents($rateFile, json_encode($recent), LOCK_EX);

// Telefon raqami server tomonida tekshirilgan qiymat bilan yuboriladi
$message = $text . "\n\n✅ Tel: +" . $phoneDigits . "\n🕒 " . date('d.m.Y H:i');

function telegram_send($token, $chatId, $message)
{
    $url = 'https://api.telegram.org/bot' . $token . '/sendMessage';
    // parse_mode yo'q: matn oddiy matn sifatida yuboriladi, HTML/Markdown talqin qilinmaydi
    $body = http_build_query(array(
        'chat_id' => $chatId,
        'text' => $message,
        'disable_web_page_preview' => 'true',
    ));

    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, array(
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $body,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CONNECTTIMEOUT => 5,
            CURLOPT_TIMEOUT => 10,
        ));
        $result = curl_exec($ch);
        $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        return $result !== false && $code === 200;
    }

    $context = stream_context_create(array('http' => array(
        'method' => 'POST',
        'header' => "Content-Type: application/x-www-form-urlencoded\r\n",
        'content' => $body,
        'timeout' => 10,
        'ignore_errors' => true,
    )));
    $result = @file_get_contents($url, false, $context);
    $decoded = $result ? json_decode($result, true) : null;
    return is_array($decoded) && !empty($decoded['ok']);
}

$sent = false;
foreach ($chatIds as $chatId) {
    if (telegram_send($token, (string) $chatId, $message)) {
        $sent = true;
    }
}

if (!$sent) {
    respond(502, array('ok' => false, 'error' => 'telegram_failed'));
}
respond(200, array('ok' => true));
