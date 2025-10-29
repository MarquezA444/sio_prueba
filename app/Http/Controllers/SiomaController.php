<?php

namespace App\Http\Controllers;

use App\Services\ApiSiomaClient;
use Illuminate\Http\Request;

class SiomaController extends Controller
{
    protected ApiSiomaClient $siomaClient;

    public function __construct(ApiSiomaClient $siomaClient)
    {
        $this->siomaClient = $siomaClient;
    }

    /**
     * Get fincas from Sioma API
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getFincas()
    {
        $fincas = $this->siomaClient->getFincas();
        return response()->json($fincas);
    }

    /**
     * Get lotes from Sioma API
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getLotes()
    {
        $lotes = $this->siomaClient->getLotes();
        return response()->json($lotes);
    }
}