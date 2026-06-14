<?php

use App\Services\SmsNotificationService;

// ── Numéros béninois ──────────────────────────────────────────────────────────

test('8 chiffres locaux → +229 préfixé', function () {
    expect(SmsNotificationService::normaliserTelephone('90123456'))->toBe('+22990123456');
    expect(SmsNotificationService::normaliserTelephone('51234567'))->toBe('+22951234567');
});

test('11 chiffres déjà préfixés 229 → inchangé', function () {
    expect(SmsNotificationService::normaliserTelephone('22990123456'))->toBe('+22990123456');
    expect(SmsNotificationService::normaliserTelephone('+22990123456'))->toBe('+22990123456');
});

test('13 chiffres avec 229 legacy → inchangé', function () {
    expect(SmsNotificationService::normaliserTelephone('2290190123456'))->toBe('+2290190123456');
});

test('10 chiffres avec 0 initial (format régional) → +229 sans le 0', function () {
    // "0190123456" → supprime le 0 initial → "190123456" (9 chiffres) → "+229190123456"
    expect(SmsNotificationService::normaliserTelephone('0190123456'))->toBe('+229190123456');
});

test('10 chiffres sans 0 initial → +229 préfixé', function () {
    expect(SmsNotificationService::normaliserTelephone('9012345678'))->toBe('+2299012345678');
});

// ── Formats avec espaces et tirets ────────────────────────────────────────────

test('numéro avec espaces est nettoyé', function () {
    expect(SmsNotificationService::normaliserTelephone('+229 90 12 34 56'))->toBe('+22990123456');
    expect(SmsNotificationService::normaliserTelephone('90 12 34 56'))->toBe('+22990123456');
});

test('numéro avec tirets est nettoyé', function () {
    expect(SmsNotificationService::normaliserTelephone('90-12-34-56'))->toBe('+22990123456');
});

// ── Numéros internationaux ────────────────────────────────────────────────────

test('numéro français (33) → format international conservé', function () {
    expect(SmsNotificationService::normaliserTelephone('+33612345678'))->toBe('+33612345678');
    expect(SmsNotificationService::normaliserTelephone('33612345678'))->toBe('+33612345678');
});

// ── Cas invalides → null ──────────────────────────────────────────────────────

test('null retourne null', function () {
    expect(SmsNotificationService::normaliserTelephone(null))->toBeNull();
});

test('chaîne vide retourne null', function () {
    expect(SmsNotificationService::normaliserTelephone(''))->toBeNull();
});

test('chaîne sans chiffres retourne null', function () {
    expect(SmsNotificationService::normaliserTelephone('abc'))->toBeNull();
    expect(SmsNotificationService::normaliserTelephone('---'))->toBeNull();
});

test('trop peu de chiffres (< 8) retourne null', function () {
    expect(SmsNotificationService::normaliserTelephone('1234567'))->toBeNull();
    expect(SmsNotificationService::normaliserTelephone('123'))->toBeNull();
});
