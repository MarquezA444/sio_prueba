<?php

namespace App\Http\Controllers;

use App\Imports\SpotsImport;
use App\Services\SpotValidationService;
use App\Services\PythonValidationClient;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class SpotController extends Controller
{
    protected SpotValidationService $validationService;
    protected PythonValidationClient $pythonClient;

    public function __construct(SpotValidationService $validationService, PythonValidationClient $pythonClient)
    {
        $this->validationService = $validationService;
        $this->pythonClient = $pythonClient;
    }

    /**
     * Upload and validate spots file
     * Intenta usar Python primero, luego PHP como fallback
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function upload(Request $request)
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
                    $lotesResponse = app(\App\Services\ApiSiomaClient::class)->getLotes();
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
            $sheets = \Maatwebsite\Excel\Facades\Excel::toCollection(
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
     * Download corrected file with error markers
     *
     * @param Request $request
     * @return \Symfony\Component\HttpFoundation\StreamedResponse
     */
    public function downloadCorrected(Request $request)
    {
        $validated = $request->validate([
            'file' => 'required|file|mimes:csv,xlsx,xls|max:20480',
            'errors' => 'required|string', // JSON string from frontend
        ]);

        try {
            $file = $validated['file'];
            $errors = json_decode($validated['errors'], true);
            
            if (!$errors || !is_array($errors)) {
                return response()->json(['error' => 'Invalid errors format'], 400);
            }
            
            // Read file
            $sheets = \Maatwebsite\Excel\Facades\Excel::toCollection(
                new SpotsImport,
                $file
            );
            
            $rows = $sheets->flatten(1);
            
            // Extract headers from first row
            $firstRow = $rows->first();
            $headers = array_keys($firstRow->toArray());
            
            // Identify rows to remove
            $rowsToRemove = new \Illuminate\Support\Collection();
            
            // Process errors to identify duplicated rows (keep first, remove duplicates)
            foreach ($errors as $errorType => $errorList) {
                if (is_array($errorList)) {
                    foreach ($errorList as $error) {
                        if (isset($error['row'])) {
                            $rowsToRemove->push($error['row']);
                        }
                    }
                }
            }
            
            // Generate CSV content
            $output = fopen('php://temp', 'r+');
            
            // Write headers
            fputcsv($output, array_merge($headers, ['Estado', 'Errores']));
            
            // Write rows (filter out duplicate rows)
            foreach ($rows as $index => $row) {
                $rowNumber = $index + 2; // +2 for header and 0-index
                
                // Skip rows marked for removal (duplicates)
                if ($rowsToRemove->contains($rowNumber)) {
                    continue;
                }
                
                // Get error types for this row
                $errorTypes = [];
                foreach ($errors as $errorType => $errorList) {
                    if (is_array($errorList)) {
                        foreach ($errorList as $error) {
                            if (isset($error['row']) && $error['row'] == $rowNumber) {
                                $errorTypes[] = $errorType;
                            }
                        }
                    }
                }
                
                $status = empty($errorTypes) ? 'OK' : 'WARNING';
                $rowArray = array_values($row->toArray());
                fputcsv($output, array_merge($rowArray, [$status, implode(', ', $errorTypes)]));
            }
            
            rewind($output);
            
            $filename = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME) . '_corregido.csv';
            
            return response()->streamDownload(function () use ($output) {
                echo stream_get_contents($output);
                fclose($output);
            }, $filename, [
                'Content-Type' => 'text/csv; charset=utf-8',
                'Content-Disposition' => 'attachment; filename="' . $filename . '"',
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'message' => 'Error al generar archivo corregido: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Send validated spots to Sioma API
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function sendToSioma(Request $request)
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
            $siomaClient = app(\App\Services\ApiSiomaClient::class);
            
            $result = $siomaClient->sendSpots(
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
}