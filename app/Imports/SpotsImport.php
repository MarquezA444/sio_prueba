<?php

namespace App\Imports;

use Maatwebsite\Excel\Concerns\WithHeadingRow;

class SpotsImport implements WithHeadingRow
{
    /**
     * Normalize heading names
     * Converts: latitud, lat, latitude -> latitud
     *          longitud, lon, lng, longitude -> longitud
     *          linea, línea, line -> linea
     *          posicion, posición, position -> posicion
     */
    public function headingRow(): int
    {
        return 1;
    }
}