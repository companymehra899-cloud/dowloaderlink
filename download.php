<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $videoUrl = isset($input['url']) ? trim($input['url']) : '';

    if (empty($videoUrl)) {
        echo json_encode(['error' => 'कृपया एक सही यूआरएल दर्ज करें।']);
        exit;
    }

    preg_match('%(?:youtube(?:-nocookie)?\.com/(?:[^/]+/.+/|(?:v|e(?:mbed)?)/|[^/]+\?v=)|youtu\.be/)([^"&?/\s]{11})%i', $videoUrl, $match);
    $videoId = isset($match[1]) ? $match[1] : null;

    if (!$videoId) {
        echo json_encode(['error' => 'यह एक सही YouTube लिंक नहीं है।']);
        exit;
    }

    $fetchUrl = "https://eu.org" . $videoId;

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $fetchUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 15);
    $response = curl_exec($ch);
    curl_close($ch);

    $data = json_decode($response, true);

    if (isset($data['status']) && $data['status'] === 'success') {
        echo json_encode(['url' => $data['link']]);
    } else {
        echo json_encode(['error' => 'वीडियो डाउनलोड लिंक नहीं मिल सका। कृपया दूसरा वीडियो आज़माएं।']);
    }
} else {
    echo json_encode(['error' => 'Invalid Request']);
}
?>
