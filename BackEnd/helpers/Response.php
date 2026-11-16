<?php
/**
 * JSON response helper — Nenasala IMS
 */
class Response {

    public static function success(mixed $data = null, string $msg = 'Success', int $code = 200): void {
        http_response_code($code);
        echo json_encode(['status'=>'success','message'=>$msg,'data'=>$data]);
        exit();
    }

    public static function error(string $msg = 'Error', int $code = 400, mixed $data = null): void {
        http_response_code($code);
        echo json_encode(['status'=>'error','message'=>$msg,'data'=>$data]);
        exit();
    }

    public static function paginated(array $rows, int $total, int $page, int $perPage): void {
        http_response_code(200);
        echo json_encode([
            'status' => 'success',
            'data'   => $rows,
            'pagination' => [
                'total'       => $total,
                'page'        => $page,
                'per_page'    => $perPage,
                'total_pages' => (int)ceil($total / max(1, $perPage)),
            ],
        ]);
        exit();
    }
}
