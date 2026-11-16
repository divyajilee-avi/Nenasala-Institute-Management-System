<?php
/**
 * App bootstrap — Nenasala IMS
 * Include this at the top of every API endpoint.
 */
define('APP_NAME',    'Nenasala IT Center');
define('APP_VERSION', '1.0.0');
define('JWT_SECRET',  'N3n@sala_IMS_S3cr3t_2024!');
define('JWT_EXPIRY',  86400); // 24 h
define('UPLOAD_DIR',  __DIR__ . '/../uploads/');
define('UPLOAD_URL',  'http://localhost/Nenasala_ims/BackEnd/uploads/');

/* ── CORS ─────────────────────────────────────────────── */
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }

require_once __DIR__ . '/database.php';
require_once __DIR__ . '/../helpers/JWT.php';
require_once __DIR__ . '/../helpers/Response.php';
