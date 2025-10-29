<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Sioma API Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration for the Sioma API integration including base URL and
    | authentication token.
    |
    */

    'api_base' => env('SIOMA_API_BASE', 'https://api.sioma.dev'),

    'api_token' => env('SIOMA_API_TOKEN'),

    'timeout' => env('SIOMA_API_TIMEOUT', 30),

];