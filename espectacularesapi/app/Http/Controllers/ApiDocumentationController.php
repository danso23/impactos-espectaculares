<?php

namespace App\Http\Controllers;

class ApiDocumentationController extends Controller
{
    public function index()
    {
        $html = <<<'HTML'
<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Espectaculares API · Swagger</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css">
  <style>body{margin:0;background:#fafafa}.swagger-ui .topbar{background:#4c1d95}</style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    window.ui = SwaggerUIBundle({url:'/api-docs/openapi.json',dom_id:'#swagger-ui',deepLinking:true,persistAuthorization:true,displayRequestDuration:true,filter:true})
  </script>
</body>
</html>
HTML;

        return response($html, 200, ['Content-Type' => 'text/html; charset=UTF-8']);
    }

    public function spec()
    {
        $file = base_path('public/api-docs/openapi.json');
        if (is_file($file)) {
            return response(file_get_contents($file), 200, ['Content-Type' => 'application/json; charset=UTF-8']);
        }

        return response()->json($this->runtimeDocument(), 200, [], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    }

    private function runtimeDocument(): array
    {
        $paths = [];
        foreach (app('router')->getRoutes() as $route) {
            $path = $route['uri'];
            if (str_starts_with($path, '/api-docs')) {
                continue;
            }

            $method = strtolower($route['method']);
            $uses = $route['action']['uses'] ?? 'General';
            $controller = is_string($uses) ? class_basename(explode('@', $uses)[0]) : 'General';
            $tag = preg_replace('/Controller$/', '', $controller) ?: 'General';
            $operation = [
                'tags' => [$tag],
                'summary' => strtoupper($method) . ' ' . $path,
                'operationId' => $method . preg_replace('/[^a-zA-Z0-9]/', '', ucwords($path, '/{}-')),
                'responses' => [
                    '200' => ['description' => 'Operación exitosa'],
                    '401' => ['description' => 'No autenticado'],
                    '403' => ['description' => 'Sin permisos'],
                    '422' => ['description' => 'Error de validación'],
                ],
            ];

            preg_match_all('/{([^}]+)}/', $path, $matches);
            foreach ($matches[1] as $parameter) {
                $operation['parameters'][] = [
                    'name' => $parameter,
                    'in' => 'path',
                    'required' => true,
                    'schema' => ['type' => preg_match('/(^id$|Id$)/', $parameter) ? 'integer' : 'string'],
                ];
            }

            if (in_array($method, ['post', 'put', 'patch'], true) && !str_ends_with($path, '/logout')) {
                $operation['requestBody'] = [
                    'content' => ['application/json' => ['schema' => ['type' => 'object', 'additionalProperties' => true]]],
                ];
            }

            $middleware = $route['action']['middleware'] ?? [];
            if (in_array('authToken', (array) $middleware, true)) {
                $operation['security'] = [['bearerAuth' => []]];
            }

            $paths[$path][$method] = $operation;
        }

        ksort($paths);

        return [
            'openapi' => '3.0.3',
            'info' => [
                'title' => 'Espectaculares API',
                'version' => '1.0.0',
                'description' => 'Especificación de respaldo generada directamente desde las rutas Lumen.',
            ],
            'servers' => [['url' => '/', 'description' => 'Servidor actual']],
            'paths' => $paths,
            'components' => [
                'securitySchemes' => [
                    'bearerAuth' => ['type' => 'http', 'scheme' => 'bearer'],
                ],
            ],
        ];
    }
}
