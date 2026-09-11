<?php

declare(strict_types=1);

$root = dirname(__DIR__);
$routesFile = $root . '/routes/web.php';
$outputDirectory = $root . '/public/api-docs';
$outputFile = $outputDirectory . '/openapi.json';
$lines = file($routesFile, FILE_IGNORE_NEW_LINES);

if ($lines === false) {
    fwrite(STDERR, "No se pudo leer {$routesFile}.\n");
    exit(1);
}

$paths = [];
$insideApiGroup = false;
$requiresAuthentication = false;
$collectionPaths = [
    '/api/users', '/api/roles', '/api/spaces', '/api/providers', '/api/services',
    '/api/collaborators', '/api/rentals', '/api/payments', '/api/leads',
    '/api/clientes', '/api/caseros', '/api/quotes',
];

foreach ($lines as $line) {
    if (str_contains($line, "['prefix' => 'api']")) {
        $insideApiGroup = true;
    }
    if (str_contains($line, "['middleware' => 'authToken']")) {
        $requiresAuthentication = true;
    }
    if (!preg_match("/\\\$router->(get|post|put|patch|delete)\\(\\s*['\"]([^'\"]+)['\"]/i", $line, $routeMatch)) {
        continue;
    }

    $method = strtolower($routeMatch[1]);
    $route = '/' . ltrim($routeMatch[2], '/');
    $path = $insideApiGroup ? '/api' . $route : $route;
    $path = $path === '//' ? '/' : $path;
    preg_match("/'uses'\\s*=>\\s*'([^']+)'/", $line, $controllerMatch);
    $controllerAction = $controllerMatch[1] ?? null;
    $controller = $controllerAction ? explode('@', $controllerAction)[0] : 'General';
    $tag = preg_replace('/Controller$/', '', $controller) ?: 'General';

    $operation = [
        'tags' => [$tag],
        'summary' => operationSummary($method, $path),
        'operationId' => operationId($method, $path),
        'responses' => standardResponses($method),
    ];

    preg_match_all('/{([^}]+)}/', $path, $parameterMatches);
    foreach ($parameterMatches[1] as $parameter) {
        $operation['parameters'][] = [
            'name' => $parameter,
            'in' => 'path',
            'required' => true,
            'schema' => ['type' => preg_match('/(^id$|Id$)/', $parameter) ? 'integer' : 'string'],
        ];
    }
    if ($method === 'get' && in_array($path, $collectionPaths, true)) {
        $operation['parameters'] = array_merge($operation['parameters'] ?? [], paginationParameters());
    }

    $requestSchema = requestSchema($method, $path);
    if ($requestSchema !== null) {
        $operation['requestBody'] = [
            'required' => in_array($method, ['post', 'put'], true),
            'content' => ['application/json' => ['schema' => $requestSchema]],
        ];
    }
    if ($requiresAuthentication) {
        $operation['security'] = [['bearerAuth' => []]];
    }
    $paths[$path][$method] = $operation;
}

ksort($paths);
$document = [
    'openapi' => '3.0.3',
    'info' => [
        'title' => 'Espectaculares API',
        'version' => '1.0.0',
        'description' => 'Documentación generada a partir de las rutas vigentes. Los endpoints protegidos requieren el access_token obtenido en /api/login.',
    ],
    'servers' => [['url' => '/', 'description' => 'Servidor actual']],
    'paths' => $paths,
    'components' => components(),
];

if (!is_dir($outputDirectory) && !mkdir($outputDirectory, 0775, true) && !is_dir($outputDirectory)) {
    fwrite(STDERR, "No se pudo crear {$outputDirectory}.\n");
    exit(1);
}
$json = json_encode($document, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
if ($json === false || file_put_contents($outputFile, $json . PHP_EOL) === false) {
    fwrite(STDERR, "No se pudo generar {$outputFile}.\n");
    exit(1);
}
fwrite(STDOUT, "OpenAPI generado en {$outputFile}\n");

function operationId(string $method, string $path): string
{
    return $method . preg_replace_callback('/[^a-zA-Z0-9]+(.)?/', fn ($match) => strtoupper($match[1] ?? ''), trim($path, '/'));
}

function operationSummary(string $method, string $path): string
{
    $specific = [
        'post /api/login' => 'Iniciar sesión',
        'post /auth/refresh' => 'Renovar token de acceso',
        'post /api/logout' => 'Cerrar sesión',
        'get /api/me' => 'Consultar usuario autenticado',
        'get /api/quote-catalogs' => 'Consultar catálogos de cotización',
        'get /api/lead-catalogs' => 'Consultar catálogos de prospectos',
        'get /api/customers/search' => 'Buscar clientes o prospectos',
    ];
    $key = $method . ' ' . $path;
    if (isset($specific[$key])) {
        return $specific[$key];
    }
    $resource = trim(preg_replace('/{[^}]+}/', '', $path), '/');
    $verbs = ['get' => 'Consultar', 'post' => 'Crear o ejecutar', 'put' => 'Actualizar', 'patch' => 'Actualizar parcialmente', 'delete' => 'Eliminar'];
    return ($verbs[$method] ?? strtoupper($method)) . ' ' . str_replace('/', ' / ', $resource);
}

function paginationParameters(): array
{
    return [
        ['name' => 'page', 'in' => 'query', 'schema' => ['type' => 'integer', 'minimum' => 1, 'default' => 1]],
        ['name' => 'per_page', 'in' => 'query', 'schema' => ['type' => 'integer', 'minimum' => 1, 'maximum' => 100, 'default' => 10]],
        ['name' => 'q', 'in' => 'query', 'description' => 'Texto de búsqueda', 'schema' => ['type' => 'string']],
    ];
}

function requestSchema(string $method, string $path): ?array
{
    if (!in_array($method, ['post', 'put', 'patch'], true) || str_ends_with($path, '/logout')) {
        return null;
    }
    $schemas = [
        '/api/login' => 'LoginRequest',
        '/auth/refresh' => 'RefreshTokenRequest',
        '/api/services' => 'ServiceInput',
        '/api/services/{id}' => 'ServiceInput',
        '/api/collaborators' => 'CollaboratorInput',
        '/api/collaborators/{id}' => 'CollaboratorInput',
    ];
    return isset($schemas[$path])
        ? ['$ref' => '#/components/schemas/' . $schemas[$path]]
        : ['type' => 'object', 'additionalProperties' => true];
}

function standardResponses(string $method): array
{
    $responses = [
        '200' => ['description' => 'Operación exitosa', 'content' => ['application/json' => ['schema' => ['$ref' => '#/components/schemas/ApiResponse']]]],
        '401' => ['description' => 'No autenticado', 'content' => ['application/json' => ['schema' => ['$ref' => '#/components/schemas/Error']]]],
        '403' => ['description' => 'Sin permisos', 'content' => ['application/json' => ['schema' => ['$ref' => '#/components/schemas/Error']]]],
        '422' => ['description' => 'Error de validación', 'content' => ['application/json' => ['schema' => ['$ref' => '#/components/schemas/ValidationError']]]],
    ];
    if ($method === 'post') {
        $responses['201'] = ['description' => 'Recurso creado', 'content' => ['application/json' => ['schema' => ['$ref' => '#/components/schemas/ApiResponse']]]];
    }
    return $responses;
}

function components(): array
{
    return [
        'securitySchemes' => [
            'bearerAuth' => ['type' => 'http', 'scheme' => 'bearer', 'description' => 'Access token devuelto por POST /api/login'],
        ],
        'schemas' => [
            'LoginRequest' => ['type' => 'object', 'required' => ['username', 'password'], 'properties' => ['username' => ['type' => 'string'], 'password' => ['type' => 'string', 'format' => 'password']]],
            'RefreshTokenRequest' => ['type' => 'object', 'required' => ['refresh_token'], 'properties' => ['refresh_token' => ['type' => 'string']]],
            'ServiceInput' => ['type' => 'object', 'required' => ['name', 'base_price', 'tax_rate'], 'properties' => [
                'key' => ['type' => 'string', 'nullable' => true, 'maxLength' => 50],
                'name' => ['type' => 'string', 'maxLength' => 150],
                'description' => ['type' => 'string', 'nullable' => true, 'maxLength' => 255],
                'base_price' => ['type' => 'number', 'format' => 'float', 'minimum' => 0],
                'tax_rate' => ['type' => 'number', 'format' => 'float', 'minimum' => 0, 'maximum' => 100],
                'is_active' => ['type' => 'boolean', 'default' => true],
            ]],
            'CollaboratorInput' => ['type' => 'object', 'required' => ['name'], 'properties' => [
                'name' => ['type' => 'string', 'maxLength' => 150],
                'position' => ['type' => 'string', 'nullable' => true, 'maxLength' => 120],
                'phone' => ['type' => 'string', 'nullable' => true, 'maxLength' => 50],
                'email' => ['type' => 'string', 'format' => 'email', 'nullable' => true, 'maxLength' => 150],
                'notes' => ['type' => 'string', 'nullable' => true],
                'active' => ['type' => 'boolean', 'default' => true],
            ]],
            'ApiResponse' => ['type' => 'object', 'additionalProperties' => true],
            'Error' => ['type' => 'object', 'properties' => ['message' => ['type' => 'string']]],
            'ValidationError' => ['type' => 'object', 'properties' => ['message' => ['type' => 'string'], 'errors' => ['type' => 'object', 'additionalProperties' => ['type' => 'array', 'items' => ['type' => 'string']]]]],
        ],
    ];
}
