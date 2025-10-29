<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class PythonValidationClient
{
    protected string $baseUrl;
    protected int $timeout;

    public function __construct()
    {
        $this->baseUrl = config('services.python_validator.url', 'http://localhost:8001');
        $this->timeout = (int) config('services.python_validator.timeout', 120);
    }

    /**
     * Validate spots file using Python API
     *
     * @param string $filePath Path to the uploaded file
     * @param string|null $fincaId Optional finca ID
     * @param array|null $validLotes Optional array of valid lotes
     * @return array Validation results
     */
    public function validateSpots(string $filePath, ?string $fincaId = null, ?array $validLotes = null): array
    {
        try {
            Log::info('Sending file to Python validator', [
                'file' => basename($filePath),
                'finca_id' => $fincaId,
            ]);

            $multipart = [
                [
                    'name' => 'file',
                    'contents' => fopen($filePath, 'r'),
                    'filename' => basename($filePath),
                ],
            ];

            if ($fincaId) {
                $multipart[] = [
                    'name' => 'finca_id',
                    'contents' => $fincaId,
                ];
            }

            if ($validLotes) {
                $multipart[] = [
                    'name' => 'valid_lotes',
                    'contents' => json_encode($validLotes),
                ];
            }

            $httpClient = Http::timeout($this->timeout)->asMultipart();
            
            // Attach file
            $httpClient = $httpClient->attach('file', file_get_contents($filePath), basename($filePath));
            
            // Attach finca_id if provided
            if ($fincaId) {
                $httpClient = $httpClient->attach('finca_id', $fincaId);
            }

            // Attach valid_lotes if provided
            if ($validLotes) {
                $httpClient = $httpClient->attach('valid_lotes', json_encode($validLotes));
            }

            $response = $httpClient->post("{$this->baseUrl}/api/validate-spots");

            if ($response->successful()) {
                Log::info('Python validator response received', [
                    'ok' => $response->json('ok'),
                ]);
                return $response->json();
            }

            Log::error('Python validator error', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            return [
                'error' => true,
                'message' => 'Error en el validador Python',
                'details' => $response->json(),
            ];

        } catch (\Exception $e) {
            Log::error('Python validator exception', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return [
                'error' => true,
                'message' => 'Error de conexión con el validador: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Check if Python validator is healthy
     *
     * @return bool
     */
    public function isHealthy(): bool
    {
        try {
            $response = Http::timeout(5)->get("{$this->baseUrl}/health");
            return $response->successful();
        } catch (\Exception $e) {
            return false;
        }
    }
}