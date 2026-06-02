<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Africa's Talking SMS Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration for Africa's Talking SMS gateway.
    | Compatible with Orange Benin and MTN Benin.
    |
    | Sandbox : set username to "sandbox" — uses sandbox endpoint automatically.
    | Production : set username to your AT app username.
    |
    */

    'username'  => env('AFRICASTALKING_USERNAME', 'sandbox'),
    'api_key'   => env('AFRICASTALKING_API_KEY', ''),
    'sender_id' => env('AFRICASTALKING_SENDER_ID', 'ArtisanPro'),

    /*
    | Endpoints
    */
    'endpoints' => [
        'sandbox'    => 'https://api.sandbox.africastalking.com/version1/messaging',
        'production' => 'https://api.africastalking.com/version1/messaging',
    ],

    /*
    | SMS Provider toggle
    | 'africastalking' = real sending
    | 'stub'           = log only (no HTTP call)
    */
    'provider' => env('SMS_PROVIDER', 'stub'),

    /*
    | Retry configuration for failed SMS
    */
    'retry' => [
        'times' => 3,
        'sleep' => 5, // seconds between retries
    ],

    /*
    | Estimated cost per SMS in XOF (for admin dashboard display)
    */
    'cost_per_sms_xof' => 25,
];
