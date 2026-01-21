<?php

require_once __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';

use Illuminate\Database\Seeder;

// Incluye tu archivo principal del Seeder
require_once __DIR__ . '/database/seeders/DatabaseSeeder.php';

// Ejecuta los Seeders
$seeder = new DatabaseSeeder();
$seeder->run();

echo "Seeders ejecutados correctamente.\n";
