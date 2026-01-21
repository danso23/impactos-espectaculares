frontend/
├── public/
│   └── vite.svg
│
├── src/
│   ├── assets/                   # Imágenes, logos, recursos estáticos
│
│   ├── components/
│   │   ├── auth/                 # Componentes de autenticación
│   │   │   └── logout-button.tsx
│   │   │
│   │   ├── layout/               # Layouts (sidebar, topbar, etc.)
│   │   │
│   │   └── ui/                   # Componentes shadcn/ui
│   │       ├── alert-dialog.tsx
│   │       ├── button.tsx
│   │       ├── scroll-area.tsx
│   │       ├── sheet.tsx
│   │       └── ...
│
│   ├── pages/
│   │   ├── auth/
│   │   │   └── login.tsx
│   │   │
│   │   ├── usuarios/
│   │   │   └── index.tsx
│   │   │
│   │   ├── clientes/
│   │   ├── proveedores/
│   │   ├── caseros/
│   │   ├── rentas/
│   │   ├── pagos/
│   │   └── ...
│
│   ├── routes/
│   │   └── ProtectedRoute.tsx
│
│   ├── lib/
│   │   └── utils.ts              # Funciones utilitarias (cn, helpers)
│
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
│
├── .env                          # Variables de entorno
├── package.json
├── tsconfig.json
└── vite.config.ts


backend/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── AuthController.php
│   │   │   ├── UserController.php
│   │   │   └── ...
│   │   │
│   │   └── Middleware/
│   │       └── Authenticate.php
│   │
│   ├── Models/
│   │   └── Entities/
│   │       └── User.php
│   │
│   └── Providers/
│
├── bootstrap/
│   └── app.php
│
├── config/
│   └── auth.php                  # Configuración de guards (api_token)
│
├── database/
│   ├── migrations/
│   └── seeders/
│
├── resources/
│   └── views/
│       └── emails/
│           └── password-reset.blade.php
│
├── routes/
│   └── web.php
│
├── public/
│   └── index.php
│
├── storage/
│
├── vendor/
│
├── .env
├── composer.json
└── artisan


## Checklist de Producción

- [ ] Variables de entorno configuradas
- [ ] APP_DEBUG=false
- [ ] HTTPS habilitado
- [ ] Base de datos respaldada
- [ ] Tokens inválidos en logout
- [ ] Build frontend generado

