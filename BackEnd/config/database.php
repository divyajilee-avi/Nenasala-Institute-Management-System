<?php
/**
 * Database Configuration — Nenasala IMS
 */
define('DB_HOST',    'localhost');
define('DB_USER',    'root');
define('DB_PASS',    '');
define('DB_NAME',    'nenasala_ims');
define('DB_CHARSET', 'utf8mb4');

class Database {
    private static ?Database $instance = null;
    private mysqli $conn;

    private function __construct() {
        $this->conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
        if ($this->conn->connect_error) {
            http_response_code(500);
            echo json_encode(['status'=>'error','message'=>'DB connection failed']);
            exit();
        }
        $this->conn->set_charset(DB_CHARSET);
    }

    public static function getInstance(): Database {
        if (self::$instance === null) self::$instance = new Database();
        return self::$instance;
    }

    public function getConnection(): mysqli { return $this->conn; }
}
