<?php

namespace App\Http\Controllers;

use App\Services\ApiSiomaClient;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

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
        Log::info('SiomaController getFincas - request received');
        
        $fincas = $this->siomaClient->getFincas();
        
        Log::info('SiomaController getFincas response', [
            'response_type' => gettype($fincas),
            'response_count' => is_array($fincas) ? count($fincas) : 'not_array',
            'has_error' => isset($fincas['error']),
        ]);
        
        return response()->json($fincas);
    }

    /**
     * Get lotes from Sioma API
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getLotes(Request $request)
    {
        $fincaId = $request->query('finca_id');
        
        // Log para debugging
        Log::info('SiomaController getLotes', [
            'finca_id' => $fincaId,
            'request_params' => $request->all(),
        ]);
        
        $lotes = $this->siomaClient->getLotes($fincaId);
        
        // Log respuesta
        Log::info('SiomaController getLotes response', [
            'finca_id' => $fincaId,
            'response_type' => gettype($lotes),
            'response_count' => is_array($lotes) ? count($lotes) : 'not_array',
            'has_error' => isset($lotes['error']),
        ]);
        
        return response()->json($lotes);
    }

    /**
     * Debug endpoint to check API connection and data structure
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function debug()
    {
        try {
            // Test fincas
            $fincas = $this->siomaClient->getFincas();
            
            // Test lotes without filter
            $allLotes = $this->siomaClient->getLotes();
            
            // Test lotes with first finca if available
            $filteredLotes = null;
            if (is_array($fincas) && count($fincas) > 0 && !isset($fincas['error'])) {
                $firstFincaId = $fincas[0]['id'] ?? $fincas[0]['finca_id'] ?? null;
                if ($firstFincaId) {
                    $filteredLotes = $this->siomaClient->getLotes($firstFincaId);
                }
            }
            
            return response()->json([
                'success' => true,
                'debug_info' => [
                    'fincas' => [
                        'count' => is_array($fincas) ? count($fincas) : 'not_array',
                        'has_error' => isset($fincas['error']),
                        'first_finca' => is_array($fincas) && count($fincas) > 0 ? $fincas[0] : null,
                    ],
                    'all_lotes' => [
                        'count' => is_array($allLotes) ? count($allLotes) : 'not_array',
                        'has_error' => isset($allLotes['error']),
                        'first_lote' => is_array($allLotes) && count($allLotes) > 0 ? $allLotes[0] : null,
                    ],
                    'filtered_lotes' => [
                        'count' => is_array($filteredLotes) ? count($filteredLotes) : 'not_array',
                        'has_error' => isset($filteredLotes['error']),
                        'first_lote' => is_array($filteredLotes) && count($filteredLotes) > 0 ? $filteredLotes[0] : null,
                    ],
                ],
            ]);
            
        } catch (\Exception $e) {
            Log::error('SiomaController debug error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}