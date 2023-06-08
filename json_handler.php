<?php

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $postData = json_decode(file_get_contents('php://input'), true);
    $action = $postData['action'];

    if ($action === 'load') {
        $filename = $postData['filename'];
        if ($filename !== 'data.json') {
            $filename = "files/" . $filename;
        }
        $content = file_get_contents($filename);
        echo $content;
    } elseif ($action === 'save') {
        $filename = $postData['filename'];
        if ($filename !== 'data.json') {
            $filename = "files/" . $filename;
        }
        $content = json_encode($postData['content']);
        file_put_contents($filename, $content);
        echo json_encode(['status' => 'success']);
    }
}

?>


