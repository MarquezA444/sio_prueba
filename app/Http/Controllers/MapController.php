<?php

namespace App\Http\Controllers;

use App\Services\SpotValidationService;
use App\Services\PythonValidationClient;
use App\Services\ApiSiomaClient;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Maatwebsite\Excel\Facades\Excel;
use App\Imports\SpotsImport;

class MapController extends Controller
{
    protected SpotValidationService $validationService;
    protected PythonValidationClient $pythonClient;
    protected ApiSiomaClient $siomaClient;

    public function __construct(
        SpotValidationService $validationService,
        PythonValidationClient $pythonClient,
        ApiSiomaClient $siomaClient
    ) {
        $this->validationService = $validationService;
        $this->pythonClient = $pythonClient;
        $this->siomaClient = $siomaClient;
    }

    /**
     * Upload and validate spots file for map visualization
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function uploadSpots(Request $request)
    {
        // Validate request
        $validated = $request->validate([
            'file' => 'required|file|mimes:csv,xlsx,xls|max:20480', // Max 20MB
            'finca_id' => 'nullable|string',
        ]);

        try {
            // Obtener lotes válidos de la API si se seleccionó finca
            $validLotes = null;
            if (!empty($validated['finca_id'])) {
                try {
                    $lotesResponse = $this->siomaClient->getLotes($validated['finca_id']);
                    if (!isset($lotesResponse['error']) && is_array($lotesResponse)) {
                        $validLotes = collect($lotesResponse)->pluck('nombre')->toArray();
                    }
                } catch (\Exception $e) {
                    // Si falla obtener lotes, continuar sin validar lotes
                }
            }

            // Intentar usar validador Python primero (más robusto)
            if ($this->pythonClient->isHealthy()) {
                try {
                    $file = $request->file('file');
                    $filePath = $file->store('temp');
                    $fullPath = storage_path('app/' . $filePath);
                    
                    $validationResult = $this->pythonClient->validateSpots(
                        $fullPath,
                        $validated['finca_id'] ?? null,
                        $validLotes
                    );
                    
                    // Limpiar archivo temporal
                    Storage::delete($filePath);
                    
                    // Si no hay error, retornar resultado de Python
                    if (!isset($validationResult['error'])) {
                        return response()->json($validationResult);
                    }
                    
                    // Si hay error en Python, fallback a PHP
                } catch (\Exception $e) {
                    // Si falla Python, usar PHP como fallback
                }
            }
            
            // Fallback: Validar con PHP (método original)
            $sheets = Excel::toCollection(
                new SpotsImport,
                $request->file('file')
            );

            $validationResult = $this->validationService->validate(
                $sheets,
                $validated['finca_id'] ?? null
            );

            // Agregar información de qué validador se usó
            $validationResult['validator_used'] = 'php';
            
            return response()->json($validationResult);

        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'message' => 'Error al procesar el archivo: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get spots data for map visualization
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getSpotsData(Request $request)
    {
        $validated = $request->validate([
            'file' => 'required|file|mimes:csv,xlsx,xls|max:20480',
            'finca_id' => 'nullable|string',
        ]);

        try {
            $file = $request->file('file');
            $sheets = Excel::toCollection(new SpotsImport, $file);

            // Procesar datos para el mapa
            $spotsData = $this->processSpotsForMap($sheets);

            return response()->json([
                'success' => true,
                'spots' => $spotsData,
                'total_spots' => count($spotsData),
                'finca_id' => $validated['finca_id'] ?? null,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al procesar datos para el mapa: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Send validated spots to Sioma API
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function sendSpotsToSioma(Request $request)
    {
        $validated = $request->validate([
            'spots' => 'required|array',
            'spots.*.latitud' => 'required|numeric',
            'spots.*.longitud' => 'required|numeric',
            'spots.*.linea' => 'required',
            'spots.*.posicion' => 'required',
            'spots.*.lote' => 'required',
            'finca_id' => 'nullable|string',
        ]);

        try {
            $result = $this->siomaClient->sendSpots(
                $validated['spots'],
                $validated['finca_id'] ?? null
            );

            if ($result['success']) {
                return response()->json([
                    'success' => true,
                    'message' => $result['message'],
                    'data' => $result['data'] ?? null,
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => $result['message'],
                'details' => $result['details'] ?? null,
            ], 400);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al enviar datos a Sioma: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Download corrected file with error markers
     *
     * @param Request $request
     * @return \Illuminate\Http\Response
     */
    public function downloadCorrectedFile(Request $request)
    {
        $validated = $request->validate([
            'file' => 'required|file|mimes:csv,xlsx,xls|max:20480',
            'errors' => 'required|string', // JSON string of errors
        ]);

        try {
            $file = $request->file('file');
            $errors = json_decode($validated['errors'], true);

            // Procesar archivo y generar versión corregida
            $correctedData = $this->generateCorrectedFile($file, $errors);

            $fileName = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME) . '_corregido.csv';

            return response($correctedData)
                ->header('Content-Type', 'text/csv; charset=utf-8')
                ->header('Content-Disposition', 'attachment; filename="' . $fileName . '"');

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al generar archivo corregido: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get map configuration and settings
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getMapConfig()
    {
        return response()->json([
            'default_center' => [
                'lat' => 7.3365,
                'lng' => -76.7232,
            ],
            'default_zoom' => 15,
            'map_styles' => [
                'streets' => 'mapbox://styles/mapbox/streets-v12',
                'satellite' => 'mapbox://styles/mapbox/satellite-v9',
                'outdoors' => 'mapbox://styles/mapbox/outdoors-v12',
            ],
            'marker_colors' => [
                'default' => '#3b82f6',
                'error' => '#ef4444',
                'warning' => '#f59e0b',
                'success' => '#10b981',
            ],
        ]);
    }

    /**
     * Process spots data for map visualization
     *
     * @param \Illuminate\Support\Collection $sheets
     * @return array
     */
    private function processSpotsForMap($sheets)
    {
        $spotsData = [];

        foreach ($sheets as $sheet) {
            foreach ($sheet as $row) {
                if (isset($row['latitud']) && isset($row['longitud'])) {
                    $spotsData[] = [
                        'latitud' => (float) $row['latitud'],
                        'longitud' => (float) $row['longitud'],
                        'linea' => $row['linea'] ?? $row['línea'] ?? null,
                        'posicion' => (int) ($row['posicion'] ?? $row['posición'] ?? 0),
                        'lote' => $row['lote'] ?? null,
                        'grupo' => $row['grupo'] ?? null,
                        'fecha' => $row['fecha'] ?? null,
                    ];
                }
            }
        }

        return $spotsData;
    }

    /**
     * Generate corrected file with error markers
     *
     * @param \Illuminate\Http\UploadedFile $file
     * @param array $errors
     * @return string
     */
    private function generateCorrectedFile($file, $errors)
    {
        $sheets = Excel::toCollection(new SpotsImport, $file);
        $csvContent = '';
        
        foreach ($sheets as $sheetIndex => $sheet) {
            if ($sheetIndex > 0) {
                $csvContent .= "\n--- Hoja " . ($sheetIndex + 1) . " ---\n";
            }
            
            // Headers
            $headers = array_keys($sheet->first()->toArray());
            $headers[] = 'Estado';
            $csvContent .= implode(',', $headers) . "\n";
            
            // Marcar filas con errores
            $errorRows = new \SplObjectStorage();
            foreach ($errors as $errorType => $errorList) {
                if (is_array($errorList)) {
                    foreach ($errorList as $error) {
                        if (isset($error['row'])) {
                            $errorRows->attach($error['row']);
                        }
                    }
                }
            }
            
            // Data rows
            foreach ($sheet as $rowIndex => $row) {
                $rowNum = $rowIndex + 2; // +2 porque empezamos desde la fila 2 (después del header)
                $status = $errorRows->contains($rowNum) ? 'ERROR' : 'OK';
                
                $rowData = array_values($row->toArray());
                $rowData[] = $status;
                $csvContent .= implode(',', $rowData) . "\n";
            }
        }
        
        return $csvContent;
    }

    /**
     * Get spots statistics for dashboard
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getSpotsStats(Request $request)
    {
        $validated = $request->validate([
            'file' => 'required|file|mimes:csv,xlsx,xls|max:20480',
        ]);

        try {
            $file = $request->file('file');
            $sheets = Excel::toCollection(new SpotsImport, $file);
            
            $stats = $this->calculateSpotsStats($sheets);

            return response()->json([
                'success' => true,
                'stats' => $stats,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al calcular estadísticas: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Calculate spots statistics
     *
     * @param \Illuminate\Support\Collection $sheets
     * @return array
     */
    private function calculateSpotsStats($sheets)
    {
        $totalSpots = 0;
        $totalLotes = 0;
        $totalLineas = 0;
        $lotes = [];
        $lineas = [];

        foreach ($sheets as $sheet) {
            foreach ($sheet as $row) {
                if (isset($row['latitud']) && isset($row['longitud'])) {
                    $totalSpots++;
                    
                    if (isset($row['lote']) && !in_array($row['lote'], $lotes)) {
                        $lotes[] = $row['lote'];
                        $totalLotes++;
                    }
                    
                    if (isset($row['linea']) && !in_array($row['linea'], $lineas)) {
                        $lineas[] = $row['linea'];
                        $totalLineas++;
                    }
                }
            }
        }

        return [
            'total_spots' => $totalSpots,
            'total_lotes' => $totalLotes,
            'total_lineas' => $totalLineas,
            'lotes' => $lotes,
            'lineas' => $lineas,
        ];
    }
}
