<?php

namespace App\Http\Controllers;

use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Foundation\Validation\ValidatesRequests;
use Illuminate\Routing\Controller as BaseController;
use OpenApi\Attributes as OA;

#[OA\Info(version: "1.0.0", title: "Ticket Sales API")]
#[OA\Server(url: "http://127.0.0.1:8000")]

class Controller extends BaseController
{
    use AuthorizesRequests, ValidatesRequests;

    #[OA\Get(
        path: "/api/health-check",
        summary: "Check API Status",
        responses: [
            new OA\Response(response: 200, description: "API is functional")
        ]
    )]
    public function healthCheck()
    {
        return response()->json(['status' => 'ok']);
    }
}