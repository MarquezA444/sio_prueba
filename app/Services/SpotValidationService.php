<?php

namespace App\Services;

use Illuminate\Support\Collection;

class SpotValidationService
{
    protected ApiSiomaClient $siomaClient;

    public function __construct(ApiSiomaClient $siomaClient)
    {
        $this->siomaClient = $siomaClient;
    }

    /**
     * Validate spots data from uploaded file
     *
     * @param Collection $sheets Collection of sheets from Excel file
     * @param string|null $fincaId Selected finca ID
     * @return array Validation summary
     */
    public function validate(Collection $sheets, ?string $fincaId = null): array
    {
        $allRows = $this->flattenSheets($sheets);
        $totalRows = $allRows->count();

        // Normalize column names
        $normalizedRows = $this->normalizeColumns($allRows);

        // Detect columns
        $columnsDetected = $normalizedRows->isNotEmpty() 
            ? array_keys($normalizedRows->first()) 
            : [];

        // Initialize error arrays
        $errors = [
            'coords_duplicadas' => [],
            'linea_duplicada_en_lote' => [],
            'posicion_duplicada_en_linea' => [],
            'lote_invalido' => [],
            'rango_coord' => [],
            'columnas_faltantes' => [],
            'valores_vacios' => [],
        ];

        $warnings = [];

        // Check required columns
        $requiredColumns = ['latitud', 'longitud', 'linea', 'posicion', 'lote'];
        $missingColumns = array_diff($requiredColumns, $columnsDetected);
        
        if (!empty($missingColumns)) {
            $errors['columnas_faltantes'] = $missingColumns;
            return [
                'meta' => [
                    'rows_total' => $totalRows,
                    'sheets' => $sheets->count(),
                ],
                'columns_detected' => $columnsDetected,
                'errors' => $errors,
                'warnings' => $warnings,
                'ok' => false,
            ];
        }

        // Get valid lotes from API if finca is selected
        $validLotes = [];
        if ($fincaId) {
            $lotesResponse = $this->siomaClient->getLotes();
            if (!isset($lotesResponse['error'])) {
                // Extract lote identifiers from API response
                // Adjust this based on actual API response structure
                $validLotes = collect($lotesResponse)->pluck('nombre')->toArray();
            }
        }

        // Track coordinates for duplicate detection
        $coordsMap = [];
        $loteLineasMap = [];
        $lineaPosicionMap = [];

        foreach ($normalizedRows as $index => $row) {
            $rowNumber = $index + 2; // +2 because of 0-index and header row

            // Check for empty required values
            foreach ($requiredColumns as $col) {
                if (empty($row[$col]) && $row[$col] !== 0 && $row[$col] !== '0') {
                    $errors['valores_vacios'][] = [
                        'row' => $rowNumber,
                        'column' => $col,
                    ];
                }
            }

            $lat = $row['latitud'] ?? null;
            $lon = $row['longitud'] ?? null;
            $linea = $row['linea'] ?? null;
            $posicion = $row['posicion'] ?? null;
            $lote = $row['lote'] ?? null;

            // Validate coordinate ranges
            if ($lat !== null && is_numeric($lat)) {
                if ($lat < -90 || $lat > 90) {
                    $errors['rango_coord'][] = [
                        'row' => $rowNumber,
                        'field' => 'latitud',
                        'value' => $lat,
                    ];
                }
            }

            if ($lon !== null && is_numeric($lon)) {
                if ($lon < -180 || $lon > 180) {
                    $errors['rango_coord'][] = [
                        'row' => $rowNumber,
                        'field' => 'longitud',
                        'value' => $lon,
                    ];
                }
            }

            // Check duplicate coordinates
            if ($lat !== null && $lon !== null) {
                $coordKey = "{$lat},{$lon}";
                if (isset($coordsMap[$coordKey])) {
                    $errors['coords_duplicadas'][] = [
                        'row' => $rowNumber,
                        'duplicate_of_row' => $coordsMap[$coordKey],
                        'lat' => $lat,
                        'lon' => $lon,
                    ];
                } else {
                    $coordsMap[$coordKey] = $rowNumber;
                }
            }

            // Check duplicate lineas within lote
            // IMPORTANTE: Una línea puede tener múltiples posiciones, eso es normal
            // Solo es error si se repite la misma línea EN LA MISMA posición dentro del mismo lote
            if ($lote !== null && $linea !== null) {
                $loteKey = (string)$lote;
                $lineaKey = "{$lote}_{$linea}";
                
                if (!isset($loteLineasMap[$loteKey])) {
                    $loteLineasMap[$loteKey] = [];
                }
                
                // Crear clave única combinando línea + posición
                $posicionStr = $posicion !== null ? (string)$posicion : 'sin-pos';
                $lineaPosKey = "{$linea}_{$posicionStr}";
                
                if (isset($loteLineasMap[$loteKey][$lineaPosKey])) {
                    $errors['linea_duplicada_en_lote'][] = [
                        'lote' => $lote,
                        'linea' => $linea,
                        'posicion' => $posicion,
                        'row' => $rowNumber,
                        'duplicate_of_row' => $loteLineasMap[$loteKey][$lineaPosKey],
                    ];
                } else {
                    $loteLineasMap[$loteKey][$lineaPosKey] = $rowNumber;
                }
            }

            // Check duplicate posiciones within linea
            if ($lote !== null && $linea !== null && $posicion !== null) {
                $lineaKey = "{$lote}_{$linea}";
                if (!isset($lineaPosicionMap[$lineaKey])) {
                    $lineaPosicionMap[$lineaKey] = [];
                }
                
                if (isset($lineaPosicionMap[$lineaKey][$posicion])) {
                    $errors['posicion_duplicada_en_linea'][] = [
                        'lote' => $lote,
                        'linea' => $linea,
                        'posicion' => $posicion,
                        'row' => $rowNumber,
                        'duplicate_of_row' => $lineaPosicionMap[$lineaKey][$posicion],
                    ];
                } else {
                    $lineaPosicionMap[$lineaKey][$posicion] = $rowNumber;
                }
            }

            // Validate lote against API
            if ($lote !== null && !empty($validLotes)) {
                if (!in_array($lote, $validLotes)) {
                    $errors['lote_invalido'][] = [
                        'row' => $rowNumber,
                        'lote' => $lote,
                    ];
                }
            }
        }

        // Remove empty error categories
        $errors = array_filter($errors, fn($e) => !empty($e));

        $hasErrors = !empty($errors);

        return [
            'meta' => [
                'rows_total' => $totalRows,
                'sheets' => $sheets->count(),
            ],
            'columns_detected' => $columnsDetected,
            'errors' => $errors,
            'warnings' => $warnings,
            'ok' => !$hasErrors,
        ];
    }

    /**
     * Flatten all sheets into a single collection
     */
    protected function flattenSheets(Collection $sheets): Collection
    {
        return $sheets->flatten(1);
    }

    /**
     * Normalize column names to standard format
     */
    protected function normalizeColumns(Collection $rows): Collection
    {
        return $rows->map(function ($row) {
            $normalized = [];
            
            foreach ($row as $key => $value) {
                $key = strtolower(trim($key));
                
                // Normalize latitud
                if (in_array($key, ['latitud', 'lat', 'latitude'])) {
                    $normalized['latitud'] = $value;
                }
                // Normalize longitud
                elseif (in_array($key, ['longitud', 'lon', 'lng', 'longitude'])) {
                    $normalized['longitud'] = $value;
                }
                // Normalize linea
                elseif (in_array($key, ['linea', 'línea', 'line', 'linea_palma'])) {
                    $normalized['linea'] = $value;
                }
                // Normalize posicion
                elseif (in_array($key, ['posicion', 'posición', 'position', 'posicion_palma'])) {
                    $normalized['posicion'] = $value;
                }
                // Normalize lote
                elseif (in_array($key, ['lote', 'lot'])) {
                    $normalized['lote'] = $value;
                }
                else {
                    $normalized[$key] = $value;
                }
            }
            
            return $normalized;
        });
    }
}