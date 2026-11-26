<?php
// GET /health - open this in the browser to check the server + database work.

$database = 'connected';
try {
    Database::pdo()->query('select 1');
} catch (Throwable $e) {
    error_log($e->getMessage());
    $database = 'error';
}

Response::json(['status' => 'ok', 'database' => $database], $database === 'connected' ? 200 : 500);
