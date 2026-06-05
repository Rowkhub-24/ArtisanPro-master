<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        <title inertia>{{ config('app.name', 'Laravel') }}</title>

        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin=""/>

        @routes
        @viteReactRefresh
        @vite(['resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
        @inertiaHead
        <meta name="csrf-token" content="{{ csrf_token() }}">
        <meta name="user-id" content="{{ $page['props']['auth']['user']['id'] ?? '' }}">
        {{-- KkiaPay CDN chargé en defer pour être disponible dès que React monte --}}
        <script src="https://cdn.kkiapay.me/k.js" defer></script>
    </head>
    <body class="font-sans antialiased">
        @inertia
    </body>
</html>
