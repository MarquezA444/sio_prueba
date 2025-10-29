<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ApiSiomaClient
{
    protected string $baseUrl;
    protected string $token;
    protected int $timeout;

    public function __construct()
    {
        $this->baseUrl = config('sioma.api_base');
        $this->token = config('sioma.api_token');
        $this->timeout = (int) config('sioma.timeout', 30);
        
        // Log configuration for debugging
        Log::debug('ApiSiomaClient initialized', [
            'base_url' => $this->baseUrl,
            'token_set' => !empty($this->token),
            'token_preview' => $this->token ? substr($this->token, 0, 10) . '...' : 'NOT SET',
            'timeout' => $this->timeout,
        ]);
    }

    /**
     * Get sujetos from Sioma API
     *
     * @param array $tipoSujetos Array of tipo-sujetos IDs (e.g., [1] for fincas, [3] for lotes)
     * @return array
     */
    public function getSujetos(array $tipoSujetos): array
    {
        try {
            $url = "{$this->baseUrl}/4/usuarios/sujetos";
            
            // Log request details for debugging
            Log::info('Sioma API Request', [
                'url' => $url,
                'tipo_sujetos' => $tipoSujetos,
                'headers' => [
                    'Authorization' => substr($this->token, 0, 10) . '...',
                    'Content-Type' => 'application/json',
                    'tipo-sujetos' => json_encode($tipoSujetos),
                ],
            ]);

            // Build HTTP client
            $httpClient = Http::timeout($this->timeout)
                ->withHeaders([
                    'Authorization' => $this->token,
                    'Content-Type' => 'application/json',
                    'tipo-sujetos' => json_encode($tipoSujetos),
                ]);

            // Disable SSL verification in development environment
            if (config('app.env') !== 'production') {
                $httpClient = $httpClient->withoutVerifying();
                Log::debug('SSL verification disabled (development mode)');
            }

            $response = $httpClient->get($url);

            // Log response status
            Log::info('Sioma API Response', [
                'status' => $response->status(),
                'successful' => $response->successful(),
                'body_preview' => substr($response->body(), 0, 200),
            ]);

            if ($response->successful()) {
                return $response->json();
            }

            Log::error('Sioma API error', [
                'status' => $response->status(),
                'body' => $response->body(),
                'headers' => $response->headers(),
            ]);

            return [
                'error' => true,
                'message' => 'Error al obtener datos de Sioma',
                'status' => $response->status(),
                'body' => $response->body(),
            ];
        } catch (\Exception $e) {
            Log::error('Sioma API exception', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'url' => $url ?? 'unknown',
            ]);

            return [
                'error' => true,
                'message' => 'Error de conexión con Sioma: ' . $e->getMessage(),
                'details' => [
                    'base_url' => $this->baseUrl,
                    'token_configured' => !empty($this->token),
                    'exception_class' => get_class($e),
                ],
            ];
        }
    }

    /**
     * Get fincas (tipo-sujetos: [1])
     *
     * @return array
     */
    public function getFincas(): array
    {
        return $this->getSujetos([1]);
    }

    /**
     * Get lotes (tipo-sujetos: [3])
     *
     * @return array
     */
    public function getLotes(): array
    {
        return $this->getSujetos([3]);
    }

    /**
     * Send spots data to Sioma API
     *
     * @param array $spotsData Array of spots to send
     * @param string|null $fincaId Finca ID
     * @return array
     */
    public function sendSpots(array $spotsData, ?string $fincaId = null): array
    {
        try {
            // TODO: Ajustar endpoint según documentación de API Sioma
            $url = "{$this->baseUrl}/4/puntos";
            
            Log::info('Sending spots to Sioma API', [
                'url' => $url,
                'spots_count' => count($spotsData),
                'finca_id' => $fincaId,
            ]);

            $payload = [
                'spots' => $spotsData,
            ];

            if ($fincaId) {
                $payload['finca_id'] = $fincaId;
            }

            $httpClient = Http::timeout($this->timeout)
                ->withHeaders([
                    'Authorization' => $this->token,
                    'Content-Type' => 'application/json',
                ]);

            if (config('app.env') !== 'production') {
                $httpClient = $httpClient->withoutVerifying();
            }

            $response = $httpClient->post($url, $payload);

            Log::info('Sioma API send response', [
                'status' => $response->status(),
                'successful' => $response->successful(),
            ]);

            if ($response->successful()) {
                return [
                    'success' => true,
                    'data' => $response->json(),
                    'message' => 'Spots enviados exitosamente',
                ];
            }

            Log::error('Sioma API send error', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            return [
                'success' => false,
                'error' => true,
                'message' => 'Error al enviar spots a Sioma',
                'status' => $response->status(),
                'details' => $response->json(),
            ];
        } catch (\Exception $e) {
            Log::error('Sioma API send exception', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return [
                'success' => false,
                'error' => true,
                'message' => 'Error de conexión al enviar a Sioma: ' . $e->getMessage(),
            ];
        }
    }
}