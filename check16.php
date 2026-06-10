<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();
$a = \DB::table('artisans')->where('id', 16)->first();
echo "tarifs_horaire = [" . var_export($a->tarifs_horaire, true) . "]\n";
echo "metier = [{$a->metier}]\n";
