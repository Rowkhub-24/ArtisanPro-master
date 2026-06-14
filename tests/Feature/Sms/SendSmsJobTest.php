<?php

use App\Jobs\SendSmsJob;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;

uses(RefreshDatabase::class);

// ── Stub mode ─────────────────────────────────────────────────────────────────

test('stub provider logs and does not call HTTP', function () {
    config(['africastalking.provider' => 'stub']);
    Http::fake();

    $job = new SendSmsJob('+22990000001', 'Test stub message', 'general');
    $job->handle();

    Http::assertNothingSent();
    expect(\App\Models\SmsLog::where('recipient', '+22990000001')
        ->where('status', 'sent')
        ->exists()
    )->toBeTrue();
});

// ── Phone normalisation ───────────────────────────────────────────────────────

test('8-digit local number is normalised to E.164', function () {
    config(['africastalking.provider' => 'stub']);
    Http::fake();

    $job = new SendSmsJob('90123456', 'Normalise test', 'general');
    $job->handle();

    // Stored as +22990123456 after normalisation
    expect(\App\Models\SmsLog::where('recipient', '+22990123456')
        ->where('status', 'sent')
        ->exists()
    )->toBeTrue();
});

test('invalid phone number fails immediately without HTTP call', function () {
    config(['africastalking.provider' => 'africastalking']);
    Http::fake();

    $job = new SendSmsJob('abc', 'Bad phone', 'general');
    $job->handle();

    Http::assertNothingSent();
    expect(\App\Models\SmsLog::where('recipient', 'abc')
        ->where('status', 'failed')
        ->exists()
    )->toBeTrue();
});

// ── Africa's Talking sandbox success ─────────────────────────────────────────

test('africastalking sandbox success marks log as sent', function () {
    config([
        'africastalking.provider' => 'africastalking',
        'africastalking.username' => 'sandbox',
        'africastalking.api_key'  => 'test_key_123',
    ]);

    Http::fake([
        'api.sandbox.africastalking.com/*' => Http::response([
            'SMSMessageData' => [
                'Message'    => 'Sent to 1/1 Total Cost: 0',
                'Recipients' => [[
                    'statusCode' => 101,
                    'status'     => 'Success',
                    'number'     => '+22990000001',
                    'cost'       => 'XOF 0',
                ]],
            ],
        ], 200),
    ]);

    $job = new SendSmsJob('+22990000001', 'Hello artisan', 'confirmation', 42, 'reservation');
    $job->handle();

    expect(\App\Models\SmsLog::where('recipient', '+22990000001')
        ->where('status', 'sent')
        ->where('type', 'confirmation')
        ->where('context_id', 42)
        ->where('context_type', 'reservation')
        ->exists()
    )->toBeTrue();

    Http::assertSent(function ($request) {
        return str_contains($request->url(), 'sandbox.africastalking.com')
            && $request['to'] === '+22990000001'
            && $request['username'] === 'sandbox';
    });
});

// ── AT returns InvalidPhoneNumber (HTTP 200 + error status) ──────────────────

test('AT InvalidPhoneNumber response marks log as failed', function () {
    config([
        'africastalking.provider' => 'africastalking',
        'africastalking.username' => 'sandbox',
        'africastalking.api_key'  => 'test_key_123',
    ]);

    Http::fake([
        'api.sandbox.africastalking.com/*' => Http::response([
            'SMSMessageData' => [
                'Message'    => 'Sent to 0/1 Total Cost: 0',
                'Recipients' => [[
                    'statusCode' => 403,
                    'status'     => 'InvalidPhoneNumber',
                    'number'     => '+22900000000',
                    'cost'       => 'XOF 0',
                ]],
            ],
        ], 200),
    ]);

    $job = new SendSmsJob('+22900000000', 'Bad number test', 'general');
    $job->handle();

    expect(\App\Models\SmsLog::where('recipient', '+22900000000')
        ->where('status', 'failed')
        ->where('error_message', 'InvalidPhoneNumber')
        ->exists()
    )->toBeTrue();
});

// ── Production endpoint ───────────────────────────────────────────────────────

test('production uses correct endpoint and includes sender_id', function () {
    config([
        'africastalking.provider'  => 'africastalking',
        'africastalking.username'  => 'artisanpro_prod',
        'africastalking.api_key'   => 'prod_key',
        'africastalking.sender_id' => 'ArtisanPro',
    ]);

    Http::fake([
        'api.africastalking.com/*' => Http::response([
            'SMSMessageData' => [
                'Recipients' => [['statusCode' => 101, 'status' => 'Success']],
            ],
        ], 200),
    ]);

    $job = new SendSmsJob('+22990000002', 'Production SMS', 'paiement');
    $job->handle();

    Http::assertSent(function ($request) {
        return str_contains($request->url(), 'api.africastalking.com')
            && ! str_contains($request->url(), 'sandbox')
            && $request['from'] === 'ArtisanPro';
    });
});

test('sandbox does not send sender_id', function () {
    config([
        'africastalking.provider'  => 'africastalking',
        'africastalking.username'  => 'sandbox',
        'africastalking.api_key'   => 'test_key_123',
        'africastalking.sender_id' => 'ArtisanPro',
    ]);

    Http::fake([
        'api.sandbox.africastalking.com/*' => Http::response([
            'SMSMessageData' => [
                'Recipients' => [['statusCode' => 101, 'status' => 'Success']],
            ],
        ], 200),
    ]);

    $job = new SendSmsJob('+22990000001', 'Sandbox no sender_id', 'general');
    $job->handle();

    Http::assertSent(function ($request) {
        return ! isset($request['from']);
    });
});

// ── HTTP failure ──────────────────────────────────────────────────────────────

test('http 401 marks log as failed', function () {
    config([
        'africastalking.provider' => 'africastalking',
        'africastalking.username' => 'sandbox',
        'africastalking.api_key'  => 'bad_key',
    ]);

    Http::fake([
        'api.sandbox.africastalking.com/*' => Http::response(['error' => 'Unauthorized'], 401),
    ]);

    $job = new SendSmsJob('+22990000003', 'Fail test', 'general');
    $job->handle();

    expect(\App\Models\SmsLog::where('recipient', '+22990000003')
        ->where('status', 'failed')
        ->exists()
    )->toBeTrue();
});

// ── Queue ─────────────────────────────────────────────────────────────────────

test('job is dispatched on sms queue', function () {
    Queue::fake();

    SendSmsJob::dispatch('+22990000004', 'Queued SMS', 'bienvenue')
        ->onQueue('sms');

    Queue::assertPushedOn('sms', SendSmsJob::class);
});

// ── Missing credentials ───────────────────────────────────────────────────────

test('missing api key marks log as failed without http call', function () {
    config([
        'africastalking.provider' => 'africastalking',
        'africastalking.username' => 'sandbox',
        'africastalking.api_key'  => '',
    ]);

    Http::fake();

    $job = new SendSmsJob('+22990000005', 'No key test', 'general');
    $job->handle();

    Http::assertNothingSent();
    expect(\App\Models\SmsLog::where('recipient', '+22990000005')
        ->where('status', 'failed')
        ->exists()
    )->toBeTrue();
});
